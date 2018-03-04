var assert = require('@happypack/test-utils').assert;
var Subject = require('../JSONSerializer');
var serialize = Subject.serialize;
var deserialize = Subject.deserialize;

describe('JSONSerializer', function() {
  describe('serializing RegExp objects', function() {
    it('retains patterns', function() {
      var subject = deserialize(serialize({ noParse: /\.js$/ }));

      assert.equal(true, subject.noParse.test('.js'));
    });

    it('retains flags', function() {
      var subject = deserialize(serialize({ noParse: /\.js$/i }));

      assert.equal(true, subject.noParse.test('.js'));
      assert.equal(true, subject.noParse.test('.JS'));
    });
  });
});