exports.debug = function() {
  if (process.env.HAPPY_DEBUG) {
    console.log.apply(console, arguments);
  }
};