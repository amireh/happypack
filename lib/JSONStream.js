function JSONStream(onMessages) {
  var buf = '';

  return {
    read: function(chunk) {
      var payload = parseMessages(buf + chunk.toString());
      buf = payload.trailing;

      if (payload.messages.length) {
        onMessages(payload.messages);
      }
    },

    serialize: function(payload) {
      return JSON.stringify(payload) + '\n';
    }
  };
}

module.exports = JSONStream;

function parseMessages(buffer) {
  var lines = buffer.split('\n');
  var messages = lines.map(trim).filter(nonEmpty).map(parseJSON);

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

function nonEmpty(string) {
  return string.length > 0;
}

function parseJSON(string) {
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