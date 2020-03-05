const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join, resolve } = require('path')
module.exports = {
  entry: "./src/client/js/main.js",
  output: {
    path: __dirname + "./devBuild/client/js",
    filename: "bundle.js"
  },
  module: {
    rules: [
    {
      test: /\.(js)$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }
    ]
  },
    mode: "development",
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: resolve(__dirname + "/src/client/index.html"),
            filename: resolve(__dirname + './devBuild/client/index.html')
        })
   ]
}
