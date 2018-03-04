exports.composeWebpackConfig = require('./composeWebpackConfig');
exports.fromWebpack1 = require('./fromWebpack1')
exports.getWebpackVersion = require('./getWebpackVersion')
exports.webpackVersion = require('./getWebpackVersion')()
exports.compose = directives => exports.composeWebpackConfig(exports.webpackVersion)(directives)