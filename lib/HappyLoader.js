var assert = require('assert');
var HappyCompilerRequestHandler = require('./HappyCompilerRequestHandler');

function HappyLoader(source, map) {
  var callback = this.async();
  var id = getId(this.query);
  var self = this;

  assert(callback, "HappyPack only works when asynchronous loaders are allowed!");

  this.cacheable();

  if (!this.happy) { // cache the plugin reference
    this.happy = this.options.plugins.filter(isHappy(id))[0];

    assert(this.happy,
      "You must define and use the HappyPack plugin to use its loader!"
    );
  }

  HappyCompilerRequestHandler.registerActiveLoader(id, this);

  this.happy.compile(source, map, {
    remoteLoaderId: id,
    context: this.context,
    resourcePath: this.resourcePath,
    loaders: this.loaders,
  }, function(err, code, map) {
    HappyCompilerRequestHandler.unregisterActiveLoader(id);

    if (err) {
      return callback(new Error(err));
    }

    callback(null, code, map);
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
