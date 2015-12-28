var path = require('path');
var fs = require('fs');
var sinon = require('sinon');
var chai = require('chai');

sinon.assert.expose(chai.assert, { prefix: "" });

exports.fixturePath = function(fileName) {
  return path.resolve(__dirname, '__tests__', 'fixtures', fileName);
};

exports.tempPath = function(fileName) {
  return path.resolve(__dirname, '..', 'tmp', fileName);
};

exports.fixture = function(fileName) {
  return fs.readFileSync(exports.fixturePath(fileName), 'utf-8');
};