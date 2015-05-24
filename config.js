module.exports = (function(){

	var conf = {};
	
	
	conf.redis = {
		host: process.env.TESTING ? 
			'localhost' : 'globalcache.fkjvwm.0001.usw2.cache.amazonaws.com',
		port:6379 
	};

	conf.yeplive_api = {
		host: 'http://yplv.tv'
	};

	console.log(conf.redis);

	return conf;

}());
