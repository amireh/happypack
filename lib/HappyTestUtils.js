var path = require('path');
var fs = require('fs');
var sinon = require('sinon');
var chai = require('chai');
var HappyUtils = require('./HappyUtils');

sinon.assert.expose(chai.assert, { prefix: "" });

exports.assert = chai.assert;
exports.fixturePath = function(fileName) {
  return path.resolve(__dirname, '__tests__', 'fixtures', fileName);
};

exports.tempPath = function(fileName) {
  HappyUtils.mkdirSync(path.resolve('/tmp/happypack'));

  return path.resolve('/tmp/happypack', fileName);
};

exports.fixture = function(fileName) {
  return fs.readFileSync(exports.fixturePath(fileName), 'utf-8');
};

exports.createLoader = function(impl, query) {
  var filePath = exports.tempPath('temp_loader.' + guid() + '.js');

  fs.writeFileSync(filePath, 'module.exports = ' + impl.toString(), 'utf-8');

  return { path: filePath, query: query };
};

exports.createFile = function(suite, fileName, contents) {
  var filePath = exports.tempPath(fileName);

  suite.beforeEach(function() {
    fs.writeFileSync(filePath, contents, 'utf-8');
  });

  suite.afterEach(function() {
    fs.unlinkSync(filePath);
  });

  return {
    getPath: function() {
      return filePath;
    },

    getContents: function() {
      return contents;
    }
  }
};

// courtesy of http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}