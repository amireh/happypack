module.exports = function assertNoWebpackErrors(err, rawStats, done) {
  if (err) {
    done(err);
    return true;
  }

  var stats = rawStats.toJson();

  if (stats.errors.length) {
    done(stats.errors);
    return true;
  }

  if (stats.warnings.length) {
    done(stats.warnings);
    return true;
  }
};
