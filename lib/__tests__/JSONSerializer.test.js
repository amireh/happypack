const { serialize, deserialize } = require('../JSONSerializer');
const { assert } = require('chai');

describe('JSONSerializer', function() {
  describe('serializing RegExp objects', function() {
    it('retains patterns', function() {
      let subject = deserialize(serialize({ noParse: /\.js$/ }));

      assert.equal(true, subject.noParse.test('.js'));
    });

    it('retains flags', function() {
      let subject = deserialize(serialize({ noParse: /\.js$/i }));

      assert.equal(true, subject.noParse.test('.js'));
      assert.equal(true, subject.noParse.test('.JS'));
    });
  });
});