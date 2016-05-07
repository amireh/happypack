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

/**
 * Extract the set of loaders (one or more) from a given a "module.loaders"
 * webpack config entry.
 *
 * Example inputs/outputs:
 *
 *     // a loader chain
 *     {
 *       loaders: [ 'style', 'css' ]
 *     }
 *     // => [ "style", "css" ]
 *
 *     // another loader chain
 *     {
 *       loaders: [ 'style!css' ]
 *     }
 *     // => [ "style!css" ]
 *
 *     // a single loader, no query:
 *     {
 *       loader: 'babel'
 *     }
 *     // => [ "babel" ]
 *
 *     // a single loader with inline query:
 *     {
 *       loader: 'babel?presets[]=react'
 *     }
 *     // => [ "babel?presets[]=react" ]
 *
 *     // a single loader with a query object:
 *     {
 *       loader: 'babel',
 *       query: { presets: [ 'react' ] }
 *     }
 *     // => [ "babel?presets[]=react" ]
 *
 * @param  {Object} entry
 * @param  {Array.<String>?} entry.loaders
 * @param  {String?} entry.loader
 * @param  {Object?} entry.query
 *
 * @return {Array.<String>}
 */
exports.extractLoaders = function extractLoaders(entry) {
  if (entry.loaders) {
    return entry.loaders;
  }

  var query = '';

  if (entry.query) {
    if (typeof entry.query === 'object') {
      query = '?' + JSON.stringify(entry.query);
    }
    else if (typeof entry.query === 'string') {
      query = entry.query[0] === '?' ? '' : '?';
      query += entry.query;
    }
  }

  return [
    entry.loader + query
  ];
};

exports.resolveLoaders = function(compiler, loaders, done) {
  async.parallel(loaders.map(function(loader) {
    assert(!!loader, "Invalid loader string to resolve!!! " + JSON.stringify(loaders));

    return function(callback) {
      // webpack2 has changed the signature for the resolve method, but there's
      // no way to tell the current compiler version so we need to try/catch
      // and wack-a-mole
      //
      // fixes #23
      var callArgs = [ compiler.context, loader, function(err, result) {
        if (err) {
          return callback(err);
        }

        callback(null, extractPathAndQuery(result));
      }];

      try {
        compiler.resolvers.loader.resolve.apply(compiler.resolvers.loader, callArgs);
      }
      catch(e) {
        if (e.toString().match(/Signature changed: context parameter added/)) {
          compiler.resolvers.loader.resolve.apply(
            compiler.resolvers.loader,
            [ compiler.context ].concat(callArgs)
          );
        }
        else {
          throw e;
        }
      }
    };
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
