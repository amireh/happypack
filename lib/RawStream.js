var RE_CAPTURE_LINES = Object.freeze(/([^\n]+)\n/mg);

function RawStream(onMessages) {
  var buf = '';

  return {
    read: function(chunk) {
      var payload = parseMessages(buf + chunk.toString());
      buf = payload.trailing;

      if (payload.messages.length) {
        onMessages(payload.messages);
      }
    },

    serialize: function(args) {
      return args.join(RawStream.DELIMITER) + '\n';
    },

    deserialize: function(payload) {
      return payload.split(RawStream.DELIMITER);
    }
  };
}

RawStream.DELIMITER = '>';

module.exports = RawStream;

function parseMessages(buffer) {
  var messages = [];
  var trailing = buffer.replace(RE_CAPTURE_LINES, function(line) {
    messages.push(trim(line));
    return '';
  });

  return {
    trailing: trailing,
    messages: messages
  };
}

function trim(string) {
  return string.trim();
}
