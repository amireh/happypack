var assign = require('lodash').assign;
var set = require('lodash').set;
var flow = require('lodash').flow;
var get = require('lodash').get;
var omit = require('lodash').omit;
var curry = require('lodash').curry;
var composeWebpackConfig = require('./composeWebpackConfig');
var applyTo = curry(function(key, f) {
  return function(x) {
    if (!get(x.config, key)) {
      return x;
    }
    else {
      return f(x);
    }
  }
})

var isEmpty = function(x) {
  return !x || x.length === 0;
}

var convert = flow(
  createState,

  applyTo('module.loaders', function(state) {
    return {
      config: state.config,
      directives: state.directives.concat([
        [ 'resolveLoader.moduleExtensions', '-loader' ]
      ])
    }
  }),

  applyTo('module.loaders', function(state) {
    return {
      config: assign({}, state.config, {
        module: omit(state.config.module, [ 'loaders' ]),
      }),

      directives: state.directives.concat(
        []
          .concat(get(state.config, 'module.loaders') || [])
          .map(function(loader) {
            return [ 'module.loader', loader ]
          })
      )
    }
  }),

  applyTo('resolve.root', function(state) {
    return {
      config: assign({}, state.config, {
        resolve: omit(state.config.resolve, [ 'root' ])
      }),

      directives: state.directives.concat([
        [ 'resolvePath', state.config.resolve.root ]
      ])
    }
  }),

  applyTo('resolve.fallback', function(state) {
    return {
      config: assign({}, state.config, {
        resolve: omit(state.config.resolve, [ 'fallback' ])
      }),

      directives: state.directives.concat([
        [ 'resolvePath', state.config.resolve.fallback ]
      ])
    }
  }),

  applyTo('resolve.extensions', function(state) {
    var extensions = state.config.resolve.extensions;

    if (!extensions.some(isEmpty)) {
      return state;
    }

    return {
      config: assign({}, state.config, {
        resolve: assign({}, state.config.resolve, {
          extensions: state.config.resolve.extensions.filter(function(x) {
            return !isEmpty(x);
          })
        }),
      }),

      directives: state.directives.concat([
        [ 'resolve.extensions::addEmpty' ]
      ])
    }
  }),

  applyTo('resolve.modulesDirectories', function(state) {
    var asList = [].concat(state.config.resolve.modulesDirectories);

    return {
      config: assign({}, state.config, {
        resolve: omit(state.config.resolve, [ 'modulesDirectories' ])
      }),

      directives: state.directives.concat(
        asList.map(function(path) {
          return [ 'resolvePath', path ]
        })
      )
    }
  }),

  applyTo('module.preLoaders', function(state) {
    var asList = [].concat(state.config.module.preLoaders);

    return {
      config: assign({}, state.config, {
        module: omit(state.config.module, [ 'preLoaders' ])
      }),

      directives: state.directives.concat(
        asList.map(function(loader) {
          return [ 'module.preLoader', loader ]
        })
      )
    }
  }),

  applyTo('module.postLoaders', function(state) {
    var asList = [].concat(state.config.module.postLoaders);

    return {
      config: assign({}, state.config, {
        module: omit(state.config.module, [ 'postLoaders' ])
      }),

      directives: state.directives.concat(
        asList.map(function(loader) {
          return [ 'module.postLoader', loader ]
        })
      )
    }
  })
)

module.exports = function fromWebpack1(targetVersion, baseConfig) {
  var state = convert(baseConfig)
  var withCompatibleConfig = [[ '*', state.config ]].concat(state.directives)

  return composeWebpackConfig(targetVersion)(withCompatibleConfig);
}

module.exports.convert = convert;

function createState(x) {
  return {
    config: assign({}, x),
    directives: []
  }
}
