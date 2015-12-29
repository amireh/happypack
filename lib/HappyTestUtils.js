var path = require('path');
var fs = require('fs');
var sinon = require('sinon');
var chai = require('chai');

sinon.assert.expose(chai.assert, { prefix: "" });

exports.assert = chai.assert;
exports.fixturePath = function(fileName) {
  return path.resolve(__dirname, '__tests__', 'fixtures', fileName);
};

exports.tempPath = function(fileName) {
  return path.resolve('/tmp', fileName);
};

exports.fixture = function(fileName) {
  return fs.readFileSync(exports.fixturePath(fileName), 'utf-8');
};

exports.createLoader = function(impl, query) {
  var filePath = exports.tempPath('temp_loader.js');

  fs.writeFileSync(filePath, 'module.exports = ' + impl.toString(), 'utf-8');

  return { path: filePath, query: query };
};