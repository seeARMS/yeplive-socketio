"use strict";

var	crypto = require('crypto'),
	config = require('./config'),
	request = require('request'),
	Log = require('winston');

Log.info('LOGGING SETUP');
Log.add(Log.transports.File, { filename: 'socket.log' });

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
	var self = this;
	this.redis.get('users:'+room, function(err, res){
		if(! res){
			cb(null, {users:[]});
		} else {
			var jsonString = '{"users":['+res.substring(0,res.length-1)+']}';
			cb(err, JSON.parse(jsonString));
		}
	});
}

Chat.prototype.addUser = function(room,user, cb){
	var self = this;
	this.getUsers(room, function(err, res){
		var inRoom = false;
		for(var i = 0; i < res.users.length; i++){
			if(res.users[i].user_id === user.user_id){
				inRoom = true;
			}
		}
		if(! inRoom){
			postAPI('/yeps/'+room+'/user-views',{
				key:'evaniscool',
				user_id: user.user_id
			},function(){
				Log.info('set user views'+user+'in yep '+room);
			});
			self.redis.append('users:'+room, JSON.stringify(user)+',', function(){
				if(cb){
					cb(null);
				}
			});
		} else {
			cb(null);
		}
	});
			
}

Chat.prototype.removeUser = function(room, userID, cb){
	var self = this;
	this.getUsers(room, function(err, res){
		if((typeof res) == 'string'){
			res = JSON.parse(res);
		}

		var copy = [];

		for(var i = 0; i < res.users.length; i++){
			if (userID == res.users[i].user_id){
				continue;
			}
			copy.push(res.users[i]);
		}
		
		

		res.users = [];
		var returns = 0;
		self.redis.set('users:'+room,'', function(){
			for(var i = 0; i < copy.length; i++){
				self.addUser(room, copy[i], function(){
				returns++;
					if(returns === copy.length){
						cb();
					}	
				});
			}
		});
	});
}

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
	//require('winston-logs-display')(app, Log);

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

		Log.info("NEW CONNECTION");

		socket.join('global');

		socket.on('ping', function(data){
		});

		socket.on('join_room', function(data){
			Log.info("ROOM JOINED");
			Log.info(data);

			if(typeof data === 'string'){
				data = JSON.parse(data);
			}

			if( !data || ! data.yep_id || ! data.user_id  ){
				return socket.emit('server:error',{error: 'invalid parameters'});
			}


			socket.user_id = data.user_id;
			socket.display_name = data.display_name;
			socket.yep_id = data.yep_id;
			socket.is_uploader = data.is_uploader;
			socket.picture_path = data.picture_path;
			socket.version = data.version;

			socket.join(data.yep_id);

//			var clients = io.nsps['/'].adapter.rooms[data.yep_id].length || 1;
			
			var clients = Object.keys(io.nsps['/'].adapter.rooms[data.yep_id]).length;



			if(data.version && data.version >= 1){
				chat.addUser(socket.yep_id,{
					user_id: socket.user_id,
					display_name: socket.display_name,
					picture_path: socket.picture_path
				}, function(){
					getAPI('/yeps/'+socket.yep_id, function(err, res, body){
						if((typeof body) == 'string'){
							body= JSON.parse(body);
						}
						Log.info('GET YEP:');
						Log.info(body);
						Log.info(body.vod_enable);
						if(body.vod_enable){
							socket.vod = true;
							getAPI('/yeps/'+socket.yep_id+'/user-views', function(err, res){
								if((typeof res) == 'string'){
									res = JSON.parse(res);
								}
								var json = res.map(function(val){
									return {
										display_name: val.user.display_name,
										user_id: val.user.user_id,
										picture_path: val.user.picture_path
									};
								});
								var data = {
									users: json
								};
								io.to(socket.yep_id).emit('chat:users', data);
								io.to(data.yep_id).emit('yep:connection', {
									connection_count: data.users.length,
									user_id: socket.user_id,
									picture_path: socket.picture_path
								});
							});
						} else {
							socket.vod = false;
							chat.getUsers(socket.yep_id, function(err, res){
								Log.info("SENDING USERS:");
								Log.info(res);
								io.to(socket.yep_id).emit('chat:users', res);
							});
							io.to(data.yep_id).emit('yep:connection', {
								connection_count: clients,
								user_id: socket.user_id,
								picture_path: socket.picture_path
							});
						}
					});
				});
			} else {
			io.to(data.yep_id).emit('yep:connection', {
				connection_count: clients,
				user_id: socket.user_id,
				picture_path: socket.picture_path
			});

			}


			chat.getMessages(socket.yep_id, function(err, res){
				Log.info("SENDING CHAT HISTORY:");
				Log.info(res);
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
			Log.info("NEW MESSAGE:");
			Log.info(data);
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
/*

			var uploader = io.sockets.clients(socket.yep_id).filter(function(socket){
				return socket.is_uploader == true;
			});

			if(uploader.length == 0){
				request.post(process.env.YEPLIVE_API+'/api/v1/yeps/'+socket.yep_id'/chatPush', {
					key: 'evaniscool',
					user_id: socket.user_id
				}, function(err, res, body){
				});
			}
	*/

			chat.message(socket.yep_id, message);
			Log.info("SENDING MESSAGE:");
			Log.info(message);
			io.to(socket.yep_id).emit('chat:message', message);
		});

		socket.on('leave_room', function(data){
			Log.info("LEAVING ROOM:");
			Log.info(data);
			var yep_id = socket.yep_id;
			socket.leave(socket.yep_id);
			if(socket.version && socket.version >= 1){
				if(! socket.vod){
					chat.removeUser(socket.yep_id, socket.user_id, function(){
						chat.getUsers(socket.yep_id, function(err, res){
							Log.info("SENDING USERS AFTER DISCONNECT:");
							Log.info(res);
							io.to(yep_id).emit('chat:users', res);
						});
					});
				}
			}
		});

		socket.on('disconnection', function(socket){
			Log.info("SOCKET DISCONNECTION");
			socket.leave(socket.yep_id);
			if(socket.version && socket.version >= 1){
				chat.removeUser(socket.yep_id, socket.user_id, function(){
					chat.getUsers(socket.yep_id, function(err, res){
						Log.info("SENDING USERS AFTER DISCONNECT:");
						Log.info(res);
						io.to(yep_id).emit('chat:users', res);
					});
				});
			}

		});
	});
};

// Post request to the api
function postAPI(route, params, auth, cb) {
	if((typeof auth) == 'function'){
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
	if((typeof auth) == 'function'){
		cb = auth;
		return request({
			method: 'GET',
			uri: config.yeplive_api.host + '/api/v1' + route,
		},cb);
	}

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

