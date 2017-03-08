var assert = require('assert');
var loaderUtils = require('loader-utils');
var DEFAULT_COMPILER_ID = 'default';
var DEFAULT_LOADER_ID = '1';

function HappyLoader(sourceCode, sourceMap) {
  var query, compilerId, loaderId, remoteLoaderId, happyPlugin;
  var callback = this.async();
  var pluginList;

  assert(callback, "HappyPack only works when asynchronous loaders are allowed!");

  this.cacheable();

  if (Array.isArray(this.options.plugins)) {
    pluginList = this.options.plugins;
  }
  else if (typeof this.options.plugins === 'function') {
    pluginList = this.options.plugins();
  }
  else if (!this.options.plugins && this._compiler && this._compiler.options && this._compiler.options.plugins) {
    pluginList = this._compiler.options.plugins;
  }

  query = loaderUtils.parseQuery(this.query);
  compilerId = query.compilerId || DEFAULT_COMPILER_ID;
  loaderId = query.id || DEFAULT_LOADER_ID;
  remoteLoaderId = 'Loader::' + compilerId + loaderId.toString() + ':' + this.resource;

  assert(pluginList && Array.isArray(pluginList),
    "HappyPack: unable to locate the plugin list, this most likely indicates " +
    "an internal error!"
  );

  happyPlugin = pluginList.filter(isHappy(loaderId))[0];

  assert(!!happyPlugin,
    "HappyPack: plugin for the loader '" + loaderId + "' could not be found! " +
    "Did you forget to add it to the plugin list?"
  );

  happyPlugin.compile(this, {
    remoteLoaderId: remoteLoaderId,
    compilerId: compilerId,
    sourceCode: sourceCode,
    sourceMap: sourceMap,

    useSourceMap: this._module.useSourceMap,

    // TODO: maybe too much data being pushed down the drain here? we can infer
    // all of this from `this.request`
    context: this.context,
    request: happyPlugin.generateRequest(this.resource),
    resource: this.resource,
    resourcePath: this.resourcePath,
    resourceQuery: this.resourceQuery,
    target: this.target,
    minimize: this.minimize,
  }, callback);
}

module.exports = HappyLoader;

function isHappy(id) {
  return function(plugin) {
    return plugin.name === 'HappyPack' && plugin.id === id;
  };
}
