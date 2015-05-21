"use strict";

var	crypto = require('crypto'),
	config = require('./config'),
	request = require('request');

var redis = require('redis');
var rooms = {};

function Chat(){
	this.rooms = {};
	this.redis = redis.createClient(
		config.redis.port, 
		config.redis.host
	);
}

Chat.prototype.connection = function(room){
	this.redis.get('connection:'+room, function(err, res){
		if(err){
			return cb(err);
		}
		if(! res){
			this.redis.set('connections:'+room, 1);
		} else {
			res++;
			this.redis.set('connections:'+room, res);
		}
	});
}

Chat.prototype.getUsers = function(room, cb){
	this.redis.get('users:'+room, function(err, res){
		cb(null, res);
	});
}

Chat.prototype.user = function(room, user){
	this.redis.get('');
};

Chat.prototype.getConnections = function(room, cb){
	this.redis.get('connections:'+room,function(err, res){
		cb(null, res);
	}); 
}

Chat.prototype.message = function(room, message){
	this.redis.append('chat:'+room, JSON.stringify(message)+',');
};

Chat.prototype.getMessages = function(room, cb){
	var self = this;
	this.redis.get('chat:'+room, function(err, res){
		if(! res){
			self.redis.set('chat:'+room,[], function(err){
				cb(err, {messages:[]});
			});
		} else {
			var jsonString = '{"messages":['+res.substring(0,res.length-1)+']}';
			cb(err, JSON.parse(jsonString));
		}
	});
};

var chat = new Chat();


module.exports = function(app, io){

	// index
	app.get('/', function(req,res){
		res.json('YepLive Real-time Messaging Server');
	});


	app.get('/test', function(req, res){
		res.sendFile(__dirname+'/test.html');
	});

	app.post('/socket/yeps', function(req, res){
		var yep = req.body;
		if(yep.vod_enable){
			yep.vod_enable = 1;
		} else {
			yep.vod_enable = 0;
		}
		if(yep.portrait){
			yep.portrait= 1;
		} else {
			yep.portrait= 0;
		}
		if(yep.front_facing){
			yep.front_facing = 1;
		} else {
			yep.front_facing = 0;
		}
		if(yep.staging === 0 || yep.staging === false){
			io.to('global').emit('yep:new',yep);
		}
		res.status(200).json({success:true});
	});

	app.post('/socket/yeps/complete', function(req, res){
		var yep = req.body;
		if(yep.vod_enable){
			yep.vod_enable = 1;
		} else {
			yep.vod_enable = 0;
		}
		if(yep.portrait){
			yep.portrait = 1;
		} else {
			yep.portrait = 0;
		}
		if(yep.front_facing){
			yep.front_facing = 1;
		} else {
			yep.front_facing = 0;
		}

		io.to('global').emit('yep:complete', yep);
		res.status(200).json({success:true});
	});

	app.post('/socket/yeps/delete', function(req ,res){	
		var yep = req.body;
		if(yep.vod_enable){
			yep.vod_enable = 1;
		} else {
			yep.vod_enable = 0;
		}
		if(yep.portrait){
			yep.portrait = 1;
		} else {
			yep.portrait = 0;
		}
		if(yep.front_facing){
			yep.front_facing = 1;
		} else {
			yep.front_facing = 0;
		}

		io.to('global').emit('yep:delete', yep);	
//		io.to(yep.id).emit('yep:delete', yep);
		res.status(200).json({success:true});
	});

	app.post('/socket/yeps/views', function(req, res){
		var yep = req.body;
		if(yep.vod_enable){
			yep.vod_enable = 1;
		} else {
			yep.vod_enable = 0;
		}
		if(yep.portrait){
			yep.portrait = 1;
		} else {
			yep.portrait = 0;
		}
		if(yep.front_facing){
			yep.front_facing = 1;
		} else {
			yep.front_facing = 0;
		}

		io.to(yep.yep_id).emit('yep:view', yep);
		res.status(200).json({success:true});	
	});

	app.post('/socket/yeps/votes', function(req, res){
		var yep = req.body;
		if(yep.vod_enable){
			yep.vod_enable = 1;
		} else {
			yep.vod_enable = 0;
		}
		if(yep.portrait){
			yep.portrait = 1;
		} else {
			yep.portrait = 0;
		}
		if(yep.front_facing){
			yep.front_facing = 1;
		} else {
			yep.front_facing = 0;
		}


		io.to(yep.yep_id).emit('yep:vote', yep);
		res.status(200).json({success:true});	
	});

	
	// Initialize a new socket.io application, named 'chat'
	var namespace= io.on('connection', function (socket) {

		socket.join('global');

		socket.on('ping', function(data){
		});

		socket.on('join_room', function(data){
			if(typeof data === 'string'){
				data = JSON.parse(data);
			}

			if( !data || ! data.yep_id || ! data.user_id  ){
				return socket.emit('server:error',{error: 'invalid parameters'});
			}


			socket.user_id = data.user_id;
			socket.display_name = data.display_name;
			socket.yep_id = data.yep_id;
			socket.picture_path = data.picture_path;

			socket.join(data.yep_id);

//			var clients = io.nsps['/'].adapter.rooms[data.yep_id].length || 1;
			
			var clients = Object.keys(io.nsps['/'].adapter.rooms[data.yep_id]).length;


			io.to(data.yep_id).emit('yep:connection', {
				connection_count: clients
			});

			chat.getMessages(socket.yep_id, function(err, res){
				socket.emit('chat:history', res);
			});
		});

		socket.on('status', function(data){	
			if(typeof data === 'string'){
				data = JSON.parse(data);
			}
			var id = socket.yep_id;
			if(! id){
				return;
			}
			io.to(id).emit('yep:status', data);
		});

		socket.on('message', function(data){
			if(typeof data === 'string'){
				data = JSON.parse(data);
			}
			if(! data || ! data.message || ! data.user_id ){
				return socket.emit('server:error',{error: 'invalid parameters'});
			}

			if(data.user_id !== socket.user_id){
				return socket.emit('server:error',{error:'what r u doin'});
			}

			var message = {
				display_name: socket.display_name,
				user_id: socket.user_id,
				message: data.message,
				picture_path: socket.picture_path
			};

			chat.message(socket.yep_id, message);
			io.to(socket.yep_id).emit('chat:message', message);
		});

		socket.on('leave_room', function(data){
			
			socket.leave(socket.yep_id);
		});

		socket.on('disconnection', function(socket){
			socket.leave(socket.yep_id);
		});

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

