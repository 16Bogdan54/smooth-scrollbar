const webpack = require('webpack');

const devConfig = require('./webpack.config.dev');
const version = require('./package.json').version;

module.exports = Object.assign({}, devConfig, {
    watch: false,
    plugins: [
        new webpack.DefinePlugin({
            __SCROLLBAR_VERSION__: JSON.stringify(version),
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
        }),
    ],
});
