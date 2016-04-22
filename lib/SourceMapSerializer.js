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
    return JSON.parse(x);
  }
  else {
    return x || null;
  }
};