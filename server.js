const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

///////////////////////////////////////////////////////////////////////
//        Routes
///////////////////////////////////////////////////////////////////////

app.get('/', function(req, res) {
	res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});

app.get('/admin', function(req, res) {
	res.sendFile('admin.html', {root: path.join(__dirname, 'public')});
});

app.get('/:folder/:file', function(req, res) {
  res.sendFile(req.params.file, {root: path.join(__dirname, 'public', req.params.folder)});
});

///////////////////////////////////////////////////////////////////////
//        Sockets
///////////////////////////////////////////////////////////////////////

io.on('connection', (socket) => {
  console.log('A user connected. ' + socket.id);

  // PHASE I
  // socket.broadcast.to(all_admins).emit('user waiting', socket.id);
  socket.broadcast.emit('user waiting', socket.id);

  // PHASE II
  // Admin Accepts User:
  // 1. put admin in same room as user
  // 2. tell user we joined
  // 3. tell other admins to remove user from their lists
  socket.on('accept user', (user_room_id) => {
    // TODO what if user_room_id no longer exists
    socket.join(user_room_id);
    socket.broadcast.to(user_room_id).emit('admin matched');
	socket.user_room_id = user_room_id;
    // socket.broadcast.to(all_admins).emit('user matched', user_room_id);
    socket.broadcast.emit('user matched', user_room_id);

  });

  // PHASE III
  // recieve chat message from admin or user, and send it to a specific user's room
  socket.on('chat message', function(data) {
    let message = data['message'];
    let reciever = data['target'];
    socket.broadcast.to(reciever).emit('chat message', message);
  });

  // PHASE IV
  // User Disconnects:
  rooms = []
  socket.on('disconnect', () => {
	console.log(socket.id + ' (' + socket.role + ') disconnected.');
    var user_room_id = socket.id;
    var room = io.sockets.adapter.rooms[user_room_id];

    if (room) {
      // room exists, either admin or user left in room, send disconnect
      // socket.broadcast.to(user_room_id).emit('user disconnect', user_room_id);
    }
	else {
      // room DNE, no one else connected, user was pending
      // TODO what if admin disconnected first, dont need to send 'accept user'
      // TODO socket.broadcast.to(all_admins).emit('user matched', user_room_id);
      socket.broadcast.emit('user matched', user_room_id);
    }


	if (socket.role == 'user') {
		// user left before admin
		console.log('user left');
		socket.broadcast.to(user_room_id).emit('user disconnect', user_room_id);
	}
	else if (socket.role == 'admin' && socket.user_room_id) {
		// admin accidentally left while still connected to user
		console.log('ADMIN LEFT');
		socket.broadcast.to(socket.user_room_id).emit('admin disconnect');
		socket.broadcast.to(socket.user_room_id).emit('wait for admin reconnect');
	}
	else if (socket.role == 'admin') {
		// admin left, and was not connected with anyone
	}
	else {
		console.log('ERROR');
	}




  });

  socket.on('assign as user', () => {
	socket.role = 'user';
  });

  socket.on('assign as admin', () => {
	socket.role = 'admin';
  });

  socket.on('user waiting for admin reconnect', (socket_id) => {
	//Object.keys(io.sockets.sockets).
	// var nsp = io.of('/admin');
	console.log('USER WAITING FOR ADMIN RECONNECT')
	socket.broadcast.emit('user waiting reconnect', socket_id);
  });


});


server.listen(3000, () => console.log('App is running on port 3000'));
