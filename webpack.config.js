module.exports = {
  entry: './VirtualDOM.js',
  output: {
    path: __dirname + '/dist',
    filename: 'VirtualDOM.browser.js',
    libraryTarget: 'umd',
    library: 'HSTVirtualDOM',
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
}
