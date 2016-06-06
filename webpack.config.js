const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');

const PATHS = {
  app: path.join(__dirname, 'src', 'index'),
  build: path.join(__dirname, 'public'),
  exclude: /node_modules/
};

const common = {
  entry: PATHS.app,

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  output: {
    path: PATHS.build,
    filename: 'app.bundle.js'
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        exclude: PATHS.exclude
      }
    ]
  }
};

const configs = {
  start: merge(common, {}),

  watch: merge(common, {
    devServer: {
      contentBase: PATHS.build,
      inline: true,
      progress: true,
      stats: 'errors-only',
      host: process.env.HOST || '0.0.0.0',
      port: process.env.PORT || '8081'
    }
  }),

  build: merge(common, {
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ]}
  )
};

module.exports = configs[process.env.npm_lifecycle_event] || common;
