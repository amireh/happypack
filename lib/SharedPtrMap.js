var SharedPtr = require('./SharedPtr');

function SharedPtrMap() {
  this.map = {};
}

SharedPtrMap.prototype.set = function(key, value) {
  if (!this.map.hasOwnProperty(key)) {
    this.map[key] = new SharedPtr(value);
  }
  else {
    this.map[key].acquire();
  }
};

SharedPtrMap.prototype.get = function(key) {
  return SharedPtr.safeGet(this.map[key]);
};

SharedPtrMap.prototype.getSize = function() {
  return Object.keys(this.map).length;
};

SharedPtrMap.prototype.delete = function(key) {
  if (this.map[key]) {
    this.map[key].release();

    if (this.map[key].isDead()) {
      delete this.map[key];
    }
  }
};

module.exports = SharedPtrMap;