var async = require('async');
var assert = require('assert');

exports.disectLoaderString = function disectLoaderString(string) {
  if (typeof string === 'object' && string && string.path) {
    return string;
  }

  var loaderStrings = string.split('!');
  if (loaderStrings.length === 1) {
    return extractPathAndQuery(loaderStrings[0]);
  }
  else {
    return loaderStrings.map(disectLoaderString);
  }
};

exports.resolveLoaders = function(compiler, loaders, done) {
  async.parallel(loaders.map(function(loader) {
    assert(!!loader, "Invalid loader string to resolve!!! " + JSON.stringify(loaders));
    return function(callback) {
      compiler.resolvers.loader.resolve(process.cwd(), loader, function(err, result) {
        if (err) {
          return callback(err);
        }

        callback(null, extractPathAndQuery(result));
      });
    }
  }), done);
};

exports.applyLoaders = require('./applyLoaders');

exports.convertLoadersToObjects = function(loaders) {
  return loaders.map(function(loader) {
    if (typeof loader === 'string') {
      return extractPathAndQuery(loader);
    }
    else if (typeof loader === 'object') {
      return loader;
    }
  })
}

function extractPathAndQuery(string) {
  var fragments = string.split('?');

  if (fragments.length === 1) {
    return { path: string };
  }

  return { path: fragments[0], query: '?' + fragments[1] };
}
