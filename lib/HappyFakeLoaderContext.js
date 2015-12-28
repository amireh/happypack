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
  this.result = null;

  return this;
}

// TODO
HappyFakeLoaderContext.prototype.cacheable = function() {
};

HappyFakeLoaderContext.prototype.async = function() {
  this._async = true;
};

// TODO
HappyFakeLoaderContext.prototype.emitWarning = function() {
};

HappyFakeLoaderContext.prototype.emitError = function() {
};

module.exports = HappyFakeLoaderContext;