# HappyPack (beta) [![Build Status](https://travis-ci.org/amireh/happypack.svg?branch=master)](https://travis-ci.org/amireh/happypack) [![codecov.io](https://codecov.io/github/amireh/happypack/coverage.svg?branch=master)](https://codecov.io/github/amireh/happypack?branch=master)

Make working with webpack against large code-bases a happier experience.

_In a nutshell:_

HappyPack makes webpack builds faster by allowing you to transform multiple
files _in parallel_.

See "How it works" below for more details.

## Motivation

- webpack initial build times are horrifying in large codebases (3k+ modules)
- something that works against both a one-time build (e.g. for a CI) and with 
  persistent processes (`--watch` during development)

## Usage

```
npm install --save-dev happypack
```

In your `webpack.config.js`, you need to use the plugin and tell it of the
loaders it should use to transform the sources. ~~Note that you must specify
the absolute paths for these loaders as we do not use webpack's loader resolver
at this point.~~

```javascript
var HappyPack = require('happypack');

exports.plugins = [
  new HappyPack({ 
    // loaders is the only required parameter:
    loaders: [ 'babel?presets[]=es2015' ],

    // customize as needed, see Configuration below
  })
];
```

Now you replace your current JS loaders with HappyPack's (possibly use an env
variable to enable HappyPack):

```javascript
exports.module = {
  loaders: {
    test: /.js$/,
    loader: 'happypack/loader',
    include: [
      // ...
    ],
  }
};
```

That's it. Now sources that match `.js$` will be handed off to happypack which 
will use the loaders you specified to transform them.

## Configuration

These are the parameters you can pass to the plugin when you instantiate it.

### `loaders: Array.<String|Object{path: String, query: String}>`

Each loader entry consists of an **absolute** path to the module that would 
transform the files and an optional query string to pass to it.

> *NOTE*
> 
> HappyPack at this point doesn't work with *all* webpack loaders as the 
> loader API is not fully ported yet.
> 
> See [this wiki page](https://github.com/amireh/happypack/wiki/Webpack-Loader-API-Support)
> for more details on current API support.

The "synchronous" loader signature is:

    (source: String, map: ?) -> String

`source` will be the string contents of the file being transformed. The second
parameter, `map`, is currently not supported. In the future, it should point to
the input source map for the file - if any.

You can emit both a source and a map using `this.callback`:

    this.callback(null, code, map);

And you can do it asynchronously by calling `this.async`:

    var callback = this.async();
    someAsyncRoutine(function() {
      callback(null, code, map);
    });

### `id: String`

A unique id for this happy plugin. This is used to generate the default cache
name and is used by the loader to know which plugin it's supposed to talk to.

Normally, you would not need to specify this unless you have more than one 
HappyPack plugin defined, in which case you'll need distinct IDs to tell them 
apart. See "Using multiple instances" below for more information on that.

Defaults to: "1"

### `tempDir: String`

Path to a folder where happy's cache and junk files will be kept. It's safe to 
remove this folder after a run but not during it!

Defaults to: `.happypack/`

### `cache: Boolean`

Whether HappyPack should re-use the compiled version of source files if their
contents have not changed since the last compilation time (assuming they have
been compiled, of course.)

Recommended!

Defaults to: `true`

### `cachePath: String`

Path to a file where the JSON cache will be saved to disk and read from on 
successive webpack runs.

Defaults to `.happypack/cache--[id].json`

### `cacheContext: Object`

An object that is used to invalidate the cache between runs based on whatever
variables that might affect the transformation of your sources, like `NODE_ENV`
for example.

You should provide this if you perform different builds based on some external
parameters. **THIS OBJECT MUST BE JSON-SERIALIZABLE**.

Defaults to: `{}`

### `threads: Number`

This number indicates how many Node VMs HappyPack will spawn for compiling
the source files. After a lot of tinkering, I found 4 to yield the best
results. There's certainly a diminishing return on this value and increasing
beyond 8 actually slowed things down for me.

Keep in mind that this is only relevant when performing **the initial build**
as HappyPack will switch into a synchronous mode afterwards (i.e. in `watch`
mode.) Also, if we're using the cache and the compiled versions are indeed
cached, the threads will be idle.

### `installExitHandler: Boolean`

Whether we should intercept the process's `SIGINT` and clean up when it is 
received. This is needed because webpack's CLI does not expose any hook for
cleaning up when it is going down, so it's a good idea to hook into it.

You can turn this off if you don't want this functionality or it gives you
trouble.

Defaults to: `true`

## How it works

![A diagram showing the flow between HappyPack's components](doc/HappyPack_Workflow.png)

HappyPack sits between webpack and your primary source files (like JS sources)
where the bulk of loader transformations happen. Every time webpack resolves
a module, HappyPack will take it and all its dependencies, find out if they
need to be compiled[1], and if they do, it distributes those files to multiple
worker "threads".

Those threads are actually simple node processes that invoke your transformer.
When the compiled version is retrieved, HappyPack serves it to its loader and
eventually your chunk.

[1] When HappyPack successfully compiles a source file, it keeps track of its
mtime so that it can re-use it on successive builds if the contents have not
changed. This is a fast and somewhat reliable approach, and definitely much 
faster than re-applying the transformers on every build.

## Using multiple instances

It's possible to define multiple HappyPack plugins for different types of
sources/transformations. Just pass in a unique id for each plugin and make
sure you pass it their loaders. For example:

```javascript
// @file webpack.config.js
exports.plugins = [
  new HappyPack({
    id: 'jsx',
    threads: 4,
    loaders: [ 'babel-loader' ]
  }),

  new HappyPack({
    id: 'coffeescripts',
    threads: 2,
    loaders: [ 'coffee-loader' ]
  })
];

exports.module.loaders = [
  {
    test: /\.js$/,
    loaders: 'happypack/loader?id=jsx'
  },

  {
    test: /\.coffee$/,
    loader: 'happypack/loader?id=coffeescripts'
  },
]
```

Now `.js` files will be handled by the first Happy plugin which will use
`babel-loader` to transform them, while `.coffee` files will be handled
by the second one using the `coffee-loader` as a transformer.

Note that each plugin will properly use different cache files as the default
cache file names include the plugin IDs, so you don't need to override them
manually. Yay!

## Benchmarks

For the main repository I tested on, which had around 3067 modules, the build time went down from 39 seconds to a whopping ~10 seconds when there was yet no 
cache. Successive builds now take between 6 and 7 seconds.

Here's a rundown of the various states the build was performed in:

Elapsed (ms) | Happy?  | Cache enabled? | Cache present? | Using DLLs? |
------------ | ------- | -------------- | -------------- | ----------- |
39851        | NO      | N/A            | N/A            | NO          |
37393        | NO      | N/A            | N/A            | YES         |
14605        | YES     | NO             | N/A            | NO          |
13925        | YES     | YES            | NO             | NO          |
11877        | YES     | YES            | YES            | NO          |
9228         | YES     | NO             | N/A            | YES         |
9597         | YES     | YES            | NO             | YES         |
6975         | YES     | YES            | YES            | YES         |

The builds above were run on Linux over a machine with 12 cores.

_TODO: test against other projects_

## Changes

**1.1.4**

- Fixed an issue where the cache was being improperly invalidated due to `cacheContext` not being stored properly (#17, thanks to @blowery)

**1.1.3**

- Fixed an issue where the initial cache was not being saved properly

**1.1.2**

- Fixed an issue on old node versions (0.10) with the EventEmitter API (#10)
- Fixed an issue that was breaking the compiler if an invalid `threads` option
  was passed (evaluating to `NaN`)

**1.1.1**

- Unrecognized and invalid config parameters will cause the process to abort.
- The active version is logged on launch.

**1.1.0**

- now supporting basic webpack loaders
- dropped the `transformer` parameter as it's no longer needed
- `cache` now defaults to `true`
- now using a forking model utilizing node.js's `process.fork()` for cleaner
  threading code

**1.0.2**

- the loader will now accept IDs that aren't just numbers
