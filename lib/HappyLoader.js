var path = require('path');
var assert = require('assert');

function HappyLoader(source, map) {
  var callback = this.async();

  assert(callback, "HappyPack only works when asynchronous loaders are allowed!");

  this.cacheable();

  if (!this.happy) { // cache the plugin reference
    this.happy = this.options.plugins.filter(isHappy(getId(this.query)))[0];

    assert(this.happy,
      "You must define and use the HappyPack plugin to use its loader!"
    );
  }

  this.happy.compile(source, map, {
    context: this.context,
    resourcePath: this.resourcePath,
    loaders: this.loaders,
  }, callback);
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
