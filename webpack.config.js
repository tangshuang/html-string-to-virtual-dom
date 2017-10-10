const Bufferify = require('webpack-bufferify')

const WebpackPluginUseDefault = function() {}
WebpackPluginUseDefault.prototype.apply = Bufferify.prototype.apply
WebpackPluginUseDefault.prototype.process = function(content) {
    return content + `
window["VirtualDOM"] = window["VirtualDOM"]["default"];
`
}

const babelLoader = {
  test: /\.js$/,
  loader: 'babel-loader',
  options: {
    presets: [['es2015', {modules: false}]],
  },
}

module.exports = [
  {
    entry: './VirtualDOM.js',
    output: {
      path: __dirname + '/dist',
      filename: 'VirtualDOM.browser.js',
      libraryTarget: 'window',
      library: 'VirtualDOM',
    },
    module: {
      rules: [
        babelLoader,
      ],
    },
    plugins: [
      new WebpackPluginUseDefault(),
    ],
  }, 
  {
    entry: './VirtualDOM.js',
    output: {
      path: __dirname + '/dist',
      filename: 'VirtualDOM.js',
      libraryTarget: 'umd',
    },
    externals: {
      htmlparser2: 'commonjs2 htmlparser2',
    },
    module: {
      rules: [
        babelLoader,
      ],
    },
  },
]
