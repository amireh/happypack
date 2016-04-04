exports.debug = function() {
  if (process.env.HAPPY_DEBUG) {
    console.log.apply(console, arguments);
  }
};

exports.info = function() {
  if (process.env.VERBOSE) {
    console.info.apply(console, arguments);
  }
};