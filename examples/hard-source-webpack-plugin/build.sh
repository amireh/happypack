#!/usr/bin/env bash

# we need to do this twice to make use of the cache
build-and-test() {
  cd "${EXAMPLE_PKG_DIR}" &&

  webpack --bail --config ./vanilla/webpack.config.js &&
  webpack --bail --config ./happy/webpack.config.js &&

  cd "${EXAMPLE_OUT_DIR}" &&

  git-diff ./happy/main.js ./vanilla/main.js &&

  ( node vanilla/main.js | grep -q 'success' ) &&
  ( node happy/main.js | grep -q 'success' )
}

rm -rf "${EXAMPLE_OUT_DIR}" && build-and-test && build-and-test
