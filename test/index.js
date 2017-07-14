var testUtils = require('happypack-test-utils');
var HappyRPCHandler = require('../lib/HappyRPCHandler');

// dependency injections
testUtils.injectRPCHandler(HappyRPCHandler);

console.log(
  '>>> Running happypack tests against webpack upstream version' +
  '"%s" <<<', testUtils.getWebpackVersion()
);