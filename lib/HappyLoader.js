var assert = require('assert');
var HappyRPCHandler = require('./HappyRPCHandler');

function HappyLoader(sourceCode, sourceMap) {
  var callback = this.async();
  var id = getId(this.query);
  var remoteLoaderId = [ id, this.resource ].join(':');
  var happyPlugin;

  assert(callback, "HappyPack only works when asynchronous loaders are allowed!");

  this.cacheable();

  happyPlugin = this.options.plugins.filter(isHappy(id))[0];

  assert(!!happyPlugin,
    "HappyPack: plugin for the loader '" + id + "' could not be found! " +
    "Did you forget to add it to the plugin list?"
  );

  HappyRPCHandler.registerActiveLoader(remoteLoaderId, this);

  happyPlugin.compile({
    remoteLoaderId: remoteLoaderId,
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
  }, function(err, outSourceCode, outSourceMap) {
    HappyRPCHandler.unregisterActiveLoader(remoteLoaderId);

    if (err) {
      return callback(new Error(err));
    }

    callback(null, outSourceCode, outSourceMap);
  });
}

module.exports = HappyLoader;

function isHappy(id) {
  return function(plugin) {
    return plugin.name === 'HappyPack' && plugin.id === id;
  };
}

function getId(queryString) {
  return (queryString.match(/id=([^!]+)/) || [0,'1'])[1];
}
