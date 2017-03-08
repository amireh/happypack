var serializeError = require('serialize-error');
var objectAssign = require('./WebpackUtils').objectAssign;

exports.serialize = function (error) {
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(serializeError(error));
};

exports.deserialize = function (errorString) {
  var error = null;
  try {
    error = JSON.parse(errorString);
  } catch (e) {
    // error wasn't a json string, just return it
    return errorString;
  }
  return objectAssign(new Error(), {stack: undefined}, error);
};