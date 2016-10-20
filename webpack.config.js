const {resolve, join} = require('path');
const webpack    = require('webpack');
const HTMLPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// Source
const appEntryFile  = resolve(__dirname, 'front', 'app', 'index.js');
const appConfigFile = resolve(__dirname, 'front', 'app', 'config.json');
const appSourcePath = resolve(__dirname, 'front', 'app');
// Destination
const appDestPath   = resolve(__dirname, 'front', 'www');

// Bools to determine build environment
// const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

module.exports = env => {

  // Helper to remove empty elements from an array. Used in plugins below.
  const removeEmpty = array => array.filter(i => !!i);

  const isProd = env.prod ? true : false;

  console.log('Building env: ', env, isProd, isTest);

  return {

    entry: {
      // Main application
      app   : appEntryFile,
      // Vendor libs to include in separate file
      vendor: ['lodash']
    },

    output: {
      path      : appDestPath,
      // Name is replaced with keys from entry block
      filename  : "bundle.[name].js",
      publicPath: isProd ? '' : '/'
    },

    devtool: env.prod ? 'source-map' : 'eval',
    bail   : env.prod,

    module: {
      preLoaders: [
        {
          test   : /\.jsx?$/,
          loader : "eslint-loader",
          exclude: ['/node_modules/', '/app/vendor/']
        }
      ],
      loaders   : [
        {
          test: /\.css$/, loader: 'style-loader!css-loader!postcss-loader'
        },
        {
          test  : /\.s(a|c)ss$/,
          loader: 'style-loader!css-loader!postcss-loader!sass-loader'
        },
        // {
        //   test: /\.html?$/, loader: "file?name=[name].[ext]"
        // },
        {
          test  : /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
          loader: 'file?name=[name].[ext]'
        },
        {
          test   : /\.(jpe?g|png|gif|svg)$/i,
          loaders: [
            'file?hash=sha512&digest=hex&name=[hash].[ext]',
            'image-Webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
          ]
        },
        {
          test   : /\.jsx?$/,
          loader : 'babel',
          exclude: ['/node_modules/'],
          query  : {
            presets: removeEmpty(['stage-0', 'es2015-loose', 'react', isProd ? undefined : 'react-hmre']),
            compact: true
          }
        }
      ]
    },

    devServer: {
      historyApiFallback: true
    },

    postcss: function () {
      return [require('autoprefixer'), require('precss')];
    },

    sassLoader: {
      indentedSyntax: true
    },

    eslint: {
      configFile   : './.eslintrc',
      quiet        : false,
      failOnWarning: false,
      failOnError  : true
    },

    plugins: removeEmpty([
      new HTMLPlugin({
        title   : 'Course Catalog',
        template: 'front/app/index.html'
      }),
      new CopyPlugin([{
        from: appConfigFile
      }]),
      // Optimize ID order
      new webpack.optimize.OccurrenceOrderPlugin(),
      // If we're not in testing, create a separate vendor bundle file
      isTest ? undefined : new webpack.optimize.CommonsChunkPlugin({name: 'vendor'}),
      // If we're in prod, optimization
      isProd ? undefined : new webpack.DefinePlugin({
        'process.env': {NODE_ENV: '"production"'}
      }),
      isProd ? undefined : new webpack.DefinePlugin({
        'process.env': {NODE_ENV: '"production"'}
      })
    ])
  }
};
