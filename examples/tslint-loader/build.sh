local pkg_dir=$1

$WEBPACK_BIN --bail --config "${pkg_dir}/happy/webpack.config.js" | egrep -i "forbidden .?var.? keyword"
