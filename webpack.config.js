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
    extensions: ['', '.js']
  },

  output: {
    path: PATHS.build,
    filename: 'mofun.js',
    library: 'mofun',
    libraryTarget: 'umd',
    umdNamedDefine: true
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
    output: {
      filename: 'mofun.min.js'
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ]}
  )
};

module.exports = configs[process.env.npm_lifecycle_event] || common;
