var assert = require('assert');
var ErrorSerializer = require('./ErrorSerializer');
var activeLoaders = {};
var activeCompiler = null;
var activeCompilation = null;

var HappyRPCHandler = exports;

HappyRPCHandler.registerActiveCompiler = function(compiler) {
  activeCompiler = compiler;
};


HappyRPCHandler.registerActiveCompilation = function(compilation) {
  activeCompilation = compilation;
};

HappyRPCHandler.registerActiveLoader = function(id, instance) {
  activeLoaders[id] = instance;
};

HappyRPCHandler.unregisterActiveLoader = function(id) {
  delete activeLoaders[id];
};

HappyRPCHandler.execute = function(type, payload, done) {
  var loader;

  if (type === 'resolve') {
    assertCompilerIsActive();

    activeCompiler.resolvers.normal.resolve(payload.context, payload.resource, done);
  }
  else if (type === 'compilation:addError') {
    assertCompilerIsActive();
    activeCompilation.errors.push(ErrorSerializer.deserialize(payload.error));
  }
  else if (type === 'compilation:purgeErrors') {
    assertCompilerIsActive();
    activeCompilation.errors = activeCompilation.errors.filter(function(error) {
      if (!error) return false;

      var matches = Object.keys(payload.matcher).some(function(key) {
        return error[key] === payload.matcher[key];
      });

      if (matches) {
        console.warn('Dropping error:', error);
        return false;
      }

      return true;
    });
  }
  else if (type === 'compilation:addModuleError') {
    assertCompilerIsActive();
    activeCompilation.modules.some(function(module) {
      if (module.id === payload.moduleId) {
        var error = ErrorSerializer.deserialize(payload.error);
        error.module = module;
        module.errors.push(error);

        return true;
      }
    });
  }
  else if (type === 'compilation:purgeModuleErrors') {
    assertCompilerIsActive();
    activeCompilation.modules.some(function(module) {
      if (module.id === payload.moduleId) {
        module.errors.push(ErrorSerializer.deserialize(payload.error));
        module.errors = module.errors.filter(function(error) {
          return error && !Object.keys(payload.matcher).some(function(key) {
            return error[key] === payload.matcher[key];
          });
        });

        return true;
      }
    });
  }
  else if (type === 'compilation:addFileDependency') {
    assertCompilerIsActive();

    [].concat(payload.files).forEach(function(file) {
      if (payload.options.unique && activeCompilation.fileDependencies.indexOf(file) > -1) {
        return;
      }

      activeCompilation.fileDependencies.push(file);
    });
  }
  else if (type === 'compilation:addAsset') {
    assertCompilerIsActive();

    activeCompilation.assets[payload.assetPath] = {
      source: function() { return payload.source; },
      size: function() { return payload.size; }
    };
  }
  else { // a loader RPC:
    assertLoaderIsActive(payload.remoteLoaderId);
    loader = activeLoaders[payload.remoteLoaderId];

    if (type === 'emitWarning') {
      loader.emitWarning(ErrorSerializer.deserialize(payload.error));
    }
    else if (type === 'emitError') {
      loader.emitError(ErrorSerializer.deserialize(payload.error));
    }
    else if (type === 'emitModuleError') {
      var error = ErrorSerializer.deserialize(payload.error);
      error.module = loader._module;
      loader._module.errors.push(error);
    }
    else if (type === 'emitFile') {
      loader.emitFile(payload.name, payload.contents, JSON.parse(payload.sourceMap));
    }
    else if (type === 'addDependency') {
      loader.addDependency(payload.file);
    }
    else if (type === 'addContextDependency') {
      loader.addContextDependency(payload.file);
    }
    else if (type === 'clearDependencies') {
      loader.clearDependencies();
    }
    else if (type === 'writeModuleMetaAttribute') {
      loader._module.meta[payload.key] = payload.value;
    }
    else {
      assert(false, "Unrecognized RPC '" + type + '"');
    }

  }
};

function assertCompilerIsActive() {
  assert(!!activeCompiler,
    "A compiler RPC was dispatched, but no compiler instance was registered!"
  );
}

function assertLoaderIsActive(id) {
  assert(activeLoaders.hasOwnProperty(id),
    "A loader RPC was dispatched to HappyLoader[" + id + "] but no such loader is active!"
  );
}

module.exports = HappyRPCHandler;
