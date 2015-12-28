var HappyFakeLoaderContext = require('./HappyFakeLoaderContext');

module.exports = function applyLoadersWaterfall(loaders, source, sourcePath, done) {
  var cursor = 0;
  var result = { code: source, map: null };

  function apply() {
    var loader = loaders[cursor++];

    if (!loader) {
      return done(null, result);
    }
    var context = new HappyFakeLoaderContext(source, sourcePath);
    var transform = require(loader.path);
    var code;

    // sync/async this.callback() style
    context.callback = acceptResultAndApplyNext;
    context.query = loader.query;

    try {
      // synchronus return style
      code = transform.call(context, result.code, result.map);
    }
    catch(e) { // abort the chain
      return done(e);
    }

    if (code) {
      context.callback(null, code, null);
    }
  }

  function acceptResultAndApplyNext(err, code, map) {
    if (err) {
      return done(err);
    }

    result.code = code;
    result.map = map;

    apply();
  }

  apply();
}