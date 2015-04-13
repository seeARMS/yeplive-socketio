module.exports = (function(){
	return {
		PORT: 3000,
		yeplive_api : {
			host : process.env['YEPLIVE_URL'] || 'http://api.dev.yeplive.com/',
			port : ''
		}
	}
}());
