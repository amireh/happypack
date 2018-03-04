var assert = require('assert');

module.exports = function parseAndValidateOptions(params, schema, displayName) {
  // ensure required parameters are passed in
  Object.keys(schema)
    .filter(function(key) {
      if (schema[key].isRequired instanceof Function) {
        return schema[key].isRequired();
      }
      return schema[key].isRequired;
    })
    .forEach(function(key) {
      assert(params.hasOwnProperty(key),
        format("Missing required parameter '" + key + "'")
      );
    })
  ;

  const aliased = Object.keys(schema).reduce(function(map, key) {
    const def = schema[key];

    map[key] = def;

    if (def.alias) {
      map[def.alias] = def;
    }

    return map;
  }, {})

  return Object.keys(params).reduce(function(hsh, key) {
    assert(aliased.hasOwnProperty(key),
      format("Unrecognized option '" + key + "'")
    );

    var spec = aliased[key];
    var value = params[key];
    var validationError;

    if (spec.deprecated === true) {
      console.warn(
        format(
          "Option '%s' has been deprecated. Configuring it will " +
          "cause an error to be thrown in future versions."
        ),
        key
      );

      return hsh;
    }

    if (spec.validate) {
      validationError = spec.validate(value);

      assert(!validationError, format(validationError));
    }

    if (spec.type) {
      assert(typeof value === spec.type,
        format("Option '" + key + "' must be of type '" + spec.type + "' not '" + typeof value + "'.")
      );
    }

    if (spec.default && (value === undefined || value === null)) {
      hsh[key] = spec.default;
    }
    else {
      hsh[key] = value;
    }

    return hsh;
  }, getDefaults());

  function getDefaults() {
    return Object.keys(schema).reduce(function(hsh, key) {
      if (schema[key].default) {
        hsh[key] = schema[key].default;
      }

      return hsh;
    }, {});
  }

  function format(message) {
    return displayName + ": " + message;
  }
};