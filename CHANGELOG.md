## HappyPack Changelog

### 3.0.0

This release, although it's a major one, was mostly concerned with internal
changes and improvements to how the plugin worked. Most side-effects and global
state has been eliminated, which should hopefully result in fewer surprises 
when attempting to use HappyPack in a multi-build webpack setting.

- HappyPack will no longer output anything to the console if webpack is running
 in profiling mode (`--profile`) in order not to corrupt any JSON output. You 
 can restore the previous behavior by setting the new option 
 `verboseWhenProfiling` to `true`. Refs GH-76
- [BREAKING] Inferring loaders for configuration is no longer supported! If you
  were supplying { happy: { id: 'something' } } to your webpack loader configuration
  so that HappyPack picks it up, you need to rewrite that part of the config
  as is shown in the README.
- [POTENATIALLY BREAKING] HappyPlugin will no longer attempt to generate an 
  incremental ID to use if none is passed. Instead, it will simply default to
  `'1'` for an id in case it was not overridden by the user. This behavior 
  never actually provided any benefit since if you had multiple plugins 
  referenced by multiple loaders, you still had to provide each loader with a 
  distinct id (the loaders never incremented such a counter or relied on it.) 
  This solves GH-88. 
- Thread pools can now be shared across multiple compilers/builds! The plugin 
  and thread pools will correctly map each compiler to its configuration and 
  instruct the workers to use the correct configuration when they do their 
  work. Refs GH-82 and GH-72.
 
**Internal refactors**

- `HappyPlugin` and `HappyLoader` no longer deal with the RPCHandler to 
register active compiler or loader instances. Instead, this book-keeping is done implicitly by the _thread pools_ (which own the RPC handlers) when they are started, requested to compile, or stopped.
- The internal API `HappyPlugin.resetUID` has been dropped
- The internal API `HappyPlugin.isVerbose` is now hidden
- The internal API `HappyPlugin.isDebug` is now hidden
- The internal API `HappyPlugin.prototype.compileInBackground` is now hidden
- The internal API `HappyPlugin.prototype.compileInForeground` is now hidden
- The internal API `HappyPlugin.prototype._performCompilationRequest` is now hidden
- The internal API `HappyThreadPool.get` has been dropped. Instead, the thread pool exposes a `compile` API similar to the Thread's.
- The internal API `HappyThreadPool.getRPCHandler` has been dropped

### 2.2.1

- Fixed an edge-case issue that was causing happypack to crash when a shared 
  threadpool is used by a pre-loader and a loader (or post-loader) that are 
  processing the same file. Refs GH-60
- Made it possible to completely silence happypack's console output by setting
  verbose to `false` and introduced the `debug` option to control diagnostic
  message logging. Refs GH-64

### 2.2.0

- Fixed a regression in scanning loader "string chains" (multiple loaders 
  specified in the same string separated by `!`), refs GH-68
- Added support for the loader API `this.loadModule()` which is used by
  less-loader, refs GH-66

### 2.1.3

- Fixed an issue where certain loader configurations with queries weren't being
  properly recognized by HappyPack. Now, all known configuration variants 
  should work. (GH-65 and GH-26)

### 2.1.2

- Process argv will no longer be passed to the child processes spawned by 
  HappyPack (refs GH-47)
- Support for the `target` loader context variable has been added. Thanks to 
  @Akkuma (refs GH-46)

### 2.1.1

- Fixed an issue where happypack would crash when loading invalid/corrupt 
  cache or source-map files. Big thanks to @benhughes for providing the patch in GH-42

### 2.1.0

- Introduced SourceMap support

### 2.0.6

- Introduced a new option `cacheSignatureGenerator` to handle use cases such
  as [GH-35]

### 2.0.5

- Now using [mkdirp](https://github.com/substack/node-mkdirp) for creating the 
  temp directory to support nested ones

### 2.0.4

- Fixed an issue where the cache was not being utilized on node v0.10 (since 
  `fs.statSync` doesn't exist with that name there) - thanks to [@XVincentX]

### 2.0.2

- Fixed an issue that was causing loaders running in foreground to not receive 
  the compiler options

### 2.0.1

- Package in NPM is now compact

### 2.0.0

- Pitching loader support
- More complete loader API support
- More convenient configuration interface

### 1.1.4

- Fixed an issue where the cache was being improperly invalidated due to 
  `cacheContext` not being stored properly (refs GH-17, thanks to @blowery)

### 1.1.3

- Fixed an issue where the initial cache was not being saved properly

### 1.1.2

- Fixed an issue on old node versions (0.10) with the EventEmitter API (GH-10)
- Fixed an issue that was breaking the compiler if an invalid `threads` option
  was passed (evaluating to `NaN`)

### 1.1.1

- Unrecognized and invalid config parameters will now cause the process to
  abort
- The active version is logged on launch

### 1.1.0

- Now supporting basic webpack loaders
- Dropped the `transformer` parameter as it's no longer needed
- `cache` now defaults to `true`
- Now using a forking model utilizing node.js's `process.fork()` for cleaner
  threading code

### 1.0.2

- Loader will now accept IDs that aren't just numbers
