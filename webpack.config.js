const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const uglifyjsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	mode: 'production',
  entry: './lib/rules/standard-word-detection.js',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'lib/index.js',
  },
	module:{
		rules:[
			{
				test:/\.js$/,
				use: 'babel-loader'
			}
		]
	},
  plugins: [
    // new CleanWebpackPlugin(),
		new uglifyjsPlugin()
  ],
	externals:{ 
    "fs": "commonjs fs" 
	} 
}