module.exports = function Once(fn) {
  var called = false;

  return function() {
    if (!called) {
      called = true;
      return fn.apply(null, arguments);
    }
  }
};