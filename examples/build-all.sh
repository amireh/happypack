#!/usr/bin/env bash
#
# Downstream integration tests.

if [ ! -d examples ]; then
  echo "You must run this from happypack root."
  exit 1
fi

. "examples/build/director.sh"

function babel-loader {
  set -e

  echo "Testing HappyPack with babel-loader"
  echo "-----------------------------------"

  local example="examples/babel-loader"
  setup_example $example

  $WEBPACK_BIN --bail --config $example/webpack.config.js
  $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

  diff \
    $example/dist/main.js \
    $example/dist/main.raw.js

  grep "success" $example/dist/main.js
}

function cache-loader {
  set -e

  echo "Testing HappyPack with cache-loader"
  echo "-----------------------------------"

  local example="examples/cache-loader"
  setup_example $example

  # we need to do this twice to make use of the cache
  for i in {0..1}; do
    [ -d $example/dist ] && rm -r $example/dist

    $WEBPACK_BIN --bail --config $example/webpack.config.js
    $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

    diff \
      $example/dist/main.js \
      $example/dist/main.raw.js

    grep "success" $example/dist/main.js
  done
}

function sass-loader {
  set -e

  echo "Testing HappyPack using sass + css + style loaders"
  echo "--------------------------------------------------"

  local example="examples/sass-loader"
  setup_example $example

  $WEBPACK_BIN --bail --config $example/webpack.config.js
  $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

  diff \
    $example/dist/main.js \
    $example/dist/main.raw.js

  grep "background-color: yellow" $example/dist/main.js
}

function tslint-loader {
  set -e

  echo "Testing HappyPack using tslint-loader"
  echo "-------------------------------------"

  local example="examples/tslint-loader"
  setup_example "examples/tslint-loader"

  # this doesn't work if outside of node_modules/ where tslint is installed so
  # we must `cd`
  (cd $example && $WEBPACK_BIN --bail) | egrep -i "forbidden .?var.? keyword"
}

function ts-loader {
  set -e

  echo "Testing HappyPack with ts-loader"
  echo "--------------------------------"

  local example="examples/ts-loader"
  setup_example $example

  $WEBPACK_BIN --config $example/webpack.config.js
  $WEBPACK_BIN --config $example/webpack.config--raw.js

  diff \
    $example/dist/main.js \
    $example/dist/main.raw.js

  grep "success" $example/dist/main.js
}

function transform-loader {
  set -e

  echo "Testing HappyPack with transform-loader (coffeeify & brfs)"
  echo "----------------------------------------------------------"

  local example="examples/transform-loader"
  setup_example $example

  $WEBPACK_BIN --bail --config $example/webpack.config.js
  $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

  diff \
    $example/dist/main.js \
    $example/dist/main.raw.js
}

function extract-text-webpack-plugin {
  set -e

  echo "Testing HappyPack with ExtractTextPlugin"
  echo "----------------------------------------"

  local example="examples/extract-text-webpack-plugin"
  setup_example $example

  $WEBPACK_BIN --bail --config $example/webpack.config.js
  $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

  diff \
    $example/dist/styles.css \
    $example/dist--raw/styles.css

  grep "{ className: 'less scss' },"  $example/dist/main.js
  grep ".less {"                      $example/dist/styles.css
}

function source-maps {
  set -e

  echo "Testing HappyPack for SourceMap support"
  echo "---------------------------------------"

  local example="examples/source-maps"
  setup_example $example

  $WEBPACK_BIN --bail --config $example/webpack.config.js
  $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

  diff \
    $example/dist/main.js.map \
    $example/dist--raw/main.js.map
}

function json-loader {
  set -e

  echo "Testing HappyPack with json-loader"
  echo "----------------------------------"

  local example="examples/json-loader"
  setup_example $example

  $WEBPACK_BIN --bail --config $example/webpack.config.js
  $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

  diff \
    $example/dist/main.js \
    $example/dist--raw/main.js

  (node $example/dist/main.js | grep "Hello World!" &> /dev/null)
}

function multi-build {
  set -e

  echo "Testing HappyPack with multiple builds"
  echo "--------------------------------------"

  local example="examples/multi-build"
  setup_example $example

  $WEBPACK_BIN --config $example/webpack.config.js
  $WEBPACK_BIN --config $example/webpack.config--raw.js

  diff \
    $example/dist/client.js \
    $example/dist/client.raw.js

  diff \
    $example/dist/server.js \
    $example/dist/server.raw.js

  grep "success" $example/dist/client.js
  grep "success" $example/dist/server.js
}

purge_artifacts

with_webpack "1" run_example babel-loader
with_webpack "2" run_example babel-loader
with_webpack "3" run_example babel-loader

with_webpack "2" run_example cache-loader
with_webpack "3" run_example cache-loader

with_webpack "1" run_example extract-text-webpack-plugin
with_webpack "2" run_example extract-text-webpack-plugin
with_webpack "3" run_example extract-text-webpack-plugin

with_webpack "1" run_example json-loader
with_webpack "2" run_example json-loader
with_webpack "3" run_example json-loader

with_webpack "1" run_example multi-build
with_webpack "2" run_example multi-build
with_webpack "3" run_example multi-build

with_webpack "1" run_example sass-loader
with_webpack "2" run_example sass-loader
with_webpack "3" run_example sass-loader

with_webpack "1" run_example source-maps
with_webpack "2" run_example source-maps
with_webpack "3" run_example source-maps

with_webpack "1" run_example transform-loader
with_webpack "2" run_example transform-loader
with_webpack "3" run_example transform-loader

with_webpack "1" run_example ts-loader
with_webpack "2" run_example ts-loader
with_webpack "3" run_example ts-loader

with_webpack "1" run_example tslint-loader
with_webpack "2" run_example tslint-loader
with_webpack "3" run_example tslint-loader
