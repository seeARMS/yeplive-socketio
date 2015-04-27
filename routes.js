"use strict";

function Room(){
	this.messages = [];
	this.clients = [];
}

Room.prototype.getMessages = function(){
	return this.messages;
}

Room.prototype.message = function(message){
	this.messages.unshift(message);
	this.messages.splice(10,1);
	this.clients.forEach(function(client){
		client.emit('message', message);
	});
};

Room.prototype.join = function(socket){
	this.clients.push(socket);
}

Room.prototype.leave = function(socket){
	var id = socket.userId;
	for(var i = 0; i < this.clients.length; i++){
		if(this.clients.userId === id){
			this.messages.splice(i, 1);
		}
	}
};

var	crypto = require('crypto'),
	config = require('./config'),
	request = require('request');

var rooms = {};


module.exports = function(app, io){

	// Index
	app.get('/', function(req,res){
		res.json('YepLive Real-time Messaging Server');
	});

		// Get the test file
		console.log('testing');
		app.get('/test', function(req, res){
			res.sendFile(__dirname+'/index.html');
		});

	
	// Initialize a new socket.io application, named 'chat'
	var chat = io.on('connection', function (socket) {
		socket.on('join_room', function(data){
			socket.roomId = data.roomId;
			socket.username = data.username;
			socket.userId = data.userId;
			socket.isUploader = data.isUploader;

			rooms[socket.roomId] = rooms[socket.roomId] || new Room();
			rooms[socket.roomId].join(socket);

			socket.emit('getHistory', rooms[socket.roomId].getMessages());
		});

		socket.on('message', function(data){
			var message = data.message;
			var userId = data.userId;
			var roomId = socket.room;
			var message = {
				message:data.message,
				userId: data.userId,
				username: socket.username
			};
			
			rooms[socket.roomId].message(message);
		});

		socket.on('disconnection', function(socket){
			var roomId = socket.room;	
			rooms[roomId].leave(socket);
		});




		// When client emits join
		/*
		socket.on('client:join', function(data){
			if(! data){
				return socket.emit('server:error', {error:'must specifiy data'});
			}

			// Get the token and room(YepID)
			//var token = data.token;
			var room = data.room;

			if(! room ){
				return socket.emit('server:error', {error:'invalid channel'});	
			}

			// Create header
			var header = 'Bearer ' + token;

			// Check if token is valid
			//getAPI('/me', header, function(err, res, body){

				if(res.statusCode != 200){
					return socket.emit('server:error', {error:'invalid token'});	
				}

				// Cache user info
				var userObj = JSON.parse(body);

				// Update server: new connection
				postAPI('/internal/chat/' + room + '/connect', {}, function(err, res, body){

					// Return with list of messages in the room
					if(res.statusCode !== 200){
						return socket.emit('server:error', {error: 'room not found'});
					}

					// Associate socket with the users data
					socket.userID = userObj.user_id;
					socket.token = token;
					socket.display_name = userObj.display_name === '' ? 'anonymous' : userObj.display_name;

					// Create a room for the socket
					rooms[room] = rooms[room] || [];

					// Check if client already in room
					for(var i = 0; i < rooms[room].length; i++){
						if(rooms[room][i].userID === socket.userID){
							return socket.emit('server:error', {error:'already connected to this room'});
						}
					}

					//Add client to room	
					rooms[room].push(socket);

					//associate the socket with the room
					socket.room = room;

					console.log('user id: ' + userObj.user_id + ' joined room: ' + room );
					socket.emit('server:messages', {message:'successfully connected'});
				});
		//	}); 
		});

		// When client emits message
		socket.on('client:message', function(data){

			//get the room from the socket
			var room  = socket.room;

			//validate message
			var message = data.message;


			if(data.message.length > 255){
				return socket.emit('server:error', {error:'message too long'});	
			}

			var numClients = rooms[room].length;

			// Assign user id to message
			data.userID = socket.userID;

			// Broadcast to everyone in the room
			for(var i = 0; i < numClients; i++){
				if(socket.userID !== rooms[room][i].userID){
					rooms[room][i].emit('server:messages', data);
				}
			}
		});

		socket.on('client:leave', function(data){
			//disconnect socket from room
			leaveRoom(socket);	
		});

		socket.on('disconnect', function(socket){
			//disconnect socket from room
			leaveRoom(socket);
		});

	*/
	});
};

// Post request to the api
function postAPI(route, params, auth, cb) {
	if(typeof auth == 'function'){
		cb = auth;
		return request({
			method: 'POST',
			uri: config.yeplive_api.host + '/api/v1' + route,
			form: params
		},cb);
	}
	request({
		method: 'POST',
		uri: config.yeplive_api.host + '/api/v1' + route,
		headers: { 'Authorization': auth },
		form: params
	},cb);
}

// Get request to the api
function getAPI(route, auth, cb) {
	request({
		method: 'GET',
		uri: config.yeplive_api.host +'/api/v1'+ route,
		headers: { 'Authorization': auth }
	}, cb);
}

// Remove socket from room
function leaveRoom(socket){	

	var room = rooms[socket.room];

	if(! socket.room){
		return;
	}
	var numClients = room.length;

	// Remove the socket from room
	for(var i = numClients-1 ; i >= 0; i--){
		if(room[i].userID === socket.userID){
			console.log('User: ' + room[i].userID + ' left room ' + socket.room);
			room.splice(i,1);
		}
	}
	postAPI('/internal/chat/'+socket.room+'/disconnect',
			{}, 
			'Bearer ' + socket.token,
			function(err, res, body){
	});

	socket.emit('server:messages', {message:'successfully disconnected'});
	socket.disconnect();
}

