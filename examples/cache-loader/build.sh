local pkg_dir=$1
local out_dir=$2

# we need to do this twice to make use of the cache
for i in {0..1}; do
  [ -d "${out_dir}" ] && rm -r "${out_dir}"

  $WEBPACK_BIN --bail --config "${pkg_dir}/vanilla/webpack.config.js"
  $WEBPACK_BIN --bail --config "${pkg_dir}/happy/webpack.config.js"

  diff "${out_dir}/happy/main.js" "${out_dir}/vanilla/main.js"

  grep "success" "${out_dir}/happy/main.js"
  grep "success" "${out_dir}/vanilla/main.js"
done