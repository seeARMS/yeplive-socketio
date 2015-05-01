var app = require('express')(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	config = require('./config'),
	bodyParser = require('body-parser');


app.use(bodyParser.json({  }));

require('./routes')(app, io);

http.listen(80);/* process.env.PORT || config.PORT, function(){
  console.log('Yeplive real-time messaging now running');
});
*/
