var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var crypto = require('crypto');
var config = require('./config');



app.get('/', function(req,res){
	res.json('YepLive Real-time Messaging Server');
});

app.post('/user/:user_id/room', function(req, res){
	
	//Authentication-> Send token to Yeplive Web API to verify
	//Make sure-> One id can only create one room at one time

	crypto.randomBytes(48, function(ex, buf) {
	  var roomId = '/' + buf.toString('hex');
	  var socketRoom = io.of(roomId);
		socketRoom.on('connection', function(socket){
			socket.on('yeplive_messaging', function(msg){
				socketRoom.emit('yeplive_messaging', msg);
			});
		});
		var response = {
			status : 'success',
			roomId : roomId
		}
		res.status(200).json(response);
	});
});


http.listen(process.env.PORT || config.PORT, function(){
  console.log('Yeplive real-time messaging now running on port ' + process.env.PORT );
});
