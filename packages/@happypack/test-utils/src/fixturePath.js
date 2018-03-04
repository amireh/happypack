var root = require('./root');

module.exports = function fixturePath(fileName) {
  return root.join('lib/__tests__/fixtures', fileName);
};
