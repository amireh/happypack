const path = require('path')
const root = path.resolve(__dirname, '../../../')

const exampleInfo = module => {
  // module.filename = ".../examples/[name]/versions/[version]/[mode]/webpack.config.js"
  const exampleConfigFile = module.filename.split(root)[1]

  const [
    ,          // examples
    name,      // [name]: String
    ,          // versions
    version,   // [version]: Number
    mode,      // [mode]: String.<"vanilla" | "happy">
  ] = exampleConfigFile.split(path.sep).filter(x => !!x)

  return {
    dir: path.join(root, 'examples', name),
    name,
    version,
    mode
  }
}

exports.srcDir = module => path.join(exampleInfo(module).dir, 'src')
exports.outputDir = module => {
  const info = exampleInfo(module)

  return path.join(info.dir, 'dist', 'versions', info.version, info.mode);
}

exports.exampleDir = module => exampleInfo(module).dir
exports.resolve = (module, ...relPath) => path.join(exampleInfo(module).dir, ...relPath)

exports.happyLoader = path.resolve(__dirname, '../../../lib/HappyLoader.js');
exports.HappyPack = require('../../../lib/HappyPlugin.js')