exports.serialize = function(x) {
  if (!x) {
    return null;
  }
  else if (typeof x === 'string') {
    return { message: x };
  }
  else {
    return Object.keys(x).reduce(function(map, key) {
      map[key] = x[key];

      return map;
    }, {
      message: x.message,
      stack: x.stack,
    });
  }
};

exports.deserialize = function(x) {
  var source;

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
    return Object.keys(source).reduce(function(error, key) {
      error[key] = source[key];

      return error;
    }, new Error());
  }

  return null;
};
