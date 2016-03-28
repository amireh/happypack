function HappyFakeLoaderContext() {
  if (!(this instanceof HappyFakeLoaderContext)) {
    return new HappyFakeLoaderContext();
  }

  // for compiler RPCs, like this.resolve()
  this._compiler = null;

  // for loader RPCs, like this.emitWarning()
  this._remoteLoaderId = null;

  this.version = 1; // -.-' https://webpack.github.io/docs/loaders.html#version
  this.request = null;
  this.query = null;

  this.context = null;
  this.resource = null;
  this.resourcePath = null;
  this.resourceQuery = null;

  this.data = {};
  this.loaders = [{}];
  this.loaderIndex = 0;

  this.options = null;
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

HappyFakeLoaderContext.prototype.exec = function() {
  throw new Error("loaderContext.exec is not supported");
};

HappyFakeLoaderContext.prototype.emitWarning = function(message) {
  this._compiler._sendMessage('emitWarning', {
    remoteLoaderId: this._remoteLoaderId,
    message: message
  });
};

HappyFakeLoaderContext.prototype.emitError = function(message) {
  this._compiler._sendMessage('emitError', {
    remoteLoaderId: this._remoteLoaderId,
    message: message
  });
};

HappyFakeLoaderContext.prototype.resolve = function(context, resource, done) {
  this._compiler.resolve(context, resource, done);
};

HappyFakeLoaderContext.prototype.addDependency = function(file) {
  this._compiler._sendMessage('addDependency', {
    remoteLoaderId: this._remoteLoaderId,
    file: file
  });
};

HappyFakeLoaderContext.prototype.addContextDependency = function(file) {
  this._compiler._sendMessage('addContextDependency', {
    remoteLoaderId: this._remoteLoaderId,
    file: file
  });
};

HappyFakeLoaderContext.prototype.clearDependencies = function() {
  this._compiler._sendMessage('clearDependencies', {
    remoteLoaderId: this._remoteLoaderId
  });
};

// alias
HappyFakeLoaderContext.prototype.dependency = function(file) {
  this.addDependency(file);
};

module.exports = HappyFakeLoaderContext;