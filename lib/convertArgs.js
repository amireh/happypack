module.exports = function convertArgs(args, raw) {
  /* Not sure why buffer would convert to JSON */
  if (args[0].type === 'Buffer') {
    args[0] = Buffer.from(args[0].data);
  }

  if(!raw && Buffer.isBuffer(args[0])) {
    args[0] = utf8BufferToString(args[0]);
  }
  else if(raw && typeof args[0] === "string") {
    args[0] = new Buffer(args[0], "utf-8");
  }

  return args;
}

function utf8BufferToString(buf) {
  var str = buf.toString("utf-8");
  if(str.charCodeAt(0) === 0xFEFF) {
    return str.substr(1);
  } else {
    return str;
  }
}
