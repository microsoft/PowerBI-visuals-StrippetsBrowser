'use strict';

const webpackConfig = require('./webpack.config');
const isTddMode = process.argv.indexOf("--tdd") > -1;
const webpack = require('webpack');
const fs = require('node:fs');
process.env.CHROME_BIN = process.env.CHROME_BIN || require('@playwright/test').chromium.executablePath();
const containerBrowser = fs.existsSync('/.dockerenv') || process.env.CI;

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'sinon-chai', 'webpack'],
        files: [
            'src/**/*.spec.ts'
        ],
        exclude: [
        ],
        preprocessors: {
            'src/**/*.spec.ts': ['webpack', 'sourcemap']
        },
        webpack: {
            mode: 'development',
            module: webpackConfig.module,
            resolve: webpackConfig.resolve,
            externals: [
                {
                    sinon: "sinon",
                    chai: "chai",
                },
            ],
            plugins: webpackConfig.plugins.concat([
              new webpack.SourceMapDevToolPlugin({
                filename: null, // if no value is provided the sourcemap is inlined
                test: /\.(ts|js)($|\?)/i // process .js and .ts files only
              })
            ])
        },
        webpackMiddleware: {
            // suppress webpack errors
            stats: 'none'
        },
        mime: {
            'text/x-typescript': ['ts']
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: isTddMode ? ['Chrome'] : [containerBrowser ? 'ChromeHeadlessContainer' : 'ChromeHeadless'],
        customLaunchers: {
            ChromeHeadlessContainer: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox', '--disable-dev-shm-usage'],
            },
        },
        singleRun: !isTddMode,
        concurrency: Infinity
    })
};
