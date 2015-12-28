var RE_CAPTURE_LINES = Object.freeze(/([^\n]+)\n/mg);

function RawStream(inputFd, outputFd) {
  var buf = '';
  var readCallbacks = [];

  return {
    accept: function() {
      inputFd.on('data', read);
    },

    write: function(args) {
      outputFd.write(serialize(args), 'utf-8');
    },

    on: function(event, callback) {
      if (event === 'data') {
        readCallbacks.push(callback);
      }
    }
  };

  function read(chunk) {
    var payload = parseMessages(buf + chunk.toString());

    buf = payload.trailing;

    if (payload.messages.length) {
      readCallbacks.forEach(function(callback) {
        callback(payload.messages.map(deserialize));
      });
    }
  }
}

RawStream.DELIMITER = '>';

module.exports = RawStream;

function serialize(args) {
  return args.join(RawStream.DELIMITER) + '\n';
}

function deserialize(payload) {
  return payload.split(RawStream.DELIMITER);
}

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
