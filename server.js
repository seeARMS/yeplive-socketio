require('newrelic');

var app = require('express')(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	config = require('./config'),
	bodyParser = require('body-parser'),
	memwatch = require('memwatch'),
	cluster = require('cluster'),
	redis = require('socket.io-redis');


var config = require('./config');

num_processes = require('os').cpus().length;

memwatch.on('leak', function(info){
	console.log('MEMORY LEAK INFO:');
	console.log(info);
});

/*
var adapter = io.adapter(redis({ host: config.redis.host, port: 6379 }));

adapter.pubClient.on('error', function(){});
adapter.subClient.on('error', function(){});


CLUSTERING?

if(cluster.isMaster){
	for(var i = 0; i < num_processes; i++){
		cluster.fork();
	}
} else {

}
*/

app.use(bodyParser.json({  }));

require('./routes')(app, io);


http.listen(process.env.PORT || config.PORT, function(){
  console.log('Yeplive real-time messaging now running');
});
