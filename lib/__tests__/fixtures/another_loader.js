module.exports = function(source, map) {
  return module.exports.__impl__.call(this, source, map);
};

// we just need to export this for spying
module.exports.__impl__ = function(source, map) {
  this.callback(null, source + '5', map);
};