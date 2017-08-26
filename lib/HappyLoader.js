var assert = require('assert');
var loaderUtils = require('loader-utils');
var DEFAULT_COMPILER_ID = require('./constants').DEFAULT_COMPILER_ID;
var DEFAULT_LOADER_ID = require('./constants').DEFAULT_LOADER_ID;

function HappyLoader(sourceCode, sourceMap) {
  var query, compilerId, loaderId, remoteLoaderId, happyPlugin;
  var callback = this.async();
  var pluginList = locatePluginList(this);

  assert(callback, "HappyPack only works when asynchronous loaders are allowed!");
  assert(pluginList && Array.isArray(pluginList),
    "HappyPack: unable to locate the plugin list, this most likely indicates " +
    "an internal error!"
  );

  this.cacheable();

  query = loaderUtils.getOptions(this) || {};
  compilerId = query.compilerId || DEFAULT_COMPILER_ID;
  loaderId = query.id || DEFAULT_LOADER_ID;
  remoteLoaderId = 'Loader::' + compilerId + loaderId.toString() + ':' + this.resource;

  happyPlugin = pluginList.filter(isHappy(loaderId))[0];

  assert(!!happyPlugin,
    "HappyPack: plugin for the loader '" + loaderId + "' could not be found! " +
    "Did you forget to add it to the plugin list?"
  );

  happyPlugin.compile(this, addWebpack2Context(this, {
    compilerId: compilerId,
    context: this.context,
    minimize: this.minimize,
    remoteLoaderId: remoteLoaderId,
    request: happyPlugin.generateRequest(this.resource),
    resource: this.resource,
    resourcePath: this.resourcePath,
    resourceQuery: this.resourceQuery,
    sourceCode: sourceCode,
    sourceMap: sourceMap,
    target: this.target,
    useSourceMap: this._module.useSourceMap,
  }), callback);
}

module.exports = HappyLoader;

function addWebpack2Context(loader, context) {
  if (typeof loader.getDependencies === 'function') {
    return Object.assign(context, {
      _dependencies: loader.getDependencies(),
      _contextDependencies: loader.getContextDependencies(),
    })
  }
  else {
    return context;
  }
}

function locatePluginList(loader) {
  if (Array.isArray(loader.options.plugins)) {
    return loader.options.plugins;
  }
  else if (typeof loader.options.plugins === 'function') {
    return loader.options.plugins();
  }
  else if (
    !loader.options.plugins &&
    loader._compiler &&
    loader._compiler.options &&
    loader._compiler.options.plugins
  ) {
    return loader._compiler.options.plugins;
  }
}

function isHappy(id) {
  return function(plugin) {
    return plugin.name === 'HappyPack' && plugin.id === id;
  };
}
