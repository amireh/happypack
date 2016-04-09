module.exports = function(s) {
  return s;
};

module.exports.pitch = function(x, o) {
  console.log('[a] in pitch!!\n  [remaining] => %s\n  [preceding] => %s', x, o)
};