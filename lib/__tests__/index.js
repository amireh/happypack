var getWebpackVersion = require('./utils/getWebpackVersion');

console.log(
  '>>> Running happypack tests against webpack upstream version "%s" <<<',
  getWebpackVersion()
);