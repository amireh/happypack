var assert = require('assert');

function SharedPtr(value) {
  this._refs = 1;
  this._value = value;
}

SharedPtr.prototype.acquire = function() {
  assert(this.hasOwnProperty('_value'), "Invalid attempt to acquire a dangling pointer!");

  this._refs += 1;
};

SharedPtr.prototype.release = function() {
  this._refs -= 1;

  assert(this._refs >= 0,
    "Potential race condition or memory leak; shared pointer reference count " +
    "has gone below zero! (" + this._refs + ")"
  );

  if (this._refs === 0) {
    delete this._value;
  }
};

SharedPtr.prototype.get = function() {
  return this._value;
};

SharedPtr.prototype.isDead = function() {
  return this._refs === 0;
};

SharedPtr.safeGet = function(ptr) {
  return ptr && ptr.get() || null;
};

module.exports = SharedPtr;
