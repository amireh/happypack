var serializeError = require('serialize-error');

exports.serialize = function (error) {
  if (typeof error === 'string') {
    return error;
  }

  return JSON.stringify(serializeError(error));
};

exports.deserialize = function (errorString) {
  var errorData = null;

  try {
    errorData = JSON.parse(errorString);
  }
  catch (e) {
    // error wasn't a json string, just return it
    return errorString;
  }

  return Object.keys(errorData).reduce(function(error, key) {
    error[key] = errorData[key];

    return error;
  }, new Error())
};
