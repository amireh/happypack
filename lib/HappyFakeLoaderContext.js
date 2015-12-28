function HappyFakeLoaderContext(source, sourcePath) {
  if (!(this instanceof HappyFakeLoaderContext)) {
    return new HappyFakeLoaderContext(source, sourcePath);
  }

  this.resourcePath = sourcePath;
  this.request = sourcePath;
  this.data = {};
  this.loaders = [{}];
  this.loaderIndex = 0;
  this.options = {};
  this.query = '';

  return this;
}

// TODO
HappyFakeLoaderContext.prototype.cacheable = function() {
};

// TODO
HappyFakeLoaderContext.prototype.emitWarning = function() {
};

HappyFakeLoaderContext.prototype.emitError = function() {
};

HappyFakeLoaderContext.prototype.callback = function(err, source, map) {
  this.error = err;
  this.result = [ source, map ];
};

module.exports = HappyFakeLoaderContext;