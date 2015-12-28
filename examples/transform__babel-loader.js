var transform = require('babel-loader');

module.exports = function(source) {
  transform.call(this, source);

  if (this.error) {
    throw this.error;
  }

  return this.result[0];
};