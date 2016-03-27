function HappyCompilerRequestHandler(compiler) {
  return function(type, payload, done) {
    if (type === 'resolve') {
      compiler.resolvers.normal.resolve(payload.context, payload.resource, done);
    }
  };
}

module.exports = HappyCompilerRequestHandler;