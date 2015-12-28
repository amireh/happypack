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

      Subject(loaders, 'hello!', './a.js', done);
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

  context('when a loader throws an error', function() {
    beforeEach(function() {
      sandbox.stub(IdentityLoader, '__impl__', () => { throw 'teehee!' });
    });

    it('propagates it', function(done) {
      Subject(FIXTURES.singleLoader, 'hello!', './a.js', function(err) {
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
      Subject(FIXTURES.singleLoader, 'hello!', './a.js', function(err) {
        assert.equal(err, 'teehee!');
        done();
      });
    });
  });

  context('given multiple loaders', function() {
    const loaders = [
      {
        path: fixturePath('another_loader.js'),
      },
      {
        path: fixturePath('identity_loader.js'),
      },
    ];

    it('applies them in a waterfall fashion', function(done) {
      sandbox.spy(AnotherLoader, '__impl__');
      sandbox.spy(IdentityLoader, '__impl__');

      Subject(loaders, fixture('a.js'), 'a.js', function(err, result) {
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

      Subject(loaders, fixture('a.js'), 'a.js', function(err) {
        assert.called(AnotherLoader.__impl__);
        assert.notCalled(IdentityLoader.__impl__);

        assert.equal(err, 'teehee!');

        done();
      });
    });
  });
});
