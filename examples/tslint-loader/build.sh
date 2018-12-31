#!/usr/bin/env bash

cd "${EXAMPLE_PKG_DIR}" &&

webpack --bail --config ./happy/webpack.config.js \
  | grep -qEi "forbidden .?var.? keyword"
