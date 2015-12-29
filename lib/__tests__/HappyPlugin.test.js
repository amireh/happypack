const Subject = require('../HappyPlugin');
const { assert, createLoader } = require('../HappyTestUtils');

describe('HappyPlugin', function() {
  it('works', function() {
    Subject({
      loaders: [createLoader(s => s + '123')]
    });
  });

  describe('#compileInForeground', function() {
    it('works', function(done) {
      let subject = Subject({
        loaders: [createLoader(s => s + '123')]
      });

      subject.compileInForeground('hello!', null, 'a.js', function(err, source, map) {
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