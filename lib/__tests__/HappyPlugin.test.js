var Subject = require('../HappyPlugin');
var HappyWorker = require('../HappyWorker');
var HappyTestUtils = require('../HappyTestUtils');
var assert = HappyTestUtils.assert;
var createLoader = HappyTestUtils.createLoader;
var createFile = HappyTestUtils.createFile;

describe('HappyPlugin', function() {
  it('works', function() {
    Subject({
      loaders: [createLoader(function(s) { return s + '123'; })]
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
    it('works', function(done) { // TODO an actual watch run integration test
      var subject = Subject({
        id: 'asdf',
        cache: false,
        loaders: [createLoader(function(s) { return s + '123'; })]
      });

      var inputFile = createFile('a.js', 'hello!');

      subject.state.compiler = { options: {} };
      subject.state.loaders = subject.config.loaders;
      subject.state.foregroundWorker = new HappyWorker({
        compiler: subject.state.compiler
      });

      subject.compileInForeground({
        request: inputFile.getPath(),
        resourcePath: inputFile.getPath(),
        sourceCode: inputFile.getContents(),
        sourceMap: {}
      }, function(err, source, map) {
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