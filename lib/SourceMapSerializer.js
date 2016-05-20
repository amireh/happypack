exports.serialize = function(x) {
  if (typeof x === 'string') {
    return x;
  }
  else {
    return JSON.stringify(x || null);
  }
};

exports.deserialize = function(x) {
  if (typeof x === 'string') {
    try {
      return JSON.parse(x);
    } catch (e) {
      return null;
    }
  }
  return x || null;
};
