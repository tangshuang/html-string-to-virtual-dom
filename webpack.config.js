module.exports = {
  entry: {
    VirtualDOM: './VirtualDOM.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    libraryTarget: 'umd',
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
}
