var path = require('path');
var assert = require('assert');

function HappyLoader(source, map) {
  this.cacheable();

  if (!this.happy) { // cache the plugin reference
    this.happy = this.options.plugins.filter(isHappy(getId(this.query)))[0];

    assert(this.happy,
      "You must define and use the HappyPack plugin to use its loader!"
    );
  }

  var filePath = path.resolve(this.resourcePath);
  var done = this.async();

  if (map) {
    console.log('HappyLoader: source map:', map)
  }

  this.happy.compile(source, map, filePath, done);
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
