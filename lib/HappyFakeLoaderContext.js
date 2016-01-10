function HappyFakeLoaderContext(source, sourcePath, query, options) {
  if (!(this instanceof HappyFakeLoaderContext)) {
    return new HappyFakeLoaderContext(source, sourcePath);
  }

  this.resource = sourcePath;
  this.resourcePath = sourcePath;
  this.request = sourcePath;
  this.data = {};
  this.loaders = [{}];
  this.loaderIndex = 0;
  this.options = options;
  this.query = query || '';
  this.result = null;

  return this;
}

// TODO
HappyFakeLoaderContext.prototype.cacheable = function() {
};

HappyFakeLoaderContext.prototype.async = function() {
  this._async = true;

  return this.callback.bind(this);
};

// TODO
HappyFakeLoaderContext.prototype.emitWarning = function() {
};

HappyFakeLoaderContext.prototype.emitError = function() {
};

HappyFakeLoaderContext.prototype.resolve = function(context, resource, done) {
  this._compiler.resolve(context, resource, done);
};

module.exports = HappyFakeLoaderContext;