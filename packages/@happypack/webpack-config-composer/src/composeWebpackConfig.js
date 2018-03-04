var get = require('lodash').get;
var set = require('lodash').set;
var assign = require('lodash').assign;
var invariant = require('invariant');
var identity = function(x) { return x };
var VERSION_ANY = '*';
var VERSION_1 = /^1/;
var VERSION_2 = /^2/;
var VERSION_3 = /^3/;
var VERSION_4 = /^4/;
var composers = {
  '*': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return assign({}, config, directive[1]);
      }
    }
  ],

  'entry': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return assign({}, config, {
          entry: directive[1]
        });
      }
    }
  ],

  'output': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return assign({}, config, {
          output: assign({}, config.output, directive[1])
        });
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
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
      composeFn: function(config, directive) {
        var loaders = [].concat(get(config, 'module.rules') || []);
        var loader = assign({}, directive[1]);

        if (loader.hasOwnProperty('loader')) {
          loader.use = loader.loader;
          delete loader.loader;
        }

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
          module: assign({}, config.module, {
            preLoaders: baseValue.concat(directive[1])
          })
        })
      }
    },

    {
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
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

  'module.postLoader': [
    {
      versions: [ VERSION_1 ],
      composeFn: function(config, directive) {
        var baseValue = [].concat(get(config, 'module.postLoaders') || []);

        return assign({}, config, {
          module: assign({}, config.module, {
            postLoaders: baseValue.concat(directive[1])
          })
        })
      }
    },

    {
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
      composeFn: function(config, directive) {
        var baseValue = [].concat(get(config, 'module.rules') || []);

        return assign({}, config, {
          module: assign({}, get(config, 'module'), {
            rules: baseValue.concat(
              assign({}, directive[1], {
                enforce: 'post'
              })
            )
          })
        })
      }
    }
  ],

  'resolve.extensions::addEmpty': [
    {
      versions: [ VERSION_1 ],
      composeFn: function(config) {
        return assign({}, config, {
          resolve: assign({}, config.resolve, {
            extensions: [''].concat(config.resolve.extensions || [])
          })
        })
      }
    },

    {
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
      composeFn: identity
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
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
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
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
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
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
      composeFn: function(config) {
        var resolveLoader = get(config, 'resolveLoader') || {};

        return set(config, 'resolveLoader', assign({}, resolveLoader, {
          moduleExtensions: [ '-loader' ]
        }))
      }
    }
  ],

  'resolveLoader.moduleExtensions': [
    {
      versions: [ VERSION_1 ],
      composeFn: identity,
    },
    {
      versions: [ VERSION_2, VERSION_3, VERSION_4 ],
      composeFn: function(config, directive) {
        var resolveLoader = get(config, 'resolveLoader') || {};
        var moduleExtensions = get(resolveLoader, 'moduleExtensions') || [];

        return set(config, 'resolveLoader', assign({}, resolveLoader, {
          moduleExtensions: [].concat(moduleExtensions).concat(directive[1])
        }))
      }
    }
  ],

  'mode': [
    {
      versions: [ VERSION_4 ],
      composeFn: function(config, directive) {
        return set(config, 'mode', directive[1])
      }
    },
    {
      versions: [ VERSION_1, VERSION_2, VERSION_3 ],
      composeFn: function(config, directive) {
        return config
      }
    }
  ],

  'devtool': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return set(config, 'devtool', directive[1])
      }
    }
  ],
  'plugin': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return set(config, 'plugins', [].concat(config.plugins || []).concat(directive[1]))
      }
    }
  ],
  'context': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return set(config, 'context', directive[1])
      }
    }
  ],
  'bail': [
    {
      versions: [ VERSION_ANY ],
      composeFn: function(config, directive) {
        return set(config, 'bail', !!directive[1])
      }
    }
  ],
}

composers['module.loader'] = composers['loader']

module.exports = function composeWebpackConfig(webpackVersion) {
  return function(directives) {
    return directives.reduce(composeDirective(webpackVersion), {});
  }
}

function versionMatches(webpackVersion) {
  return function(versionString) {
    if (versionString === VERSION_ANY) {
      return true;
    }

    return webpackVersion.match(versionString);
  }
}

function composeDirective(webpackVersion) {
  return function(config, directive) {
    invariant(composers.hasOwnProperty(directive[0]),
      "Don't know how to compose directive '" + directive[0] + "'"
    );

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
}