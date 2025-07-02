const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify"),
        "url": require.resolve("url"),
        "path": require.resolve("path-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "process": require.resolve("process/browser")
    })
    config.resolve.fallback = fallback;
    // Alias for process/browser import to include .js extension
    config.resolve.alias = Object.assign({}, config.resolve.alias, {
        'process/browser': require.resolve('process/browser.js'),
        'process/browser$': require.resolve('process/browser.js'),
        'jspdf/dist/jspdf.es.min.js$': require.resolve('jspdf/dist/jspdf.umd.min.js')
    });
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ]);
    // Completely disable source-map-loader to avoid jspdf build errors
    if (config.module && Array.isArray(config.module.rules)) {
        config.module.rules = config.module.rules.map(rule => {
            if (rule.enforce === 'pre' && rule.use) {
                const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
                rule.use = uses.filter(u => !(u && u.loader && u.loader.includes('source-map-loader')));
            }
            return rule;
        }).filter(rule => {
            // Remove rules that have no loaders left
            if (rule.use && Array.isArray(rule.use) && rule.use.length === 0) {
                return false;
            }
            return true;
        });
    }
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
}