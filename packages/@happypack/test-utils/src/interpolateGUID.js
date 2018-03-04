var gid = 0;

// courtesy of http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function interpolateGUID(string) {
  return string
    .replace(/\[guid\]/g, function() {
      return guid();
    }).replace(/\[gid\]/g, function() {
      return ++gid;
    })
  ;
}

module.exports = interpolateGUID;