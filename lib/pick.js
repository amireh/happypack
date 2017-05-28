module.exports = function pick(keys) {
  return function pickFromObject(object) {
    return (
      keys
      .filter(function(key) { return object.hasOwnProperty(key); })
      .reduce(function(map, key) {
        map[key] = object[key];

        return map;
      }, {})
    );
  };
}
