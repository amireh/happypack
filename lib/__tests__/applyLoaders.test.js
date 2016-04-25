'use strict';

const Subject = require("../applyLoaders");
const { assert } = require('chai');
const IdentityLoader = require('./fixtures/identity_loader');
const AnotherLoader = require('./fixtures/another_loader');
const { fixture, fixturePath } = require('../HappyTestUtils');
const TestUtils = require('../HappyTestUtils');
const multiline = require('multiline-slash');

const FIXTURES = {
  singleLoader: [{
    path: fixturePath('identity_loader.js'),
    query: '?presets[]=babel-preset-2015!'
  }]
};

describe("applyLoaders", function() {
  let sandbox;
  let compiler;

  beforeEach(function() {
    sandbox = TestUtils.getSinonSandbox();
    compiler = sandbox.stub();
  });

  context('when invoked', function() {
    const loaders = FIXTURES.singleLoader;

    let context;

    beforeEach(function(done) {
      sandbox.stub(IdentityLoader, '__impl__', function(source, map) {
        context = this;

        this.callback(null, source, map);
      });

      Subject({
        compiler,
        loaders,
        loaderContext: { request: './a.js', resourcePath: './a.js' }
      }, 'hello!', null, done);
    });

    it('passes the source code to the loader', function() {
      assert.calledWith(IdentityLoader.__impl__, 'hello!');
    });

    it('passes the (currently null) source map to the loader', function() {
      assert.calledWith(IdentityLoader.__impl__, 'hello!', null);
    });

    it('sets the context @resourcePath', function() {
      assert.equal(context.resourcePath, './a.js');
    });

    it('sets the context @query', function() {
      assert.equal(context.query, loaders[0].query);
    });
  });

  it('works with a synchronous returning loader', function(done) {
    sandbox.stub(IdentityLoader, '__impl__', function(source) {
      return source + '5';
    });

    Subject({
      compiler,
      loaders: FIXTURES.singleLoader,
      loaderContext: { request: './a.js', resourcePath: './a.js' }
    }, 'hello!', null, function(err, code) {
      assert.equal(code, 'hello!5');
      done();
    });
  });

  context('when a loader throws an error', function() {
    beforeEach(function() {
      sandbox.stub(IdentityLoader, '__impl__', () => { throw 'teehee!' });
    });

    it('propagates it', function(done) {
      Subject({
        compiler,
        loaders: FIXTURES.singleLoader,
        loaderContext: { request: './a.js', resourcePath: './a.js' }
      }, 'hello!', null, function(err) {
        assert.equal(err, 'teehee!');
        done();
      });
    });
  });

  context('when a loader emits an error', function() {
    beforeEach(function() {
      sandbox.stub(IdentityLoader, '__impl__', function() {
        this.callback('teehee!');
      });
    });

    it('propagates it', function(done) {
      Subject({
        compiler,
        loaders: FIXTURES.singleLoader,
        loaderContext: { request: './a.js', resourcePath: './a.js' }
      }, 'hello!', null, function(err) {
        assert.equal(err, 'teehee!');
        done();
      });
    });
  });

  context('given multiple loaders', function() {
    const loaders = [
      {
        path: fixturePath('identity_loader.js'),
      },
      {
        path: fixturePath('another_loader.js'),
      },
    ];

    it('applies them in a waterfall fashion from right to left', function(done) {
      sandbox.spy(AnotherLoader, '__impl__');
      sandbox.spy(IdentityLoader, '__impl__');

      Subject({
        compiler,
        loaders,
        loaderContext: { request: './a.js', resourcePath: './a.js' }
      }, 'hello!', null, function(err, code) {
        if (err) { return done(err); }

        assert.calledWith(AnotherLoader.__impl__, 'hello!');
        assert.calledWith(IdentityLoader.__impl__, 'hello!5');

        assert.equal(code, 'hello!5');

        done();
      });
    });

    it('aborts execution as soon as an error is raised', function(done) {
      sandbox.stub(AnotherLoader, '__impl__', () => { throw 'teehee!' });
      sandbox.spy(IdentityLoader, '__impl__');

      Subject({
        compiler,
        loaders,
        loaderContext: { request: './a.js', resourcePath: './a.js' }
      }, fixture('a.js'), null, function(err) {
        assert.called(AnotherLoader.__impl__);
        assert.notCalled(IdentityLoader.__impl__);

        assert.equal(err, 'teehee!');

        done();
      });
    });

    it('passes down values from one loader to another as @inputValues', function(done) {
      var inputValues = [];

      sandbox.stub(AnotherLoader, '__impl__', function(s) {
        inputValues.push(this.inputValues);

        this.values = { foo: 'bar' };

        return s;
      });

      sandbox.stub(IdentityLoader, '__impl__', function(s) {
        inputValues.push(this.inputValues);

        return s;
      });

      Subject({
        compiler,
        loaders,
        loaderContext: { request: './a.js', resourcePath: './a.js' }
      }, fixture('a.js'), null, function(err) {
        if (err) { return done(err); }

        assert.deepEqual(inputValues[0], {});
        assert.deepEqual(inputValues[1], { foo: 'bar' });

        done();
      });
    });

    it('passes down the map', function(done) {
      const PING = 1;
      const PONG = 2;

      sandbox.stub(AnotherLoader, '__impl__', function(s, map) {
        assert.equal(map, PING);

        this.callback(null, s, PONG);
      });

      Subject({
        compiler,
        loaders,
        loaderContext: { request: './a.js', resourcePath: './a.js' }
      }, fixture('a.js'), PING, function(err, code, map) {
        if (err) { return done(err); }

        assert.equal(map, PONG);

        done();
      });
    });
  });

  describe('pitching loaders', function() {
    let state;

    beforeEach(function(done) {
      // an easy way to make these weird assertions; we'll clobber this state in
      // our loaders and assert against it:
      global.pitchLoaderSpecState = state = {
        applyIndex: [],
        pitchIndex: [],
        dataMap: {},
        remainingRequestMap: {},
        precedingRequestMap: {},
      };

      const loaders = [
        TestUtils.createLoaderFromString(multiline(function() {
          // module.exports = function(s) {
          //   global.pitchLoaderSpecState.applyIndex.push('a');
          //
          //   return s;
          // };
        })),

        TestUtils.createLoaderFromString(multiline(function() {
          // module.exports = function(s) {
          //   global.pitchLoaderSpecState.applyIndex.push('b');
          //   global.pitchLoaderSpecState.dataMap['b'] = this.data;
          //
          //   return s;
          // };
          //
          // module.exports.pitch = function(remainingRequest, precedingRequest, data) {
          //   global.pitchLoaderSpecState.pitchIndex.push('b');
          //   global.pitchLoaderSpecState.remainingRequestMap.b = remainingRequest;
          //   global.pitchLoaderSpecState.precedingRequestMap.b = precedingRequest;
          //
          //   data.foo = 'bar';
          // };
        })),

        TestUtils.createLoaderFromString(multiline(function() {
          // module.exports = function(s) {
          //   global.pitchLoaderSpecState.applyIndex.push('c');
          //
          //   return s;
          // };
          //
          // module.exports.pitch = function(remainingRequest, precedingRequest) {
          //   global.pitchLoaderSpecState.pitchIndex.push('c');
          //   global.pitchLoaderSpecState.remainingRequestMap.c = remainingRequest;
          //   global.pitchLoaderSpecState.precedingRequestMap.c = precedingRequest;
          //
          //   return '// intercepted by "c" loader pitch';
          // };
        })),

        TestUtils.createLoaderFromString(multiline(function() {
          // module.exports = function(s) {
          //   global.pitchLoaderSpecState.applyIndex.push('d');
          //
          //   return s;
          // };
          //
        })),
      ];

      Subject({
        compiler,
        loaders,
        loaderContext: {
          request: 'a!b!c!d!./foo.js',
          resourcePath: './foo.js'
        }
      }, 'console.log("hello!");', null, function(err, code, map) {
        if (err) return done(err);

        global.pitchLoaderSpecState.code = code;
        global.pitchLoaderSpecState.map = map;

        done();
      });
    });

    afterEach(function() {
      state = null;
      delete global.pitchLoaderSpecState;
    });

    it('applies #pitch from left-to-right', function() {
      assert.deepEqual(state.pitchIndex, [ 'b', 'c' ]);
    });

    it('ignores loaders to the right if a pitch yields', function() {
      assert.deepEqual(state.applyIndex, [ 'b', 'a' ]);
    });

    it('passes the correct remainingRequest fragment', function() {
      assert.equal(state.remainingRequestMap.b, "c!d!./foo.js");
      assert.equal(state.remainingRequestMap.c, "d!./foo.js");
    });

    it('passes the correct precedingRequest fragment', function() {
      assert.equal(state.precedingRequestMap.b, "a");
      assert.equal(state.precedingRequestMap.c, "a!b");
    });

    it('passes @data between pitch and normal phase', function() {
      assert.deepEqual(Object.keys(state.dataMap), [ 'b' ]);
      assert.deepEqual(state.dataMap.b, { foo: 'bar' });
    });

    it('uses the result yielded by any pitch loader', function() {
      assert.equal(state.code, '// intercepted by "c" loader pitch');
    });
  });
});
