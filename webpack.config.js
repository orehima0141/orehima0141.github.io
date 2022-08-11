module.exports = {
  mode: 'development',
  entry: {
    'index': './src/index.ts'
  },
  output: {
    path: `${__dirname}/docs/js`,
    filename: '[name]_bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: [
      '.ts', '.js',
    ],
  },
};
