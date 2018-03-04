var testUtils = require('@happypack/test-utils');
var HappyRPCHandler = require('../HappyRPCHandler');

beforeEach(function() {
  // dependency injections
  testUtils.injectRPCHandler(HappyRPCHandler);
})

console.log(
  '>>> Running happypack tests against webpack upstream version' +
  '"%s" <<<', testUtils.getWebpackVersion()
);