var assert = require('@happypack/test-utils').assert;
var ErrorSerializer = require('../ErrorSerializer');
var serialize = ErrorSerializer.serialize;
var deserialize = ErrorSerializer.deserialize;

describe('ErrorSerializer', function () {

  context('serializes error objects', function () {
    it('plain strings', function () {
      var errorString = 'My error message';
      var serializedError = serialize(errorString);

      assert.equal(serializedError, errorString);
    });

    it('basic errors', function () {
      var originalError = new Error('My error message');

      var serializedError = serialize(originalError);
      assert.isString(serializedError);

      var deserializedError = JSON.parse(serializedError);

      assert.equal(deserializedError.message, originalError.message);
      assert.equal(deserializedError.stack, originalError.stack);
    });

    it('errors with custom properties', function () {
      var originalError = new Error('My error message');
      originalError.file = 'test.js';

      var serializedError = serialize(originalError);
      assert.isString(serializedError);

      var deserializedError = JSON.parse(serializedError);

      assert.equal(deserializedError.message, originalError.message);
      assert.equal(deserializedError.stack, originalError.stack);
      assert.equal(deserializedError.file, originalError.file);
    });
  });

  context('deserializes error objects', function () {
    it('plain strings', function () {
      var errorString = 'My error message';
      var deserializedError = deserialize(errorString);

      assert.equal(deserializedError, errorString);
    });

    it('basic errors', function () {
      var originalError = new Error('My error message');

      var errorString = JSON.stringify({
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack
      });

      var deserializedError = deserialize(errorString);

      assert.instanceOf(deserializedError, Error);
      assert.equal(deserializedError.name, originalError.name);
      assert.equal(deserializedError.message, originalError.message);
      assert.equal(deserializedError.stack, originalError.stack);
      assert.equal(deserializedError.toString(), originalError.toString());
    });

    it('errors with custom properties', function () {
      var originalError = new Error('My error message');
      originalError.file = 'test.js';

      var errorString = JSON.stringify({
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack,
        file: originalError.file
      });

      var deserializedError = deserialize(errorString);

      assert.instanceOf(deserializedError, Error);
      assert.equal(deserializedError.name, originalError.name);
      assert.equal(deserializedError.message, originalError.message);
      assert.equal(deserializedError.stack, originalError.stack);
      assert.equal(deserializedError.file, originalError.file);
      assert.equal(deserializedError.toString(), originalError.toString());
    });
  });
});