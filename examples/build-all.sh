#!/usr/bin/env bash
#
# Downstream integration tests.
#
# USAGE
#
#     examples/build.sh [-o TAG] [-s TAG]
#
# Examples may be excluded by specifying -s with the TAG, or be selected by
# specifying -o with the TAG. These options may be repeated as desired.
#
# TAG is EXAMPLE[:]WEBPACK_VERSION
#
# Where EXAMPLE is the name of the example directory under examples/
# and WEBPACK_VERSION is one of the supported versions under
# path/to/example/versions/*

if [[ ! -d examples ]]; then
  echo "$0: must be run from happypack root" 1>&2
  exit 1
fi

main() {
  local elapsed
  local started_at=$SECONDS
  local tag

  parse-cli-options "$@"

  for example_dir in "${PWD}"/examples/*/; do
    export EXAMPLE="$(basename "${example_dir}")"
    export EXAMPLE_DIR="$example_dir"

    if [[ ! -f ${EXAMPLE_DIR}/build.sh ]]; then
      echo "[WARN] ignoring example \"${EXAMPLE}\" since it has no build.sh" 1>&2
      continue
    elif ! wants "$EXAMPLE"; then
      continue
    fi

    for example_version_dir in "${EXAMPLE_DIR}/versions/"*/; do
      export EXAMPLE_VERSION="$(basename "${example_version_dir}")"
      export EXAMPLE_OUT_DIR="${EXAMPLE_DIR}/dist/versions/${EXAMPLE_VERSION}"
      export EXAMPLE_PKG_DIR="${EXAMPLE_DIR}/versions/${EXAMPLE_VERSION}"

      tag="${EXAMPLE}:${EXAMPLE_VERSION}"

      if ! wants "$tag"; then
        continue
      fi

      if [[ -t 0 ]]; then
        choose-next-color &&
        decorate-output "$tag" \
          sub-shell \
            run-example || exit $?
      else
        run-example || exit $?
      fi
    done
  done

  elapsed=$(( SECONDS - started_at ))

  echo -e "${tty_green}FINISHED${tty_reset} in $(format-duration $elapsed)"
}

run-example() {
  # install dependencies:
  if [[ -f "${EXAMPLE_PKG_DIR}/package.json" ]]; then
    (cd "${EXAMPLE_PKG_DIR}" && npm install) || return $?
  fi

  # clean artifacts from previous builds:
  if [[ -d ${EXAMPLE_OUT_DIR} ]]; then
    rm -r "${EXAMPLE_OUT_DIR}" || return $?
  fi

  # it's necessary to have the effective "node_modules" reachable from the
  # source directories of the examples for webpack to find loaders and packages
  # from them without resorting to explicit overriding of "resolveLoader.root"
  # and friends in the config (which would convolute the example config scripts)
  rm -f "${EXAMPLE_DIR}/node_modules"
  ln -s "${EXAMPLE_PKG_DIR}/node_modules" "${EXAMPLE_DIR}/node_modules"

  # build the example with webpack:
  export NODE_PATH="${PWD}/packages:${NODE_PATH}"
  export NODE_PATH="${EXAMPLE_PKG_DIR}/node_modules:${NODE_PATH}"

  webpack-env "$EXAMPLE_VERSION" && . "${EXAMPLE_DIR}/build.sh"
}

# UTIL
# ------------------------------------------------------------------------------

declare -a EXAMPLE_WHITELIST=()
declare -a EXAMPLE_BLACKLIST=()

tty_colors=(
  "\\033[34m" # blue
  "\\033[33m" # yellow
  "\\033[35m" # magenta
  "\\033[31m" # red
  "\\033[36m" # cyan
  "\\033[32m" # green
)

tty_red="${tty_colors[3]}"
tty_green="${tty_colors[5]}"
tty_reset="\\033[0m"
tty_color_cursor=
tty_color=

# (tag: String, ...): Bool
decorate-output() {
  local tag="${tty_color}$1${tty_reset} |"

  shift 1

  echo -e "$tag STARTING $(date)"

  local started_at=$SECONDS

  "$@" 2>&1 | while IFS="" read -r line; do
    echo -e "$tag $line"
  done

  local exit_code=${PIPESTATUS[0]}
  local elapsed=$(( SECONDS - started_at ))

  if [[ $exit_code != 0 ]]; then
    echo -e "$tag ${tty_red}FAILED!${tty_reset} (exit code $exit_code)"
  else
    echo -e "$tag ${tty_green}OK${tty_reset}"
  fi

  echo -e "$tag FINISHED in $(format-duration $elapsed)"
  echo

  return "$exit_code"
}

sub-shell() {
  ( "$@" )
}

format-duration() {
  echo "$(( $1 / 60 ))m$(( $1 % 60 ))s"
}

choose-next-color() {
  if [[ -z $tty_color_cursor || $tty_color_cursor -eq ${#tty_colors[@]} ]]; then
    tty_color_cursor="0"
  fi

  tty_color="${tty_colors[$tty_color_cursor]}"
  tty_color_cursor=$(( tty_color_cursor + 1 ))
}

# (webpack_version: Number): void
#
# add the versioned webpack binary to PATH and the node package to NODE_PATH
webpack-env() {
  local webpack_version="$1"
  local webpack_dir="${PWD}/upstream/webpack${webpack_version}"

  if [[ ! -d ${webpack_dir}/node_modules ]]; then
    echo "Unrecognized webpack version '$webpack_version'; did you forget" \
         "to run \`npm install\` inside \"${webpack_dir}\"?" 1>&2
    return 1
  fi

  export PATH="${webpack_dir}/node_modules/.bin:${PATH}"
  export NODE_PATH="${webpack_dir}/node_modules:${NODE_PATH}"
}

# for use in assertion scripts
git-diff() {
  git diff --no-index --color --word-diff=color --minimal "$@"
}

# check if the user has requested to either skip a task or run it exclusively
wants() {
  local item
  local target="$1"

  for item in "${EXAMPLE_BLACKLIST[@]}"; do
    if [[ $target =~ $item || $target =~ $item ]]; then
      return 1
    fi
  done

  if [[ ${#EXAMPLE_WHITELIST[@]} -eq 0 ]]; then
    return 0
  fi

  for item in "${EXAMPLE_WHITELIST[@]}"; do
    if [[ $item =~ $target || $target =~ $item ]]; then
      return 0
    fi
  done

  return 1
}

# parse -O (only) and -S (skip) options to filter examples:
parse-cli-options() {
  while getopts ":s:o:ch" opt
  do
    case $opt in
      s) EXAMPLE_BLACKLIST+=("${OPTARG}")          ;;
      o) EXAMPLE_WHITELIST+=("${OPTARG}")          ;;
      *) echo "Invalid option: -$OPTARG" >&2  ;;
    esac
  done

  shift "$((OPTIND-1))"
}

main "$@"