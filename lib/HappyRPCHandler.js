var assert = require('assert');
var SourceMapSerializer = require('./SourceMapSerializer');
var SharedPtrMap = require('./SharedPtrMap');
var COMPILER_RPCs, LOADER_RPCS;

function HappyRPCHandler() {
  this.activeLoaders = new SharedPtrMap();
  this.activeCompilers = new SharedPtrMap();
}

HappyRPCHandler.prototype.registerActiveCompiler = function(id, compiler) {
  this.activeCompilers.set(id || 'default', compiler);
};

HappyRPCHandler.prototype.isActive = function() {
  return this.activeCompilers.getSize() > 0;
};

HappyRPCHandler.prototype.unregisterActiveCompiler = function(id) {
  this.activeCompilers.delete(id || 'default');
};

HappyRPCHandler.prototype.registerActiveLoader = function(id, instance) {
  this.activeLoaders.set(id || '1', instance);
};

HappyRPCHandler.prototype.unregisterActiveLoader = function(id) {
  this.activeLoaders.delete(id || '1');
};

HappyRPCHandler.prototype.execute = function(type, payload, done) {
  var compiler, loader;

  if (COMPILER_RPCs.hasOwnProperty(type)) {
    if (payload.compilerId) {
      compiler = this.activeCompilers.get(payload.compilerId);
    }
    else {
      compiler = this.activeCompilers.get('default');
    }

    assert(!!compiler,
      "A compiler RPC was dispatched, but no compiler instance was registered!"
    );

    COMPILER_RPCs[type](compiler, payload, done);
  }
  else if (LOADER_RPCS.hasOwnProperty(type)) {
    loader = this.activeLoaders.get(payload.remoteLoaderId);

    assert(!!loader,
      "A loader RPC was dispatched to HappyLoader[" + payload.remoteLoaderId +
      "] but no such loader is active!"
    );

    LOADER_RPCS[type](loader, payload, done);
  }
  else {
    assert(false, "Unrecognized loader RPC '" + type + '"');
  }
};

COMPILER_RPCs = {
  resolve: function(compiler, payload, done) {
    var resolver = compiler.resolvers.normal;
    var resolve = compiler.resolvers.normal.resolve;

    if (resolve.length === 4) {
      resolve.call(resolver, payload.context, payload.context, payload.resource, done);
    }
    else {
      resolve.call(resolver, payload.context, payload.resource, done);
    }
  },
};

LOADER_RPCS = {
  emitWarning: function(loader, payload) {
    loader.emitWarning(payload.message);
  },

  emitError: function(loader, payload) {
    loader.emitError(payload.message);
  },

  emitFile: function(loader, payload) {
    loader.emitFile(
      payload.name,
      payload.contents,
      SourceMapSerializer.deserialize(payload.sourceMap)
    );
  },

  addDependency: function(loader, payload) {
    loader.addDependency(payload.file);
  },

  addContextDependency: function(loader, payload) {
    loader.addContextDependency(payload.file);
  },

  clearDependencies: function(loader) {
    loader.clearDependencies();
  },

  loadModule: function(loader, payload, done) {
    loader.loadModule(payload.file, done);
  },
};


module.exports = HappyRPCHandler;
