## Bootstrapping the development environment

You will need to npm install in a few places for it to work (look at 
`travis.yml` for an up-to-date source of truth).

A monstrous invocation like this should do it:

```shell
npm install &&
for dir in {packages/@happypack,upstream}/*
do
  ( cd $dir && npm install ) || exit $?
done
```

Where:

- `upstream/*` contains different webpack versions (targets) that happypack is 
  tested against
- `packages/@happypack/example-utils` contains a few helper functions / 
  constants needed to define the examples (again, because they're run against 
  multiple targets)
- `packages/@happypack/test-utils` contains (unit) testing utilities
- `packages/@happypack/webpack-config-composer` is used by tests to generate a 
  configuration for the current webpack version being targeted

Look at the `test:webpack*` scripts in `package.json` to learn how the unit 
tests are run.

## Maintaining the integration tests

Directories under `examples/` contain sample scripts for configuring webpack
with happypack against a certain loader or plugin. The purpose is to provide
working examples for users and some means of regression testing for a 
maintainer.

The [master build script][example-runner] invokes these scripts using different
versions of webpack (installed in `upstream/`) to ensure the integration does 
not regress with later Webpack releases. However, the process is somewhat 
convoluted mainly because it's not straightforward to run Node against 
different package trees.

Conventions expected by the runner:

- `build.sh` exists to invoke webpack and run any assertions on the output

  + The script may utilize the helpers defined in `examples/build.sh` like
    `git-diff`

  + The script has access in PATH to the `webpack` binary of the current target
  + The script has the following environment variables available for use:
  
    * `EXAMPLE: String` name of the example
    * `EXAMPLE_DIR: Path` base directory of the example
    * `EXAMPLE_VERSION: Number` the webpack version being targeted
    * `EXAMPLE_OUT_DIR: Path` where the webpack output will be assuming
      the scripts use the example helpers to define that path (see 
      `packages/@happypack/example-utils/index.js#.outputDir`)
    * `EXAMPLE_PKG_DIR: Path` the base directory of the current version
      configuration scripts (e.g. where `package.json` will be found)

  + See the existing `build.sh` scripts under `examples/` for guidance.

- Configuration scripts for each version are placed in:
      
      examples/[name]/versions/[webpack-version]/vanilla/webpack.config.js
      examples/[name]/versions/[webpack-version]/happy/webpack.config.js

- Build dependencies are tracked in separate `package.json` manifests, one for 
  each version:

      examples/[name]/versions/[webpack-version]/package.json

## Running the integration tests

Either do `npm run test:examples` or use `examples/build.sh` directly. It is
possible to selectively run examples; see the header comment of that file for
usage. For example, to run only the `babel-loader` examples:

```shell
# run the babel-loader example against all supported targets
./examples/build.sh -o babel-loader

# run babel-loader against webpack 2 only
./examples/build.sh -o babel-loader:2

# run everything except "extract-text-webpack-plugin"
./examples/build.sh -s extract-text-webpack-plugin 
```

[example-runner]: examples/build-all.sh
