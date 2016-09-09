var Subject = require('../HappyPlugin');
var HappyWorker = require('../HappyWorker');
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

  describe('#compileInForeground', function() {
    it('works', function(done) { // TODO an actual watch run integration test
      var subject = Subject({
        id: 'asdf',
        cache: false,
        loaders: [testSuite.createLoader(function(s) { return s + '123'; })]
      });

      var inputFile = testSuite.createFile('a.js', 'hello!');
      var compilerStub = { options: {}, plugin: function() {} };

      subject.apply(compilerStub);
      subject.state.loaders = subject.config.loaders;
      subject.state.foregroundWorker = new HappyWorker({
        compiler: compilerStub
      });

      subject.compileInForeground({
        request: inputFile.path,
        resourcePath: inputFile.path,
        sourceCode: inputFile.contents,
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