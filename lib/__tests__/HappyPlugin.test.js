const Subject = require('../HappyPlugin');
const { assert, createLoader } = require('../HappyTestUtils');

describe('HappyPlugin', function() {
  it('works', function() {
    Subject({
      loaders: [createLoader(s => s + '123')]
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

  describe('#compileInForeground', function() {
    it('works', function(done) {
      let subject = Subject({
        id: 'asdf',
        cache: false,
        loaders: [createLoader(s => s + '123')]
      });

      subject.compileInForeground('hello!', null, { resourcePath: 'a.js' }, function(err, source, map) {
        if (err) {
          return done(err);
        }

        assert.equal(source, 'hello!123');
        assert.equal(map, null);

        done();
      });
    });
  });
});