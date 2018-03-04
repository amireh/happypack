#!/usr/bin/env bash

function apply_function() {
  local desc=$1
  shift 1
  local task=$@

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

function with_webpack() {
  local version=$1
  local fn=$2

  local WEBPACK_NODE_PATH="$(pwd)/upstream/webpack${version}/node_modules"
  local WEBPACK_BIN="${WEBPACK_NODE_PATH}/.bin/webpack"
  local NODE_PATH="${WEBPACK_NODE_PATH}:$(pwd)/packages"

  if [ ! -d "${WEBPACK_NODE_PATH}" ]; then
    echo "Unrecognized webpack version '$version'; did you forget to run " \
         "\`npm install\` inside \"${WEBPACK_NODE_PATH}\"?"
    exit 1
  fi

  shift 2

  NODE_PATH=$NODE_PATH \
  WEBPACK_VERSION=$version \
  WEBPACK_BIN=$WEBPACK_BIN \
    $fn $@
}

function for_each_directory() {
  local base_dir=$1
  shift 1
  local fn=$@

  for dir in "${base_dir}/"*/; do
    local dir_name=$(basename "${dir}")
    $fn $dir_name
  done
}
