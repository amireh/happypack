exports.serialize = function(x) {
  if (!x) {
    return null;
  }
  else if (typeof x === 'string') {
    return { message: x };
  }
  else {
    return {
      message: x.message,
      stack: x.stack,
    };
  }
};

exports.deserialize = function(x) {
  var source;
  var error = null;

  if (typeof x === 'string') {
    try {
      source = JSON.parse(x);
    } catch (e) {
      source = null;
    }
  }
  else if (x) {
    source = x;
  }

  if (source) {
    error = new Error();
    error.message = source.message;
    error.stack = source.stack;
  }

  return error;
};
