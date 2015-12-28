function JSONStream(inputFd, outputFd) {
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
        callback(payload.messages);
      });
    }
  }
}

module.exports = JSONStream;

function parseMessages(buffer) {
  var lines = buffer.split('\n');
  var messages = lines.map(trim).filter(notEmpty).map(deserialize);

  return {
    trailing: lines.filter(function(_, index) {
      return messages[index] === null;
    }).join('\n'),

    messages: messages.filter(truthy)
  };
}

function trim(string) {
  return string.trim();
}

function notEmpty(string) {
  return string.length > 0;
}

function serialize(payload) {
  return JSON.stringify(payload) + '\n';
}

function deserialize(string) {
  try {
    return JSON.parse(string);
  }
  catch (e) {
    return null;
  }
}

function truthy(x) {
  return !!x;
}