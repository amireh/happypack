const subject = require('../fromWebpack1').convert;
const { assert } = require('chai');

describe('webpack-config-composer::fromWebpack1', function() {
  context('given an empty config...', function() {
    it('does not die', function() {
      assert.doesNotThrow(function() {
        subject({})
      })
    })

    it('outputs nothing', function() {
      const { config, directives } = subject()

      assert.deepEqual(config, {})
      assert.deepEqual(directives, [])
    })
  })

  describe('module.loaders', function() {
    it('works', function() {
      const { config, directives } = subject({
        module: {
          loaders: [
            {
              test: 'blah'
            }
          ]
        }
      })

      assert.deepEqual(config, {
        module: {}
      });

      assert.equal(directives.length, 2);
      assert.deepEqual(directives[1][0], 'module.loader')
      assert.deepEqual(directives[1][1], { test: 'blah' })
    })
  })

  describe('resolve.root', function() {
    it('works', function() {
      const { config, directives } = subject({
        resolve: {
          root: '/somewhere'
        }
      })

      assert.deepEqual(config, { resolve: {} });

      assert.equal(directives.length, 1);
      assert.deepEqual(directives[0][0], 'resolvePath')
      assert.deepEqual(directives[0][1], '/somewhere')
    })
  })

  describe('resolve.fallback', function() {
    it('works', function() {
      const { config, directives } = subject({
        resolve: {
          fallback: '/somewhere'
        }
      })

      assert.deepEqual(config, { resolve: {} });

      assert.equal(directives.length, 1);
      assert.deepEqual(directives[0][0], 'resolvePath')
      assert.deepEqual(directives[0][1], '/somewhere')
    })
  })

  describe('resolve.modulesDirectories', function() {
    it('works', function() {
      const { config, directives } = subject({
        resolve: {
          modulesDirectories: '/somewhere'
        }
      })

      assert.deepEqual(config, { resolve: {} });

      assert.equal(directives.length, 1);
      assert.deepEqual(directives[0][0], 'resolvePath')
      assert.deepEqual(directives[0][1], '/somewhere')
    })
  })
})