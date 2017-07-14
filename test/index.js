var testUtils = require('happypack-test-utils');
var HappyRPCHandler = require('../lib/HappyRPCHandler');
var sinon = require('sinon');
var chai = require('chai');

sinon.assert.expose(chai.assert, { prefix: "" });

// dependency injections
testUtils.injectRPCHandler(HappyRPCHandler);

console.log(
  '>>> Running happypack tests against webpack upstream version' +
  '"%s" <<<', testUtils.getWebpackVersion()
);