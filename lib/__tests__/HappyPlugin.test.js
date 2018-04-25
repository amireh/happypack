var Subject = require('../HappyPlugin');
var HappyTestUtils = require('@happypack/test-utils');
var assert = HappyTestUtils.assert;

describe('HappyPlugin', function() {
  var testSuite = HappyTestUtils.createIntegrationSuite(this);

  it('works', function() {
    Subject({
      loaders: [testSuite.createLoader(function(s) { return s + '123'; })]
    });
  });

  it('bails if there are no loaders', function() {
    assert.throws(function() {
      Subject({ loaders: [] })
    }, 'You must specify at least one loader!');
  });

  it('bails if an invalid loader array is passed in', function() {
    assert.throws(function() {
      Subject({ loaders: 'babel' })
    }, 'Loaders must be an array!');
  });

  it('bails if an invalid loader is passed in', function() {
    assert.throws(function() {
      Subject({ loaders: [ function() {} ] })
    }, 'Loader must have a @path or @loader property or be a string.');
  });

  it('accepts a loader as a string', function() {
    assert.doesNotThrow(function() {
      Subject({ loaders: [ 'babel' ] })
    });
  });

  it('accepts a loader object with path specified in @path', function() {
    assert.doesNotThrow(function() {
      Subject({ loaders: [ { path: 'babel' } ] })
    });
  })

  it('accepts a loader object with path specified in @loader', function() {
    assert.doesNotThrow(function() {
      Subject({ loaders: [ { loader: 'babel' } ] })
    });
  })

  it('accepts loaders on the "use" property', function() {
    assert.doesNotThrow(function() {
      Subject({ use: [ { loader: 'babel' } ] })
    });
  })
});
