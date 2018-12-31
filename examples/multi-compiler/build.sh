#!/usr/bin/env bash

cd "${EXAMPLE_PKG_DIR}" &&

webpack --bail --config ./vanilla/webpack.config.js &&
webpack --bail --config ./happy/webpack.config.js &&

cd "${EXAMPLE_OUT_DIR}" &&

git-diff ./happy/client.js ./vanilla/client.js &&
git-diff ./happy/server.js ./vanilla/server.js &&

grep -q "success" ./happy/client.js &&
grep -q "success" ./vanilla/client.js
