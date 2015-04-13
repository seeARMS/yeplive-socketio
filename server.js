var app = require('express')(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	config = require('./config'),
	bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: false }));

require('./routes')(app, io);


http.listen(process.env.PORT || config.PORT, function(){
  console.log('Yeplive real-time messaging now running on port ' + process.env.PORT );
});
