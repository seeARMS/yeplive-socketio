var app = require('express')(),
	http = require('http').Server(app),
	io = require('socket.io')(http);


require('./routes')(app, io);

/*
app.post('/user/:user_id/room', function(req, res){
	//Authentication-> Send token to Yeplive Web API to verify
	if (req.header('Authorization').substring(0,6) === 'Bearer'){
		request(
			{ method: 'POST',
		      uri: config.yeplive_api.host + config.yeplive_api.port + '/',
		      multipart:
		      [ { 'Authorization': req.header('Authorization') } ]
		    }
			, function (error, response, body) {
				if (error || response.statusCode != 200) {
			    	return res.status(400).json({ status : 'failed to authorize user' });
			    }
			    else{
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
						//Call Laravel Controller to update room assignment
						res.status(200).json(response);
					});
			    }
			}
		);
	}
});
*/


http.listen(process.env.PORT || config.PORT, function(){
  console.log('Yeplive real-time messaging now running on port ' + process.env.PORT );
});
