var assert = require('assert');
var SourceMapSerializer = require('./SourceMapSerializer');
var ErrorSerializer = require('./ErrorSerializer');
var SharedPtrMap = require('./SharedPtrMap');
var COMPILER_RPCs, LOADER_RPCS;
var DEFAULT_COMPILER_ID = require('./constants').DEFAULT_COMPILER_ID;
var DEFAULT_LOADER_ID = require('./constants').DEFAULT_LOADER_ID;

function HappyRPCHandler() {
  this.activeLoaders = new SharedPtrMap();
  this.activeCompilers = new SharedPtrMap();
}

HappyRPCHandler.prototype.registerActiveCompiler = function(id, compiler) {
  this.activeCompilers.set(id || DEFAULT_COMPILER_ID, compiler);
};

HappyRPCHandler.prototype.isActive = function() {
  return this.activeCompilers.getSize() > 0;
};

HappyRPCHandler.prototype.unregisterActiveCompiler = function(id) {
  this.activeCompilers.delete(id || DEFAULT_COMPILER_ID);
};

HappyRPCHandler.prototype.registerActiveLoader = function(id, instance) {
  this.activeLoaders.set(id || DEFAULT_LOADER_ID, instance);
};

HappyRPCHandler.prototype.unregisterActiveLoader = function(id) {
  this.activeLoaders.delete(id || DEFAULT_LOADER_ID);
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
    loader.emitWarning(ErrorSerializer.deserialize(payload.message));
  },

  emitError: function(loader, payload) {
    loader.emitError(ErrorSerializer.deserialize(payload.message));
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
