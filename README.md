# HappyPack [![Build Status](https://travis-ci.org/amireh/happypack.svg?branch=master)](https://travis-ci.org/amireh/happypack) [![codecov.io](https://codecov.io/github/amireh/happypack/coverage.svg?branch=master)](https://codecov.io/github/amireh/happypack?branch=master)

_In a nutshell:_

HappyPack makes webpack builds faster by allowing you to transform multiple
files _in parallel_.

See "How it works" below for more details.

## Motivation

- webpack initial build times are horrifying in large codebases (3k+ modules)
- something that works against both a one-time build (e.g. for a CI) and
  continuous builds (i.e. `--watch` during development)

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

Now you replace your current loaders with HappyPack's loader (possibly use an
env variable to enable HappyPack):

```javascript
exports.module = {
  loaders: {
    test: /.js$/,
    loaders: [ 'happypack/loader' ],
    include: [
      // ...
    ],
  }
};
```

That's it. Now sources that match `.js$` will be handed off to happypack which
will transform them in parallel using the loaders you specified.

## Configuration

These are the parameters you can pass to the plugin when you instantiate it.

### `loaders: Array.<String|Object{path: String, query: String}>`

Each loader entry consists of the name or path of loader that would
transform the files and an optional query string to pass to it. This looks
similar to what you'd pass to webpack's `loader` config.

> **NOTE**
>
> HappyPack doesn't work with *all* webpack loaders as some loader API are not
> supported.
>
> See [this wiki page](https://github.com/amireh/happypack/wiki/Webpack-Loader-API-Support)
> for more details on current Loader API support.

~~It is possible to omit this value and have HappyPack automatically infer the
loaders it should use, see "Inferring loaders" below for more information~~ 
Inferring loaders has been officially removed as of HappyPack 3.0 and will not
be re-introduced (in its previous form, at least) as it has proven to be too 
costly for the gain it provided.

### `id: String`

A unique id for this happy plugin. This is used to generate the default cache
name and is used by the loader to know which plugin it's supposed to talk to.

Normally, you would not need to specify this unless you have more than one
HappyPack plugin defined, in which case you'll need distinct IDs to tell them
apart. See "Using multiple instances" below for more information on that.

Defaults to: "1"

### `enabled: Boolean`

Whether the plugin should be activated. This is for convenience when you want
to conditionally disable HappyPack based on, for example, an environment
variable.

Defaults to `true`

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

E.g. 

```
cacheContext: {
  env: process.env.NODE_ENV
}
```

Defaults to: `{}`

### `cacheSignatureGenerator: Function`

A function that computes a signature for a file. This signature is used by
the cache to figure out whether the file contents have changed since the
last time it was compiled.

The function signature is:

    (filePath: String) -> String

Defaults to: a function that yields the `last-modified-at` (mtime) timestamp
of the given file.

### `threads: Number`

This number indicates how many Node VMs HappyPack will spawn for compiling
the source files. After a lot of tinkering, I found 4 to yield the best
results. There's certainly a diminishing return on this value and increasing
beyond 8 actually slowed things down for me.

Keep in mind that this is only relevant when performing **the initial build**
as HappyPack will switch into a synchronous mode afterwards (i.e. in `watch`
mode.) Also, if we're using the cache and the compiled versions are indeed
cached, the threads will be idle.

Defaults to: `3`

### `threadPool: HappyThreadPool`

A custom thread-pool to use for retrieving worker threads. Normally, this
is managed internally by each `HappyPlugin` instance, but you may override
this behavior for better results.

See "Shared thread pools" below for more information about this.

Defaults to: `null`

### `verbose: Boolean`

Enable this to log status messages from HappyPack to STDOUT like start-up
banner, cache status, etc..

Defaults to: `true`

### `verboseWhenProfiling: Boolean`

Enable this if you want happypack to still produce its output even when you're
doing a `webpack --profile` run. Since this variable was introduced, happypack
will be silent when doing a profile build in order not to corrupt any JSON
output by webpack (i.e. when using `--json` as well.)

Defaults to: `false`

### `debug: Boolean`

Enable this to log diagnostic messages from HappyPack to STDOUT. Useful for
troubleshooting.

Defaults to: `false`

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
    loaders: [ 'happypack/loader?id=jsx' ]
  },

  {
    test: /\.coffee$/,
    loaders: [ 'happypack/loader?id=coffeescripts' ]
  },
]
```

Now `.js` files will be handled by the first Happy plugin which will use
`babel-loader` to transform them, while `.coffee` files will be handled
by the second one using the `coffee-loader` as a transformer.

Note that each plugin will properly use different cache files as the default
cache file names include the plugin IDs, so you don't need to override them
manually. Yay!

## Shared thread pools

Normally, each `HappyPlugin` instance you create internally manages its own
threads which are used to compile sources. However, if you have a number of
plugins, it can be more optimal to create a thread pool yourself and then
configure the instances to share that pool, minimizing the idle time of
threads within it.

Here's an example of using a custom pool of 5 threads that will be shared
between loaders for both JS and SCSS/LESS/whatever sources:

```javascript
// @file: webpack.config.js
var HappyPack = require('happypack');
var happyThreadPool = HappyPack.ThreadPool({ size: 5 });

module.exports = {
  // ...
  plugins: [
    new HappyPack({
      id: 'js',
      threadPool: happyThreadPool
    }),

    new HappyPack({
      id: 'styles',
      threadPool: happyThreadPool
    })
  ]
};
```

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

The builds above were run under Linux on a machine with 12 cores.

## Changes

See [./CHANGELOG.md](./CHANGELOG.md).

## FAQ

### Does it work with webpack 2?

It may, and it may not! Official support for webpack 2 will not land until 
webpack 2 is out of beta status. Until then, IT wouldn't hurt to try but YMMV.

### Does it work with loader X or Y?

We're keeping track of known loader support in [this wiki page](https://github.com/amireh/happypack/wiki/Loader-Compatibility-List). Some loaders 
may require extra configuration to make them work.

If the loader you're trying to use isn't listed there, you can refer to [this](https://github.com/amireh/happypack/wiki/Webpack-Loader-API-Support) wiki page
to see which loader APIs are supported. If your loader uses any API that is NOT
supported, chances are that it will not work with HappyPack.

## Does it work under Windows?

There have been a few reports (e.g [GH-99](https://github.com/amireh/happypack/issues/99) and [GH-70](https://github.com/amireh/happypack/issues/70)) that it does not.

It's difficult for me to confirm or to troubleshoot as I have no access to 
such an environment. If you do and are willing to help, please do!

## License (MIT)

Copyright (c) <2015-2016> <ahmad@amireh.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
