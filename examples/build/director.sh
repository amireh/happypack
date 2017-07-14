#!/usr/bin/env bash

function setup_example {
  local example=$@

  [ -d $example/dist ] && rm -r $example/dist
  [ -d $example/dist--raw ] && rm -r $example/dist--raw
  [ -f $example/package.json ] && (cd $example; npm install)
}

function run_example {
  local task=$@
  local desc="webpack@$WEBPACK_VERSION ${task}"
  echo -e "\n[$desc] STARTING $(date)"

  $task 2>&1 | while IFS="" read line; do echo -e "[$desc] $line"; done

  exit_status=${PIPESTATUS[0]}

  if [[ $exit_status != 0 ]]; then
    echo -e "[$desc] \033[31mFAILED!\033[0m (exit code $exit_status)"
    exit 1
  else
    echo -e "[$desc] \033[32mOK\033[0m"
  fi

  echo -e "[$desc] FINISHED $(date)\n"
}

function with_webpack {
  local version=$1
  local fn=$2

  local NODE_PATH="$(pwd)/upstream/webpack${version}/node_modules"
  local WEBPACK_BIN="${NODE_PATH}/.bin/webpack"

  if [ ! -d $NODE_PATH ]; then
    echo "Unrecognized webpack version '$version'"
    exit 1
  fi

  shift 2

  NODE_PATH=$NODE_PATH \
  WEBPACK_VERSION=$version \
  WEBPACK_BIN=$WEBPACK_BIN \
    $fn $@
}

# purge previous build artifacts
function purge_artifacts {
  find examples -maxdepth 2 -type d -name 'dist' | xargs rm -r &> /dev/null
  find examples -maxdepth 2 -type d -name 'dist--raw' | xargs rm -r &> /dev/null
}