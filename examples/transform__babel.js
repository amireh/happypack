var babel = require('babel-core');

module.exports = function transformWithBabel(source, sourcePath) {
  return babel.transform(source, {
    babelrc: false,
    ast: false,
    filename: sourcePath,
    presets: [
      'babel-preset-es2015',
      'babel-preset-react',
    ],
  }).code;
}