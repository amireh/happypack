var ErrorSerializer = require('./ErrorSerializer');
var resolveSyncNotSupported = NotSupported('this.resolveSync()');
var execNotSupported = NotSupported('this.exec()');

function HappyFakeLoaderContext(initialValues) {
  var loader = {};

  // for compiler RPCs, like this.resolve()
  loader._compiler = null;

  // for loader RPCs, like this.emitWarning()
  loader._remoteLoaderId = null;

  loader.version = 1; // https://webpack.github.io/docs/loaders.html#version
  loader.webpack = false;
  loader.request = null;
  loader.query = null;

  loader.context = null;
  loader.resource = null;
  loader.resourcePath = null;
  loader.resourceQuery = null;

  loader.data = {};
  loader.loaders = [{}];
  loader.loaderIndex = 0;

  loader.options = null; // TODO: we should read this from compiler options
  loader.result = null;

  loader.sourceMap = false;
  loader.fs = null;
  loader.target = 'web';
  loader.minimize = undefined; // keep it as undefined by default just like without happypack, to make sure there is no accident...

  // TODO
  loader.cacheable = function() {};
  loader.callback = null; // will be defined at runtime
  loader.async = null; // will be defined at runtime

  loader.exec = execNotSupported;

  loader.emitWarning = function(message) {
    loader._compiler._sendMessage('emitWarning', {
      remoteLoaderId: loader._remoteLoaderId,
      message: ErrorSerializer.serialize(message)
    });
  };

  loader.emitError = function(message) {
    loader._compiler._sendMessage('emitError', {
      remoteLoaderId: loader._remoteLoaderId,
      message: ErrorSerializer.serialize(message)
    });
  };

  loader.resolve = function(context, resource, done) {
    loader._compiler.resolve(context, resource, done);
  };

  loader.resolveSync = resolveSyncNotSupported;

  loader.addDependency = function(file) {
    loader._compiler._sendMessage('addDependency', {
      remoteLoaderId: loader._remoteLoaderId,
      file: file
    });
  };

  loader.addContextDependency = function(file) {
    loader._compiler._sendMessage('addContextDependency', {
      remoteLoaderId: loader._remoteLoaderId,
      file: file
    });
  };

  loader.clearDependencies = function() {
    loader._compiler._sendMessage('clearDependencies', {
      remoteLoaderId: loader._remoteLoaderId
    });
  };

  loader.getDependencies = function() {
    return initialValues._dependencies;
  };

  loader.getContextDependencies = function() {
    return initialValues._contextDependencies;
  };

  loader.emitFile = function(name, contents, sourceMap) {
    loader._compiler._sendMessage('emitFile', {
      remoteLoaderId: loader._remoteLoaderId,
      name: name,
      contents: contents,
      sourceMap: JSON.stringify(sourceMap || {})
    });
  };

  loader.loadModule = function(resource, done) {
    loader._compiler._sendMessage('loadModule', {
      remoteLoaderId: loader._remoteLoaderId,
      file: resource,
    }, done);
  };

  // alias
  loader.dependency = loader.addDependency;

  Object.keys(initialValues || {}).forEach(function(key) {
    loader[key] = initialValues[key];
  });

  return loader;
}

function NotSupported(fnName) {
  return function() {
    throw new Error('HappyPack: ' + fnName + ' is not supported for happy loaders.');
  };
}
module.exports = HappyFakeLoaderContext;
