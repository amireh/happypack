var fs = require('fs');

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
    fs.accessSync(filePath, fs.R_OK);

    return true;
  }
  catch(e) {
    return false;
  }
};

exports.isWritable = function(filePath) {
  try {
    fs.accessSync(filePath, fs.W_OK);

    return true;
  }
  catch(e) {
    return false;
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
