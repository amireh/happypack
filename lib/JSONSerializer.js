/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

// Adapted from https://github.com/yahoo/serialize-javascript so that it is
// deserializable as well and doesn't care about functions.

var isRegExp = require('util').isRegExp;
var stringify = require('json-stringify-safe');

var PLACE_HOLDER_REGEXP = new RegExp('"@__(REGEXP){(\\d+)}@"', 'g');

var UNSAFE_CHARS_REGEXP = /[<>\/\u2028\u2029]/g;

// Mapping of unsafe HTML and invalid JavaScript line terminator chars to their
// Unicode char counterparts which are safe to use in JavaScript strings.
var UNICODE_CHARS = {
  '<'     : '\\u003C',
  '>'     : '\\u003E',
  '/'     : '\\u002F',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029'
};

exports.serialize = function(obj) {
  var regexps   = [];
  var str;

  // Creates a JSON string representation of the object and uses placeholders
  // for functions and regexps (identified by index) which are later
  // replaced.
  str = stringify(obj, function(key, value) {
    if (typeof value === 'object' && isRegExp(value)) {
      return '@__REGEXP{' + (regexps.push(value) - 1) + '}@';
    }

    return value;
  }, 0, Function.prototype /* prune circular refs */);

  // Protects against `JSON.stringify()` returning `undefined`, by serializing
  // to the literal string: "undefined".
  if (typeof str !== 'string') {
    return String(str);
  }

  // Replace unsafe HTML and invalid JavaScript line terminator chars with
  // their safe Unicode char counterpart. This _must_ happen before the
  // regexps and functions are serialized and added back to the string.
  str = str.replace(UNSAFE_CHARS_REGEXP, function (unsafeChar) {
    return UNICODE_CHARS[unsafeChar];
  });

  if (regexps.length === 0) {
    return str;
  }

  // Replaces all occurrences of function and regexp placeholders in the JSON
  // string with their string representations. If the original value can not
  // be found, then `undefined` is used.
  return str.replace(PLACE_HOLDER_REGEXP, function (match, type, valueIndex) {
    return JSON.stringify(serializeRegExp(regexps[valueIndex]));
  }, 0, function() {});
}

exports.deserialize = function(string) {
  return JSON.parse(string, function(key, value) {
    if (Array.isArray(value) && value.length === 3 && value[0] === '@__REGEXP') {
      return new RegExp(value[1], value[2]);
    }

    return value;
  });
};

function serializeRegExp(regex) {
  var flags = '';

  if (regex.global) flags += 'g';
  if (regex.ignoreCase) flags += 'i';
  if (regex.multiline) flags += 'm';
  if (regex.sticky) flags += 'y';
  if (regex.unicode) flags += 'u';

  return ['@__REGEXP', regex.source, flags];
}