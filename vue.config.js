module.exports = {
    productionSourceMap: false,
    devServer: {
        https: false,
        proxy: {
            '/api_v2': {
                target: 'http://127.0.0.1:8000/'
            }
        }
    }
}