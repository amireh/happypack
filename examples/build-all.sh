#!/usr/bin/env bash

if [ ! -d examples ]; then
  echo "You must run this from happypack root."
  exit 1
fi

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

  # exit $exit_status
}

function single_loader {
  ./node_modules/.bin/webpack --bail --config examples/single-loader/webpack.config.js
}

function multi_loader {
  ./node_modules/.bin/webpack --bail --config examples/multi-loader/webpack.config.js
}

echo "Testing HappyPack using a single loader."
run_task single_loader

echo "Testing HappyPack using multiple loaders."
run_task multi_loader