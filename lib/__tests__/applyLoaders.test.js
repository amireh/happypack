'use strict';

const Subject = require("../applyLoaders");
const { assert } = require('chai');
const IdentityLoader = require('./fixtures/identity_loader');
const AnotherLoader = require('./fixtures/another_loader');
const sinon = require('sinon');
const { fixture, fixturePath } = require('../HappyTestUtils');

const FIXTURES = {
  singleLoader: [{
    path: fixturePath('identity_loader.js'),
    query: '?presets[]=babel-preset-2015!'
  }]
};

describe("applyLoaders", function() {
  const sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
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
        loaders,
        loaderContext: { resourcePath: './a.js' }
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
      loaders: FIXTURES.singleLoader,
      loaderContext: { resourcePath: './a.js' }
    }, 'hello!', null, function(err, result) {
      assert.equal(result.code, 'hello!5');
      done();
    });
  });

  context('when a loader throws an error', function() {
    beforeEach(function() {
      sandbox.stub(IdentityLoader, '__impl__', () => { throw 'teehee!' });
    });

    it('propagates it', function(done) {
      Subject({
        loaders: FIXTURES.singleLoader,
        loaderContext: { resourcePath: './a.js' }
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
        loaders: FIXTURES.singleLoader,
        loaderContext: { resourcePath: './a.js' }
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

    it('applies them in a waterfall fashion', function(done) {
      sandbox.spy(AnotherLoader, '__impl__');
      sandbox.spy(IdentityLoader, '__impl__');

      Subject({
        loaders,
        loaderContext: { resourcePath: './a.js' }
      }, 'hello!', null, function(err, result) {
        assert.calledWith(AnotherLoader.__impl__, 'hello!');
        assert.calledWith(IdentityLoader.__impl__, 'hello!5');

        assert.ok(!err);
        assert.equal(result.code, 'hello!5');

        done();
      });
    });

    it('aborts execution as soon as an error is raised', function(done) {
      sandbox.stub(AnotherLoader, '__impl__', () => { throw 'teehee!' });
      sandbox.spy(IdentityLoader, '__impl__');

      Subject({
        loaders,
        loaderContext: { resourcePath: './a.js' }
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
        loaders,
        loaderContext: { resourcePath: './a.js' }
      }, fixture('a.js'), null, function(err) {
        if (err) { return done(err); }

        assert.deepEqual(inputValues[0], {});
        assert.deepEqual(inputValues[1], { foo: 'bar' });

        done();
      });
    });
  });
});
