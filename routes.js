"use strict";

/*
function Socket(socket){
	this.connection = socket;
}

function Room(){
	this.messages = [];
	this.clients = [];
}

Room.prototype.getMessages = function(){
	var messages = this.messages;
	var latestTenMessage = messages.slice(messages.length-10, messages.length);
	return latestTenMessages;
}

Room.prototype.message = function(message){
	this.messages.push(message);
	//this.messages.splice(0,1);
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
*/

function Chat(){
	this.rooms = {};
}

Chat.prototype.message = function(room, message){
	this.rooms[room] = this.rooms[room] || [];
	this.rooms[room].push(message);	
}

Chat.prototype.getMessages = function(room){
	return this.rooms[room] || [];
}

var chat = new Chat();

var	crypto = require('crypto'),
	config = require('./config'),
	request = require('request');

var rooms = {};


module.exports = function(app, io){

	// ndex
	app.get('/', function(req,res){
		res.json('YepLive Real-time Messaging Server');
	});


	app.get('/test', function(req, res){
		res.sendFile(__dirname+'/test.html');
	});

	app.post('/socket/yeps', function(req, res){
		var yep = req.body;
		console.log(yep);
		io.to('global').emit('yep:new',yep);
		res.status(200).json({success:true});
	});

	app.post('/socket/yeps/complete', function(req, res){
		var yep = req.body;
		console.log(yep);
		io.to(yep.id).emit('yep:complete', yep);
		res.status(200).json({success:true});
	});

	app.post('/socket/yeps/views', function(req, res){
		var yep = req.body;
		console.log(yep);
		io.to(yep.yep_id).emit('yep:view', yep);
		res.status(200).json({success:true});	
	});

	app.post('/socket/yeps/votes', function(req, res){
		var yep = req.body;
		console.log(yep);
		io.to(yep.yep_id).emit('yep:vote', yep);
		res.status(200).json({success:true});	
	});

	
	// Initialize a new socket.io application, named 'chat'
	var namespace= io.on('connection', function (socket) {
		socket.join('global');

		socket.on('join_room', function(data){

			if( !data || ! data.yepId || ! data.userId  ){
				return socket.emit('server:error',{error: 'invalid parameters'});
			}

			socket.userId = data.userId;
			socket.isUploader = data.isUploader || 0;
			socket.displayName = data.displayName;
			socket.yepId = data.yepId;

			socket.join(data.yepId);

			var clients = io.nsps['/'].adapter.rooms[data.yepId].length;
			io.to(data.yepId).emit('yep:connections', clients);
			var response = {
				messages: chat.getMessages(socket.yepId)
			};
			socket.emit('chat:history', response );
		});

		socket.on('message', function(data){

			if(! data || ! data.message || ! data.userId ){
				return socket.emit('server:error',{error: 'invalid parameters'});
			}

			if(data.userId !== socket.userId){
				return socket.emit('server:error',{error:'what r u doin'});
			}


			var message = {
				displayName: socket.displayName,
				userId: socket.userId,
				message: data.message,
				isUploader: socket.isUploader
			};

			chat.message(socket.yepId, message);
			io.to(socket.yepId).emit('chat:message', data);
		});

		socket.on('leave_room', function(data){
			/*
			if(!data || ! data.yepId || ! data.userId ){
				return socket.emit('server:error', {error:'invalid parameters'});
			}
			*/
			
			socket.leave(socket.yepId);
		});

		socket.on('disconnection', function(socket){
			var yepId = socket.room;	
			rooms[yepId].leave(socket);
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
		*/

		socket.on('client:leave', function(data){
			//disconnect socket from room
			leaveRoom(socket);	
		});

		socket.on('disconnect', function(socket){
			//disconnect socket from room
			leaveRoom(socket);
		});

	
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

