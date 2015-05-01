module.exports = (function(){

	var conf = {};
	
	conf.redis = process.env.TESTING ? 
		'localhost' : 'globalcache.fkjvwm.0001.usw2.cache.amazonaws.com';

	console.log(conf.redis);

	return conf;

}());
