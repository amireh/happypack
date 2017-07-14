var path = require('path');
var fs = require('fs-extra');
var sinon = require('sinon');
var multiline = require('multiline-slash');
var RPCHandlerShim = require('./RPCHandlerShim');
var interpolateGUID = require('./interpolateGUID');
var root = require('./root');

/**
 * @module TestUtils.IntegrationSuite
 *
 * @param {mocha} mochaSuite
 * @param {Object} suiteOptions
 * @param {Number} [suiteOptions.timeout=2000]
 */
module.exports = function createIntegrationSuite(mochaSuite, suiteOptions) {
  var sandbox;
  var testSuite = {};
  var suiteRoot = interpolateGUID(root.join('tmp/test-repo__[gid]-[guid]'));
  var cleanups = [];

  suiteOptions = suiteOptions || {};

  var timeout = process.env.HAPPY_TEST_TIMEOUT ?
    parseInt(process.env.HAPPY_TEST_TIMEOUT, 10) :
    suiteOptions.timeout || 2000
  ;

  mochaSuite.timeout(timeout);

  mochaSuite.beforeEach(function() {
    sandbox = sinon.sandbox.create({ useFakeTimers: false, useFakeServer: false });

    fs.ensureDirSync(suiteRoot);
  });

  mochaSuite.afterEach(function() {
    if (sandbox) {
      sandbox.restore();
      sandbox = null;
    }

    if (process.env.HAPPY_TEST_ARTIFACTS !== '1') {
      fs.removeSync(suiteRoot);
    }

    cleanups.forEach(function(callback) {
      callback();
    });

    cleanups.splice(0);
  });

  /**
   * Create a temporary file.
   *
   * @param  {String} fileName
   *         Relative file path.
   *
   * @param  {String|Function} contentsFn
   *         The contents of the file. If it's a function, we'll multiline-slash
   *         it.
   *
   * @return {Object} file
   * @return {String} file.path
   * @return {String} file.contents
   */
  testSuite.createFile = function(fileName, contentsFn) {
    var filePath = path.join(suiteRoot, fileName || '~file-[gid]');
    var contents = contentsFn instanceof Function ? multiline(contentsFn) : contentsFn;

    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, contents, 'utf-8');

    return { path: filePath, contents: contents };
  };

  testSuite.createDirectory = function(fileName) {
    var filePath = path.join(suiteRoot, fileName);

    fs.ensureDirSync(filePath);

    return { path: filePath };
  };

  testSuite.resolve = function() {
    return path.join.apply(path, [ suiteRoot ].concat([].slice.call(arguments)));
  };

  testSuite.getSinonSandbox = function() {
    return sandbox;
  };

  testSuite.createLoader = function(impl, query) {
    return testSuite.createLoaderFromString('module.exports = ' + impl.toString(), query);
  };

  testSuite.createLoaderFromString = function(string, query) {
    var loaderName = interpolateGUID('auto-generated-[gid]');
    var filePath = testSuite.resolve(loaderName + '-loader.js');

    fs.writeFileSync(filePath, string, 'utf-8');

    return { _name: loaderName, path: filePath, query: query };
  };

  // Listen for HappyLoader instances registering themselves to HappyRPCHandler,
  // grab that instance, and yield it so that you can install your spies and such.
  //
  // @return {Function}
  //   Returns the latest active loader instance, if any.
  testSuite.spyOnActiveLoader = function(fn) {
    var HappyRPCHandler = RPCHandlerShim.get();
    var registerActiveLoader = HappyRPCHandler.prototype.registerActiveLoader;
    var happyLoader;

    sandbox.stub(HappyRPCHandler.prototype, 'registerActiveLoader', function(id, loader) {
      happyLoader = loader;

      if (fn) {
        fn(happyLoader);
      }

      return registerActiveLoader.apply(this, arguments);
    });

    Object.defineProperty(testSuite, 'activeLoader', {
      configurable: true,
      enumerable: false,
      get: function() {
        return happyLoader;
      }
    });

    cleanups.push(function() {
      happyLoader = null;
    });

    return function() { return happyLoader; };
  };

  return testSuite;
};
