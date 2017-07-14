var getWebpackVersion = require('./getWebpackVersion');
var get = require('lodash').get;
var set = require('lodash').set;
var assign = require('lodash').assign;
var invariant = require('invariant');
var identity = function(x) { return x };
var VERSION_ANY = '*';
var VERSION_1 = /^1/;
var VERSION_2 = /^2/;
var VERSION_3 = /^3/;
var composers = {
  '*': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return assign({}, config, directive[1]);
      }
    }
  ],

  'loader': [
    {
      versions: [ VERSION_1 ],
      composeFn: function(config, directive) {
        var loaders = [].concat(get(config, 'module.loaders') || []);

        return set(config, 'module.loaders', loaders.concat(directive[1]));
      }
    },

    {
      versions: [ VERSION_2, VERSION_3 ],
      composeFn: function(config, directive) {
        var loaders = [].concat(get(config, 'module.rules') || []);

        return set(config, 'module.rules', loaders.concat(directive[1]));
      }
    }
  ],

  'module.preLoader': [
    {
      versions: [ VERSION_1 ],
      composeFn: function(config, directive) {
        var baseValue = [].concat(get(config, 'module.preLoaders') || []);

        return assign({}, config, {
          module: assign({}, module, {
            preLoaders: baseValue.concat(directive[1])
          })
        })
      }
    },

    {
      versions: [ VERSION_2, VERSION_3 ],
      composeFn: function(config, directive) {
        var baseValue = [].concat(get(config, 'module.rules') || []);

        return assign({}, config, {
          module: assign({}, get(config, 'module'), {
            rules: baseValue.concat(
              assign({}, directive[1], {
                enforce: 'pre'
              })
            )
          })
        })
      }
    }
  ],

  'resolve.modulesDirectories': [
    {
      versions: [ VERSION_1 ],
      composeFn: function(config, directive) {
        var resolve = get(config, 'resolve');
        var baseValue = get(resolve, 'modulesDirectories') || [];

        return assign({}, config, {
          resolve: assign({}, resolve, {
            modulesDirectories: baseValue.concat(directive[1])
          })
        })
      }
    },
    {
      versions: [ VERSION_2, VERSION_3 ],
      composeFn: function(config, directive) {
        var resolve = get(config, 'resolve');
        var baseValue = get(resolve, 'modules') || [];

        return assign({}, config, {
          resolve: assign({}, resolve, {
            modules: baseValue.concat(directive[1])
          })
        })
      }
    }
  ],

  'resolveLoader': [
    {
      versions: [ VERSION_1 ],
      composeFn: function(config, directive) {
        return set(config, 'resolveLoader', directive[1]);
      }
    },
    {
      versions: [ VERSION_2, VERSION_3 ],
      composeFn: function(config, directive) {
        var paths = Object.keys(directive[1]).map(function(key) {
          return directive[1][key];
        });

        var modules = get(config, 'resolveLoader.modules') || [];

        return set(config, 'resolveLoader.modules', modules.concat(paths))
      }
    }
  ],

  'resolveLoaderExtension': [
    {
      versions: [ VERSION_1 ],
      composeFn: identity,
    },
    {
      versions: [ VERSION_2, VERSION_3 ],
      composeFn: function(config) {
        var resolveLoader = get(config, 'resolveLoader') || {};

        return set(config, 'resolveLoader', assign({}, resolveLoader, {
          moduleExtensions: [ '-loader' ]
        }))
      }
    }
  ]
}

composers['module.loader'] = composers['loader']

module.exports = function composeWebpackConfig(directives) {
  return directives.reduce(composeDirective, {});
}

function versionMatches(webpackVersion) {
  return function(versionString) {
    if (versionString === VERSION_ANY) {
      return true;
    }

    return webpackVersion.match(versionString);
  }
}

function composeDirective(config, directive) {
  invariant(composers.hasOwnProperty(directive[0]),
    "Don't know how to compose directive '" + directive[0] + "'"
  );

  var webpackVersion = getWebpackVersion();
  var composer = composers[directive[0]];
  var eligibleComposer = composer.filter(function(versionComposer) {
    return versionComposer.versions.some(versionMatches(webpackVersion))
  })[0];

  if (!eligibleComposer) {
    invariant(false,
      "Don't know how to compose directive '" + directive[0] +
      "' for webpack version '" + webpackVersion + "'"
    );
  }

  return eligibleComposer.composeFn(config, directive);
}