const htmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "shopify.js",
    path: path.resolve(__dirname, "dist/shopify"),
  },
  devServer: {
    port: 7709,
    hot: true,
    static: ["public"],
  },
  module: {
    rules: [
      {
        test: /.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "sass-loader",
        ],
      },
      {
        test: /.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    new NodePolyfillPlugin(),
    new htmlWebpackPlugin({
      template: "./tpl/index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "shopify.css",
    }),
  ],
};
