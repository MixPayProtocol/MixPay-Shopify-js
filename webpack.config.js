const path = require("path");
const htmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const config = {
  entry: "./src/index.js",
  output: {
    filename: "shopify.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    port: 7709,
    hot: true,
    static: ["public"],
  },
  module: {
    rules: [
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
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins: [new CleanWebpackPlugin()],
};

if (process.env.NODE_ENV !== "production") {
  config.plugins.push(
    new htmlWebpackPlugin({
      template: "./public/template.html",
    })
  );
}

module.exports = config;
