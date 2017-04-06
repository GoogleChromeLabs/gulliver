const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    'gulliver': './public/js/gulliver.es6.js'
  },
  output: {
    path: path.join(__dirname, 'public/js'),
    filename: '[name].js',
    publicPath: '/js/'
  },
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loaders: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime', 'syntax-dynamic-import']
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true, sourceMap: true})
  ],
  devtool: 'source-map'
};
