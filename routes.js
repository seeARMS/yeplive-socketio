var	crypto = require('crypto'),
	config = require('./config'),
	request = require('request');

var rooms = {};



module.exports = function(app, io){

	// Index
	app.get('/', function(req,res){
		res.json('YepLive Real-time Messaging Server');
	});

	if(process.env.TEST){
		// Get the test file
		app.get('/test', function(req, res){
			res.sendFile(__dirname+'/index.html');
		});
	}

	
	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function (socket) {
		//When client emits join
		socket.on('client:join', function(data){
			//get the token and room(YepID)
			var token = data.token;
			var room = data.room;
			if(! room || ! token){
				return socket.emit('server:error', {error:'invalid token'});	
			}
			//create header
			var header = 'Bearer '+token;
			//Check if token is valid
			getAPI('/me', header, function(err, res, body){
				if(res.statusCode != 200){
					return socket.emit('server:error', {error:'invalid token'});	
				} 
				var json = JSON.parse(body);
				//Tell server new connection
				postAPI('/internal/chat/'+room+'/connect', {}, header, function(err, res, body){
					//return with list of messages in the room
					if(res.statusCode !== 200){
						return socket.emit('server:error', {error: 'room not found'});
					}
				//associate socket with the users data 
				socket.userID = json.user_id;
				socket.token = token;
				socket.display_name = json.display_name === '' ? 'anonymous' : json.display_name;
				//create a room for the socket
				rooms[room] = rooms[room] || [];
				//check if client already in room
				for(var i = 0; i < rooms[room].length; i++){
					if(rooms[room][i].userID === socket.userID){
						return socket.emit('server:error', {error:'already connected to this room'});
					}
				}
				//Add client to room	
				rooms[room].push(socket);
				//associate the socket with the toom
				socket.room = room;

					socket.emit('server:messages', {messages:JSON.parse(body)});
				});
			}); 
		});

		//When client emits message
		socket.on('client:message', function(data){
			//get the room from the socket
			var room  = socket.room;
			//validate message
			var message = data.message;
			if(data.message.length > 255){
				return socket.emit('server:error', {error:'message too long'});	
			}
			//send message to server
			postAPI('/internal/chat/'+room+'/messages',
				{
					message: message
				},
				'Bearer '+socket.token,
				function(err, res, body){
					if(res.statusCode !== 200){
						return socket.emit('server:error', {error:'invalid token'});
					}
					//emit message to all clients connected to the room
					var numClients = rooms[room].length;
					for(var i = 0; i < numClients; i++){
						if(socket.userID !== rooms[room][i].userID){
							rooms[room][i].emit('server:message', data);
						}
					}	
			});
		});

		socket.on('client:leave', function(data){
			//disconnect socket from room
			leaveRoom(socket);	
		});

		socket.on('disconnect', function(socket){
			//disconnect socket from room
			leaveRoom(socket);
		});

		/*
		// When the client emits the 'load' event, reply with the 
		// number of people in this chat room
		socket.on('load',function(data){
			var room = findClientsSocket(io, data);

			// Use the socket object to store data. Each client gets
			// their own unique socket object
			//Owner of the room
			if(room.length === 0 ) {
				socket.owner = true;
				socket.username = data.user;
			}
			//Other poeple join the room
			else if(room.length >= 1) {
				socket.owner = false;
				socket.username = data.user;
			}
		});

		// When the client emits 'login', save his name,
		// and add them to the room
		// Client code => socket.emit('login', {user: name, id: id, img: img});
		// Where id is the room id
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.id);

			// Use the socket object to store data. Each client gets
			// their own unique socket object
			socket.room = data.id;

			// Use this to send image object to client
			socket.emit('img', 'image object for connected user');

			// Add the client to the room
			socket.join(data.id);

			// If this are more than one guest in the room
			if (room.length >= 1) {

				var usernames = [],
					images = [];

				// Clients already in the room
				for (var i = 0; i < room.length; i++){
					usernames.push(room[0].username);
					images.push(room[0].img);
				}
				
				// This client
				usernames.push(socket.username);
				images.push(socket.img);

				// Send the startChat event to all the people in the
				// room, along with a list of people that are in it.
				chat.in(data.id).emit('startChat', {
					id: data.id,
					users: usernames,
					images: images
				});
			}
		});

		/*
		// Somebody left the chat
		socket.on('disconnect', function() {

			// If owner leaves the room
			if(this.owner){
				// Tell everyone to go home
				socket.broadcast.to(this.room).emit('shutdown', {
					room: this.room
				});
			}
			else{
				// Notify the other people in the chat room
				// that this client has left
				socket.broadcast.to(this.room).emit('leave', {
					room: this.room,
					user: this.username,
					image: this.img
				});
			}
			// leave the room
			socket.leave(socket.room);
		});


		// Handle the sending of messages
		socket.on('msg', function(data){
			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
			
		});



		*/


	});
};

//Post request to the api
function postAPI(route, params, auth, cb) {
	request({
		method: 'POST',
		uri: config.yeplive_api.host + '/api/v1' + route,
	 headers: {
		'Authorization': auth,
	 },
	form: params
		}, cb);
}

//get request to the api
function getAPI(route, auth, cb) {
	request({
		method: 'GET',
		uri: config.yeplive_api.host +'/api/v1'+ route,
	 headers: {
		'Authorization': auth,
	 }
		}, cb);
}

//remove socket from room
function leaveRoom(socket){	
	var room = rooms[socket.room];
	if(! socket.room){
		return;
	}
	var numClients = room.length;	
	for(var i = 0; i < numClients; i++){
		if(room[i].userID === socket.userID){
			room[i].splice(i,1);
		}
	}
	console.log(room);
	console.log(numClients);
	console.log(room[i].length);
	//inform server of disconnect
	postAPI('/internal/chat/'+socket.room+'/disconnect',
				{}, 
				'Bearer '+socket.token,
				function(err, res, body){
			});
}

/*
function findClientsSocket(io, roomId, namespace) {
	var res = [],
		ns = io.of(namespace || "/");    // the default namespace is "/"

	if (ns) {
		for (var id in ns.connected) {
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			}
			else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}
*/

/*
	// Create a socket IO room for this usehr
	app.post('/user/:user_id/room', function(req, res){
		var yepID = req.body.yepid;
		//Authentication -> Send token to Yeplive Web API to verify
		if (req.header('Authorization').substring(0,6) === 'Bearer'){
			getAPI(config.yeplive_api.host + config.yeplive_api.port + '/me',
				req.header('Authorization'),
				function (error, response, body) {
					console.log(response.statusCode);
					if (error || response.statusCode != 200) {
				    	return res.status(400).json({ status : 'failed to authorize user' });
				    }
				    else{
						//use the id of the yep to create a new room
						var roomId =  '/'+yepID;
						var response = {
							status: 'success',
							roomId: roomId
						};
						res.status(200).json(response);
						/*
						crypto.randomBytes(48, function(ex, buf) {
							var roomId = '/' + buf.toString('hex');
							var response = {
								status : 'success',
								roomId : roomId
							}
							//To Do: Call Laravel Controller to update room assignment
							res.status(200).json(response);
						});
				    }
				}
			);
		}
	});
						*/
