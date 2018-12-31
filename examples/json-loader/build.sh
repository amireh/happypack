#!/usr/bin/env bash

cd "${EXAMPLE_PKG_DIR}" &&

webpack --bail --config ./vanilla/webpack.config.js &&
webpack --bail --config ./happy/webpack.config.js &&

cd "${EXAMPLE_OUT_DIR}" &&

git-diff ./happy/main.js ./vanilla/main.js  &&
node ./happy/main.js | grep -q "Hello World!"
