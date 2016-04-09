function Once(fn) {
  var called = false;

  return function() {
    if (!called) {
      called = true;
      return fn.apply(null, arguments);
    }
    else {
      return Once.ALREADY_CALLED;
    }
  }
}

Once.ALREADY_CALLED = Object.freeze({});

module.exports = Once;