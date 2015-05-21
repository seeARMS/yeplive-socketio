require('newrelic');

var app = require('express')(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	config = require('./config'),
	bodyParser = require('body-parser'),
	memwatch = require('memwatch');

memwatch.on('leak', function(info){
	console.log('MEMORY LEAK INFO:');
	console.log(info);
});

app.use(bodyParser.json({  }));

require('./routes')(app, io);


http.listen(process.env.PORT || config.PORT, function(){
  console.log('Yeplive real-time messaging now running');
});
