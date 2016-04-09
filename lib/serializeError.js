module.exports = function(error) {
  var buf = [];

  if (error.hasOwnProperty('message')) {
    buf.push(error.message);
  }

  if (error.hasOwnProperty('stack')) {
    buf.push(error.stack);
  }

  if (!buf.length) {
    buf.push(JSON.stringify(error));
  }

  return buf.join('\n');
};