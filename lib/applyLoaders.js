var HappyFakeLoaderContext = require('./HappyFakeLoaderContext');
var fnOncePedantic = require('./fnOncePedantic');
var assert = require('assert');

/**
 * If this ain't a monster, I don't know what is.
 *
 *
 *               .'''''-,              ,-`````.
 *               `-.._  |              |  _..-'
 *                  \    `,          ,'    /
 *                  '=   ,/          \,   =`
 *                  '=   (            )   =`
 *                 .\    /            \    /.
 *                /  `,.'              `.,'  \
 *                \   `.                ,'   /
 *                 \    \              /    /
 *                  \   .`.  __.---. ,`.   /
 *                   \.' .'``        `. `./
 *                    \.'  -'''-..     `./
 *                    /  /        '.      \
 *                   /  / .--  .-'''`      '.
 *                  '   |    ,---.    _      \
 *      /``-----._.-.   \   / ,-. '-'   '.   .-._.-----``\
 *      \__ .     | :    `.' ((O))   ,-.  \  : |     . __/
 *       `.  '-...\_`     |   '-'   ((O)) |  '_/...-`  .'
 *  .----..)    `    \     \      /  '-'  / /    '    (..----.
 * (o      `.  /      \     \    /\     .' /      \  .'      o)
 *  ```---..   `.     /`.    '--'  '---' .'\     .'   ..---```
 *          `-.  `.  /`.  `.           .' .'\  .'  .-'
 *             `..` /   `.'  ` - - - ' `.'   \ '..'
 *                 /    /                \    \
 *                /   ,'                  `.   \
 *                \  ,'`.                .'`.  /
 *                 `/    \              /    \'
 *                  ,=   (              )   =,
 *                  ,=   '\            /`   =,
 *    LGB           /    .'            `.    \
 *               .-'''  |                |  ```-.
 *               `......'                `......'
 *
 * @param {Object}            runContext
 * @param {HappyFakeCompiler} runContext.compiler
 * @param {Array.<Object>}    runContext.loaders
 * @param {Object}            runContext.loaderContext
 *
 * @param {String}            runContext.loaderContext.remoteLoaderId
 *        The ID of the HappyLoader instance that initiated this compilation
 *        request.
 *
 * @param {String}            runContext.loaderContext.request
 *        The full request for the resource including the loader chain string.
 *        Something like:
 *          '/path/to/style-loader.js!/path/to/css-loader.js!/path/to/resource.css'
 *
 * @param {String}            runContext.loaderContext.context
 *        The directory of the resource, useful for resolving siblings.
 *
 * @param {String}            runContext.loaderContext.resource
 *        The resource path without the loader chain. This includes the file
 *        and the query fragment.
 *
 * @param {String}            runContext.loaderContext.resourcePath
 *        The resource file.
 *
 * @param {String}            runContext.loaderContext.resourceQuery
 *        The resource query.
 *
 * @param {String}            sourceCode
 * @param {Object}            sourceMap
 *
 * @param {Function}          done
 * @param {String|Error}      done.err
 * @param {String}            done.sourceCode
 * @param {Object}            done.sourceMap
 */
module.exports = function applyLoaders(runContext, sourceCode, sourceMap, done) {
  assert(runContext.compiler, "Missing webpack compiler instance!");

  // we start out by creating fake loader contexts for every loader
  var loaders = runContext.loaders.map(function(loader) {
    return {
      request: loader.request,
      path: loader.path,
      query: loader.query,
      module: require(loader.path),

      // TODO: this is probably not the best place to create the context, and it
      // also should be cached at some layer
      context: HappyFakeLoaderContext({
        _compiler: runContext.compiler, // for compiler RPCs
        _remoteLoaderId: runContext.loaderContext.remoteLoaderId, // for loader RPCs
        fs: runContext.compiler.inputFileSystem,

        query: loader.query,
        options: runContext.compiler.options,

        request: runContext.loaderContext.request,
        resource: runContext.loaderContext.resource,
        resourcePath: runContext.loaderContext.resourcePath,
        resourceQuery: runContext.loaderContext.resourceQuery,
        context: runContext.loaderContext.context,

        _dependencies: runContext.loaderContext._dependencies,
        _contextDependencies: runContext.loaderContext._contextDependencies,

        sourceMap: Boolean(runContext.loaderContext.useSourceMap),
        target: runContext.loaderContext.target,
        minimize: runContext.loaderContext.minimize,
      })
    };
  });

  loaders.forEach(function exposeLoaderSetToEachLoader(loader, index) {
    loader.context.loaders = loaders;
    loader.context.loaderIndex = index;
  });

  // Go through the pitching phase. This might affect the loader contexts.
  applyPitchLoaders(runContext.loaderContext.request, loaders, function(err, pitchResult) {
    if (err) {
      return done(err);
    }

    var apply = NormalLoaderApplier(loaders, pitchResult.dataMap, done);

    // pitching phase did yield something so we skip the loaders to the right
    // and use the yielded code as the starting sourceCode
    if (pitchResult.sourceCode) {
      apply(pitchResult.cursor - 1, pitchResult.sourceCode, pitchResult.sourceMap);
    }
    // otherwise, we just start from the right-most loader using the input
    // source code and map:
    else {
      apply(loaders.length - 1, sourceCode, sourceMap);
    }
  });
}

// Perform the loader pitching phase.
//
// Pitching loaders are applied from left to right. Each loader is presented
// with the request string disected into two bits; from the start until its
// place in the string, then the remainder of the request.
//
// For example, for a request like the following:
//
//     "c!b!a!./foo.js"
//
// The run order will be like the following with the inputs outlined at each
// application step:
//
// 1. Loader "c"
//
//     [remainingRequest] => "b!a!./foo.js"
//     [precedingRequest] => ""
//
// 2. Loader "b"
//
//     [remainingRequest] => "a!./foo.js"
//     [precedingRequest] => "c"
//
// 2. Loader "a"
//
//     [remainingRequest] => "./foo.js"
//     [precedingRequest] => "c!b"
//
// Finally, it is also presented with a special "data" state variable that will
// be shared between the pitch and normal phases for **that specific loader**.
//
// For example:
//
//     module.exports = function() {
//       console.log(this.data.value); // => 42
//     };
//
//     module.exports.pitch = function(_, _, data) {
//       data.value = 42;
//     };
//
function applyPitchLoaders(request, loaders, done) {
  var requestFragments = request.split(/\!/g);

  (function applyPitchLoader(cursor, dataMap) {
    var loader = loaders[cursor];

    if (!loader) {
      return done(null, {
        cursor: null,
        sourceCode: null,
        sourceMap: null,
        dataMap: dataMap,
      });
    }
    else if (!loader.module.pitch) {
      return applyPitchLoader(cursor + 1, dataMap);
    }
    else {
      // pitch loader, when applied, may modify any of these context variables:
      //
      // - this.resourcePath
      // - this.resourceQuery
      // - this.resource
      // - this.loaderIndex (TODO: why would this be modified? does it affect the run order?!)
      applySyncOrAsync(loader.module.pitch, loader.context, [
        requestFragments.slice(cursor+1).join('!'),
        requestFragments.slice(0, cursor).join('!'),
        dataMap[cursor]
      ], function(err, sourceCode, sourceMap) {
        if (err) {
          done(err);
        }
        else if (sourceCode) {
          done(null, {
            cursor: cursor,
            sourceCode: sourceCode,
            sourceMap: sourceMap,
            dataMap: dataMap,
          });
        }
        else {
          applyPitchLoader(cursor + 1, dataMap);
        }
      });
    }
  }(0, loaders.map(function() { return {}; })));
}

// Generates a function that will perform the "normal" loader phase (ie
// non-pitching.)
//
// Normal loaders are applied from right-to-left and may yield one or both of
// "sourceCode" and "sourceMap" values.
//
// Each application will forward a state variable called "inputValues" to the
// succeeding loader, which gets populated as "values" in the preceding one.
//
// For example, for a request like this "b!a!./foo.js"
//
//     // a-loader.js
//     module.exports = function(code) {
//       this.values = { foo: 'bar' };
//
//       return code;
//     };
//
//     // b-loader.js
//     module.exports = function(code) {
//       console.log(this.inputValues); // { foo: "bar" };
//
//       return code;
//     };
//
// @param {Array.<Object>} dataMap
//        Data generated during the pitching phase. This set is expected to be
//        fully populated (even if each item is an empty object) and be ordered
//        after the loaders in the @loaders array.
//
function NormalLoaderApplier(loaders, dataMap, done) {
  return function apply(cursor, sourceCode, sourceMap, inputValues) {
    var loader = loaders[cursor];
    var context;

    if (!loader) {
      return done(null, sourceCode, sourceMap);
    }

    context = loader.context;
    context.data = dataMap[cursor];
    context.inputValues = inputValues || {};

    var fn = loader.module.__esModule === true ?
      loader.module.default :
      loader.module
    ;

    applySyncOrAsync(fn, context, [ sourceCode, sourceMap ],
      function(err, nextSource, nextSourceMap) {
        if (err) {
          return done(err);
        }

        apply(cursor - 1, nextSource, nextSourceMap, context.values);
      }
    );
  };
}

// Utility function for applying a function and accepting a result in one of
// three ways:
//
// - a synchronous return, where only one value may be yielded
// - a multi-value yield using a generated `this.callback(...)` callback
// - a multi-value yield that is also asynchronous using `callback = this.async();`
//
// @done will always be called with {String|Error, ...} for an error and the
// yielded values.
//
// Example victims:
//
// 1. Synchronous, single-yield:
//
//     function() {
//       return 'hello!';
//     }
//
// 2. Synchronous, multi-yield:
//
//     function() {
//       this.callback(null, 'hello', 'world!');
//     }
//
// 3. Asynchronous, single-yield:
//
//     function() {
//       var callback = this.async();
//
//       setTimeout(function() {
//         callback(null, 'hello');
//       }, 1000);
//     }
//
// 4. Asynchronous, multi-yield:
//
//     function() {
//       var callback = this.async();
//
//       setTimeout(function() {
//         callback(null, 'hello', 'world!');
//       }, 1000);
//     }
function applySyncOrAsync(fn, context, args, done) {
  var expectSynchronousResponse = true;

  // sync/async this.callback() style
  context.callback = fnOncePedantic(function() {
    expectSynchronousResponse = false;

    return done.apply(null, arguments);
  }, "this.callback(): The callback was already called.");

  context.async = fnOncePedantic(function() {
    expectSynchronousResponse = false;

    return done;
  }, "this.async(): The callback was already called.");

  try {
    // synchronus return style
    var result = fn.apply(context, args);

    if (expectSynchronousResponse) {
      if (result) {
        done(null, result);
      }
      else {
        done();
      }
    }
  }
  catch(e) { // abort the chain
    done(e);
  }
}
