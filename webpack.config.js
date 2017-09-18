var Bufferify = require('webpack-bufferify')

function UseDefaultExport() {}
UseDefaultExport.prototype.apply = Bufferify.prototype.apply
UseDefaultExport.prototype.process = function(content, file) {
  if (file === 'VirtualDOM.browser.js') {
    return content + "\r\n" + 'window["VirtualDOM"] = window["VirtualDOM"]["default"];'
  }
}

module.exports = {
  entry: {
    VirtualDOM: './VirtualDOM.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].browser.js',
    libraryTarget: 'window',
    library: '[name]',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [['es2015', {modules: false}]],
        },
      },
    ],
  },
  plugins: [
    new UseDefaultExport(),
  ],
}
