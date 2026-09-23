const webpack = require('webpack');
const path = require('path');
module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
        extensions: ['.js', '.ts'],
        modules: [path.resolve(__dirname, 'lib'), 'node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
            },
            { test: /\.handlebars$/, loader: 'handlebars-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery', _: 'underscore' }),
    ],
};
