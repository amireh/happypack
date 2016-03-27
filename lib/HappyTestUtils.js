var path = require('path');
var fs = require('fs-extra');
var sinon = require('sinon');
var chai = require('chai');
var HappyPlugin = require('./HappyPlugin');
var TEMP_DIR = '/tmp/happypack';
var TestUtils = exports;

sinon.assert.expose(chai.assert, { prefix: "" });

beforeEach(function() {
  fs.ensureDirSync(TEMP_DIR);
  fs.emptyDirSync(TEMP_DIR);
});

afterEach(function() {
  fs.removeSync(TEMP_DIR);
});

exports.HAPPY_LOADER_PATH = path.resolve(__dirname, 'HappyLoader.js');
exports.assert = chai.assert;
exports.fixturePath = function(fileName) {
  return path.resolve(__dirname, '__tests__', 'fixtures', fileName);
};

exports.tempPath = function(fileName) {
  return path.resolve(TEMP_DIR, interpolateGUID(fileName));
};

exports.tempDir = function(dirName) {
  var dirPath = exports.tempPath(dirName);

  fs.ensureDirSync(dirPath);

  return dirPath;
};

exports.fixture = function(fileName) {
  return fs.readFileSync(exports.fixturePath(fileName), 'utf-8');
};

exports.createLoader = function(impl, query) {
  return exports.createLoaderFromString('module.exports = ' + impl.toString(), query);
};

exports.createLoaderFromString = function(string, query) {
  var loaderName = interpolateGUID('temp_loader__[guid]');
  var filePath = exports.tempPath(loaderName + '-loader.js');

  fs.writeFileSync(filePath, string, 'utf-8');

  return { _name: loaderName, path: filePath, query: query };
};

exports.createFile = function(fileName, contents) {
  var filePath = exports.tempPath(fileName);

  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, 'utf-8');

  return {
    getPath: function() {
      return filePath;
    },

    getContents: function() {
      return contents;
    }
  }
};

exports.clearCache = function() {
  fs.removeSync('.happypack');
};

exports.IntegrationSuite = function(mochaSuite) {
  mochaSuite.timeout(60000); // for travis

  mochaSuite.beforeEach(function() {
    HappyPlugin.resetUID();
  });

  mochaSuite.afterEach(function() {
    HappyPlugin.resetUID();
    TestUtils.clearCache();
  });
};

exports.getWebpackOutputBundlePath = function(rawStats, name) {
  return path.join(rawStats.compilation.outputOptions.path, name || 'bundle.js');
};

function interpolateGUID(string) {
  return string.replace('[guid]', guid());
}

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