var serializeError = require('serializerr');
var deserializeError = require('deserialize-error');

exports.serializeError = function (error) {
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(serializeError(error));
};

exports.deserializeError = function (errorString) {
  try {
    return deserializeError(JSON.parse(errorString));
  } catch (e) {
    // error wasn't a json string, just return it as string
    return errorString;
  }
};