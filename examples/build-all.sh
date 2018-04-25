#!/usr/bin/env bash
#
# Downstream integration tests.

if [ ! -d examples ]; then
  echo "You must run this from happypack root."
  exit 1
fi

. "examples/build.util.sh"

function run_example() {
  local example=$1
  local example_dir="$(pwd)/examples/${example}"

  function run_version_example() {
    local version=$1
    local out_dir="${example_dir}/dist/versions/${version}"
    local pkg_dir="${example_dir}/versions/${version}"
    local build_script="${example_dir}/build.sh"
    local test_script="${example_dir}/test.sh"

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
      if [ -f "${build_script}" ]; then
        (. "${build_script}" "${pkg_dir}" "${out_dir}")
      else
        $WEBPACK_BIN --bail --config "${pkg_dir}/vanilla/webpack.config.js" &&
        $WEBPACK_BIN --bail --config "${pkg_dir}/happy/webpack.config.js"
      fi
    }

    function stage3__assert() {
      if [ -f "${test_script}" ]; then
        (cd "${out_dir}"; . "${test_script}")
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

function is_example_relevant() {
  local example_dir=$1
  [ -f "${example_dir}/test.sh" ] || [ -f "${example_dir}/build.sh" ]
}

function run_selected_examples() {
  for example_dir in examples/*/; do
    is_example_relevant "${example_dir}" || {
      echo "[WARN] ignoring example \"${example_dir} since it has no test.sh or build.sh files"
      continue
    }

    local example=$(basename "${example_dir}")

    wants $example && run_example $example || skip
  done
}

read_wants $@
run_selected_examples