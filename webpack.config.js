var path = require("path");
module.exports = {
  entry: "./src/ERDDAP.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.browser.json",
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "erddap4js.js",
    path: path.resolve(__dirname, "dist/browser"),
    libraryTarget: "umd",
    library: "ERDDAP",
    libraryExport: "default",
  },
};
