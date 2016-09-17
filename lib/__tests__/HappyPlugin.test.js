var Subject = require('../HappyPlugin');
var HappyTestUtils = require('../HappyTestUtils');
var assert = HappyTestUtils.assert;

describe('HappyPlugin', function() {
  var testSuite = HappyTestUtils.IntegrationSuite2(this);

  it('works', function() {
    Subject({
      loaders: [testSuite.createLoader(function(s) { return s + '123'; })]
    });
  });

  it('bails if an invalid loader array is passed in', function() {
    assert.throws(function() {
      Subject({ loaders: 'babel' })
    }, 'Loaders must be an array!');
  });

  it('bails if there are no loaders', function() {
    assert.throws(function() {
      Subject({ loaders: [] })
    }, 'You must specify at least one loader!');
  });

  it('bails if an invalid loader is passed in', function() {
    assert.throws(function() {
      Subject({ loaders: [ function() {} ] })
    }, 'Loader must have a @path property or be a string.');
  });
});