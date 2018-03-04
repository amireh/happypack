#!/usr/bin/env bash
#
# Downstream integration tests.

if [ ! -d examples ]; then
  echo "You must run this from happypack root."
  exit 1
fi

. "examples/build.util.sh"

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

  local example=${1:-"examples/extract-text-webpack-plugin"}
  setup_example $example

  echo "Webpack (WITHOUT HAPPYPACK)"

  $WEBPACK_BIN --bail --config $example/webpack.config--raw.js

  echo "Webpack (WITH HAPPYPACK)"

  $WEBPACK_BIN --bail --config $example/webpack.config.js

  diff \
    "${example}/dist/less.css" \
    "${example}/dist--raw/less.css"

  diff \
    "${example}/dist/sass.css" \
    "${example}/dist--raw/sass.css"

  grep "color: red;"                   "${example}/dist/less.css"
  grep "font-size: 26px;"              "${example}/dist/sass.css"
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

function run_example() {
  local example=$1
  local example_dir="$(pwd)/examples/${example}"

  function run_version_example() {
    local version=$1
    local out_dir="${example_dir}/dist/versions/${version}"
    local pkg_dir="${example_dir}/versions/${version}"
    local test_file="${example_dir}/test.sh"

    function stage0__clean_artifacts() {
      if [ -d "${out_dir}" ]; then
        rm -r "${out_dir}"
      else
        return 0
      fi
    }

    function stage1__install_deps() {
      if [ -f "${pkg_dir}/package.json" ]; then
        (cd "${pkg_dir}" && npm install)
      else
        return 0
      fi
    }

    function stage2__build() {
      $WEBPACK_BIN --bail --config "${pkg_dir}/vanilla/webpack.config.js" &&
      $WEBPACK_BIN --bail --config "${pkg_dir}/happy/webpack.config.js"
    }

    function stage3__assert() {
      if [ -f "${test_file}" ]; then
        (
          set -e
          cd "${out_dir}"; . "${test_file}"
          set +e
        )
      else
        return 0
      fi
    }

    function run_all_stages() {
      stage0__clean_artifacts &&
      stage1__install_deps &&
      with_webpack $version stage2__build &&
      stage3__assert
    }

    apply_function "webpack@${version} ${example}" run_all_stages
  }

  for_each_directory "${example_dir}/versions" run_version_example
}

for example in examples/*/; do
  if [ -f "${example}/test.sh" ]; then
    run_example $(basename "${example}") || exit 1
  else
    echo "[WARN] ignoring example \"${example} since it has no test.sh file"
  fi
done

# with_webpack "2" run_example cache-loader
# with_webpack "3" run_example cache-loader
# with_webpack "4" run_example cache-loader

# with_webpack "1" run_example extract-text-webpack-plugin
# with_webpack "2" run_example extract-text-webpack-plugin
# with_webpack "3" run_example extract-text-webpack-plugin

# with_webpack "1" run_example json-loader
# with_webpack "2" run_example json-loader
# with_webpack "3" run_example json-loader
# with_webpack "4" run_example json-loader

# with_webpack "1" run_example multi-build
# with_webpack "2" run_example multi-build
# with_webpack "3" run_example multi-build
# with_webpack "4" run_example multi-build

# with_webpack "1" run_example sass-loader
# with_webpack "2" run_example sass-loader
# with_webpack "3" run_example sass-loader
# with_webpack "4" run_example sass-loader

# with_webpack "1" run_example source-maps
# with_webpack "2" run_example source-maps
# with_webpack "3" run_example source-maps
# with_webpack "4" run_example source-maps

# with_webpack "1" run_example transform-loader
# with_webpack "2" run_example transform-loader
# with_webpack "3" run_example transform-loader
# with_webpack "4" run_example transform-loader

# with_webpack "1" run_example ts-loader
# with_webpack "2" run_example ts-loader
# with_webpack "3" run_example ts-loader
# with_webpack "4" run_example ts-loader

# with_webpack "1" run_example tslint-loader
# with_webpack "2" run_example tslint-loader
# with_webpack "3" run_example tslint-loader
# with_webpack "4" run_example tslint-loader
