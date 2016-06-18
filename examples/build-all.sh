#!/usr/bin/env bash
#
# Downstream integration tests.

if [ ! -d examples ]; then
  echo "You must run this from happypack root."
  exit 1
fi

WEBPACK_BIN="$(pwd)/node_modules/.bin/webpack"

function run_task {
  task=$@
  echo -e "\n[$task] STARTING $(date)"

  $task 2>&1 | while IFS="" read line; do echo -e "[$task] $line"; done

  exit_status=${PIPESTATUS[0]}

  if [[ $exit_status != 0 ]]; then
    echo -e "[$task] \033[31mFAILED!\033[0m (exit code $exit_status)"
    exit 1
  else
    echo -e "[$task] \033[32mOK\033[0m"
  fi

  echo -e "[$task] FINISHED $(date)\n"
}

function setup_example {
  EXAMPLE_DIR=$@

  [ -d $EXAMPLE_DIR/dist ] && rm -r $EXAMPLE_DIR/dist
  [ -f $EXAMPLE_DIR/package.json ] && (cd $EXAMPLE_DIR; npm install)
}

function babel_loader {
  echo "Testing HappyPack with babel-loader"
  echo "-----------------------------------"

  setup_example "examples/babel-loader"

  (
    cd examples/babel-loader;
    $WEBPACK_BIN --bail &&
    $WEBPACK_BIN --bail --config webpack.config--raw.js &&
    diff dist/main.js dist/main.raw.js &&
    grep "success" dist/main.js
  )
}

function sass_loader {
  echo "Testing HappyPack using sass + css + style loaders."
  echo "---------------------------------------------------"

  setup_example "examples/sass-loader"

  (
    cd examples/sass-loader;
    $WEBPACK_BIN --bail &&
    $WEBPACK_BIN --bail --config webpack.config--raw.js &&
    diff dist/main.js dist/main.raw.js &&
    grep "background-color: yellow" dist/main.js
  )
}

function tslint_loader {
  echo "Testing HappyPack using ts-linter (typescript linter)"
  echo "-----------------------------------------------------"

  setup_example "examples/tslint-loader"

  (
    cd examples/tslint-loader
    $WEBPACK_BIN --bail
  ) | egrep "forbidden .?var.? keyword"
}

function transform_loader {
  echo "Testing HappyPack with transform-loader (coffeeify & brfs)"
  echo "----------------------------------------------------------"

  setup_example "examples/transform-loader"

  (
    cd examples/transform-loader;
    $WEBPACK_BIN --bail &&
    $WEBPACK_BIN --bail --config webpack.config--raw.js &&
    diff dist/main.js dist/main.raw.js
  )
}

function webpack2 {
  echo "Testing HappyPack with webpack v2"
  echo "---------------------------------"

  setup_example "examples/webpack2"

  (
    cd examples/webpack2;
    $WEBPACK_BIN --bail &&
    grep "console.log('success')" dist/main.js
  )
}

function source_maps {
  echo "Testing HappyPack for SourceMap support"
  echo "---------------------------------------"

  EXAMPLE_DIR="examples/source-maps"

  setup_example $EXAMPLE_DIR

  (
    cd $EXAMPLE_DIR
    $WEBPACK_BIN --bail &&
    $WEBPACK_BIN --bail --config webpack.config--raw.js &&
    diff dist/main.js.map dist--raw/main.js.map
  )
}

function json_loader {
  echo "Testing HappyPack with json-loader"
  echo "----------------------------------"

  EXAMPLE_DIR="examples/json-loader"

  setup_example $EXAMPLE_DIR

	(
    cd $EXAMPLE_DIR
    $WEBPACK_BIN --bail &&
    $WEBPACK_BIN --bail --config webpack.config--raw.js &&
    diff dist/main.js dist--raw/main.js &&
    (node dist/main.js | grep "Hello World!" &> /dev/null)
  )
}

# purge the cache and previous build artifacts
find examples -maxdepth 2 -type d -name '.happypack' | xargs rm -r
find examples -maxdepth 2 -type d -name 'dist' | xargs rm -r
find examples -maxdepth 2 -type d -name 'dist--raw' | xargs rm -r

export HAPPY_CACHE=1

run_task babel_loader
run_task sass_loader
run_task tslint_loader
run_task transform_loader
run_task webpack2
run_task source_maps
run_task json_loader

echo "Re-running previous examples with cached sources..."
echo "---------------------------------------------------"

run_task babel_loader
run_task sass_loader

# doesn't work right now, we need to replay all loader RPCs on cache load as
# this loader simply does emitWarning/emitError calls
#
# run_task tslint_loader

run_task transform_loader
run_task webpack2
run_task source_maps
run_task json_loader