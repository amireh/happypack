var assert = require('@happypack/test-utils').assert;
var Subject = require('../OptionParser');

describe("OptionParser", function() {
  it('throws on unrecognized parameters', function() {
    assert.throws(function() {
      Subject({ foo: 'hihi' }, {});
    }, "Unrecognized option 'foo'");
  });

  it('throws on missing required parameters', function() {
    assert.throws(function() {
      Subject({}, { foo: { isRequired: true }});
    }, "Missing required parameter 'foo'");
  });

  it('throws on invalid types', function() {
    assert.throws(function() {
      Subject({ foo: 'hihi' }, { foo: { type: 'boolean' } });
    }, "Option 'foo' must be of type 'boolean' not 'string'.");
  });

  context('given a default value', function() {
    it('uses it if the parameter is undefined', function() {
      assert.equal(Subject({}, { foo: { default: 'hihi' } }).foo, 'hihi');
    });

    it('uses it if the parameter is null', function() {
      assert.equal(Subject({ foo: null }, { foo: { default: 'hihi' } }).foo, 'hihi');
    });

    it('does not use it if the parameter is false', function() {
      assert.equal(Subject({ foo: false }, { foo: { default: 'hihi' } }).foo, false);
    });
  });
});