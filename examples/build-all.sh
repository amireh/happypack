#!/usr/bin/env bash

if [ ! -d examples ]; then
  echo "You must run this from happypack root."
  exit 1
fi

ROOT=$(pwd)
WEBPACK_BIN="${ROOT}/node_modules/.bin/webpack"

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

function install_packages {
	(cd $@; npm install) 
}

function single_loader {
  [ -d examples/single-loader/dist ] && rm -r examples/single-loader/dist

  ./node_modules/.bin/webpack \
    --bail \
    --config examples/single-loader/webpack.config.js &&
  grep "success" ./examples/single-loader/dist/main.js
}

function multi_loader {
  [ -d examples/multi-loader/dist ] && rm -r examples/multi-loader/dist

  ./node_modules/.bin/webpack \
    --bail \
    --config examples/multi-loader/webpack.config.js &&
  grep "success" ./examples/multi-loader/dist/main.js
}

function sass_loader {
  [ -d examples/sass-loader/dist ] && rm -r examples/sass-loader/dist
  [ -f examples/sass-loader/package.json ] && install_packages examples/sass-loader

  (cd examples/sass-loader; $ROOT/node_modules/.bin/webpack --bail) &&
  grep "background-color: yellow" ./examples/sass-loader/dist/main.js
}

function tslint_loader {
  [ -d examples/tslint-loader/dist ] && rm -r examples/tslint-loader/dist
  [ -f examples/tslint-loader/package.json ] && install_packages examples/tslint-loader

	(cd examples/tslint-loader; $WEBPACK_BIN --bail) | grep "forbidden var keyword"
}

echo "Testing HappyPack using a single loader."
run_task single_loader

echo "Testing HappyPack using multiple loaders."
run_task multi_loader

echo "Testing HappyPack using sass + css + style loaders."
run_task sass_loader

echo "Testing HappyPack using ts-linter (typescript linter)"
run_task tslint_loader
