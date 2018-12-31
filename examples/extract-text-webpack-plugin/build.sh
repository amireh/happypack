#!/usr/bin/env bash

cd "${EXAMPLE_PKG_DIR}" &&

webpack --bail --config ./vanilla/webpack.config.js &&
webpack --bail --config ./happy/webpack.config.js &&

cd "${EXAMPLE_OUT_DIR}" &&

git-diff ./happy/less.css ./vanilla/less.css &&
git-diff ./happy/sass.css ./vanilla/sass.css &&

grep -q 'color: red;'      ./happy/less.css &&
grep -q 'font-size: 26px;' ./happy/sass.css
