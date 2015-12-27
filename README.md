# HappyPack (beta)

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

In your `webpack.config.js`, you need to use the plugin:

```javascript
var HappyPack = require('happypack');

exports.plugins = [
  new HappyPack({ 
    // this is the only required parameter:
    transformer: path.resolve(__dirname, 'webpack/my-happy-transformer.js'),
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

Finally, you need to write the transformer which is explained below.

## Configuration

These are the parameters you can pass to the plugin when you instantiate it.

### `transformer: String`

An **absolute** path to the module that would transform the files. Right now,
HappyPack doesn't work with webpack loaders as it expects the transformer to
be as simple (and fast) as possible, which from my experience the loaders are
not.

The transformer signature is:

    (source: String, sourcePath: String) -> String

`sourcePath` will be an absolute path to the file the `source` belongs to. You
can use that for generating source maps.

Here's an example of writing a simple and effective babel transformer:

```javascript
var babel = require('babel-core');

module.exports = function transformWithBabel(source, sourcePath) {
  return babel.transform(source, {
    babelrc: false,
    ast: false,
    filename: sourcePath,
    presets: [
      'babel-preset-es2015',
      'babel-preset-react',
    ],
  }).code;
}
```

### `cache: Boolean`

Whether HappyPack should re-use the compiled version of source files if their
contents have not changed since the last compilation time (assuming they have
been compiled, of course.)

Recommended!

### `threads: Number`

This number indicates how many Node VMs HappyPack will spawn for compiling
the source files. After a lot of tinkering, I found 4 to yield the best
results. There's certainly a diminishing return on this value and increasing
beyond 8 actually slowed things down for me.

Keep in mind that this is only relevant when performing **the initial build**
as HappyPack will switch into a synchronous mode afterwards (i.e. in `watch`
mode.) Also, if we're using the cache and the compiled versions are indeed
cached, the threads will be idle.

## How it works

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

_TODO: test against other projects_

## TODO

- proper mapping of source maps (inline isn't good enough right now)

