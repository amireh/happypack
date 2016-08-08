var path = require('path');
var fs = require('fs-extra');
var sinon = require('sinon');
var chai = require('chai');
var multiline = require('multiline-slash');
var HappyPlugin = require('./HappyPlugin');
var HappyRPCHandler = require('./HappyRPCHandler');
var CACHE_DIR = path.resolve(__dirname, '../.happypack');
var cleanups = [];
var gid = 0;

sinon.assert.expose(chai.assert, { prefix: "" });

afterEach(function() {
  cleanups.forEach(function(callback) {
    callback();
  });

  cleanups = [];
});

exports.HAPPY_LOADER_PATH = path.resolve(__dirname, 'HappyLoader.js');
exports.assert = chai.assert;
exports.fixturePath = function(fileName) {
  return path.resolve(__dirname, '__tests__', 'fixtures', fileName);
};

exports.fixture = function(fileName) {
  return fs.readFileSync(exports.fixturePath(fileName), 'utf-8');
};

exports.assertNoWebpackErrors = function(err, rawStats, done) {
  if (err) {
    done(err);
    return true;
  }

  var stats = rawStats.toJson();

  if (stats.errors.length) {
    done(stats.errors);
    return true;
  }

  if (stats.warnings.length) {
    done(stats.warnings);
    return true;
  }
};

// courtesy of http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function interpolateGUID(string) {
  return string
    .replace(/\[guid\]/g, function() {
      return guid();
    }).replace(/\[gid\]/g, function() {
      return ++gid;
    })
  ;
}

/**
 * @module TestUtils.IntegrationSuite
 *
 * @param {mocha} mochaSuite
 * @param {Object} suiteOptions
 * @param {Number} [suiteOptions.timeout=2000]
 */
function IntegrationSuite2(mochaSuite, suiteOptions) {
  var sandbox;
  var testSuite = {};
  var suiteRoot = interpolateGUID(path.join(__dirname, '../tmp/test-repo__[gid]-[guid]'));

  suiteOptions = suiteOptions || {};

  var timeout = process.env.HAPPY_TEST_TIMEOUT ?
    parseInt(process.env.HAPPY_TEST_TIMEOUT, 10) :
    suiteOptions.timeout || 2000
  ;

  mochaSuite.timeout(timeout);

  mochaSuite.beforeEach(function() {
    HappyPlugin.resetUID();

    fs.removeSync(CACHE_DIR);
    fs.ensureDirSync(suiteRoot);
  });

  mochaSuite.afterEach(function() {
    if (sandbox) {
      sandbox.restore();
      sandbox = null;
    }

    fs.removeSync(CACHE_DIR);

    if (process.env.HAPPY_TEST_ARTIFACTS !== '1') {
      fs.removeSync(suiteRoot);
    }

    HappyPlugin.resetUID();
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
    if (!sandbox) {
      sandbox = sinon.sandbox.create({ useFakeTimers: false, useFakeServer: false });
    }

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

exports.IntegrationSuite2 = IntegrationSuite2;