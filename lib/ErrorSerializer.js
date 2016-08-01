// TODO: do we have to preserve types here? e.g. ModuleError
exports.serialize = function(x) {
  if (!x) {
    return null;
  }
  else if (typeof x === 'string') {
    return { message: x };
  }
  else {
    return Object.keys(x).reduce(function(map, key) {
      // err, yeah, we don't want the cyclic deps here and no reason to use
      // a full-blown acyclic serializer:
      if (key === 'module') {
        map[key] = { id: x.module.id };
      }
      else {
        map[key] = x[key];
      }

      return map;
    }, {
      stack: x.stack, // because it's not enumerable
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
