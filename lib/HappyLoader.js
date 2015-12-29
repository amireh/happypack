var path = require('path');
var fs = require('fs');
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

  if (this.happy.isAcceptingSyncRequests()) {
    return compileInForeground.call(this, source, map, filePath);
  }
  else {
    return compileInBackground.call(this, filePath);
  }
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

function compileInBackground(filePath) {
  var done = this.async();
  var that = this;

  this.happy.compile(filePath, function(err, compiledFilePath) {
    if (err) {
      that.emitError(err);

      return done(err);
    }

    fs.readFile(compiledFilePath, 'utf-8', done);
  });
}

function compileInForeground(source, map, filePath) {
  var done = this.async();

  this.happy.compileInForeground(source, map, filePath, done);
}
