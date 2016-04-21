var fs = require('fs');
var mkdirp = require('mkdirp');
var accessFile = fs.accessSync || fs.existsSync;

exports.generateCompiledPath = function(filePath) {
  if (process.env.DEBUG) {
    return filePath.replace(/\W+/g, '_');
  }
  else {
    return 's-' + hashString(filePath);
  }
};

exports.isReadable = function(filePath) {
  try {
    var ret = accessFile(filePath, fs.R_OK);
    if (ret !== undefined) {
      return ret;
    }
    return true;
  }
  catch(e) {
    return false;
  }
};

exports.isWritable = function(filePath) {
  try {
    var ret = accessFile(filePath, fs.W_OK);
    if (ret !== undefined) {
      return ret;
    }
    return true;
  }
  catch(e) {
    return false;
  }
};


exports.mkdirSync = function(dirPath) {
  try {
    mkdirp.sync(dirPath);
  }
  catch (e) {
    if (!e.message.match('EEXIST')) {
      throw e;
    }
  }
};

// Courtesy of http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
function hashString(string) {
  var hash = 0;
  var i, chr, len;

  if (string.length === 0) return hash;

  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return String(hash);
}
