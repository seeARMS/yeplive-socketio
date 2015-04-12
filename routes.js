var	crypto = require('crypto'),
	config = require('./config'),
	request = require('request');


module.exports = function(app, io){

	// Index
	app.get('/', function(req,res){
		res.json('YepLive Real-time Messaging Server');
	});

	// Create a socket IO room for this user
	app.post('/user/:user_id/room', function(req, res){
		//Authentication -> Send token to Yeplive Web API to verify
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

	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function (socket) {

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
	});
};

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