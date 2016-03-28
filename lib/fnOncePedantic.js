module.exports = function OncePedantic(fn, errorMessage) {
  var called = false;

  return function() {
    if (called) {
      throw new Error(errorMessage);
    }

    called = true;
    return fn.apply(null, arguments);
  }
};