exports.debug = function() {
  if (process.env.HAPPY_DEBUG) {
    console.debug.apply(console, arguments);
  }
};