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

  socket.on('message', (message) => {
    io.emit('message', message);
  });

  // Things We Receive From Admin

  // Admin Accepts User:
  // 1. put admin in same room as user
  // 2. tell other admins to bug off
  // 3. tell user we joined
  socket.on('accept user', (user_room_id) => {
    socket.join(user_room_id);
    // socket.broadcast.to(all_admins).emit('user matched', user_room_id); // Put Me Back after figuring out all_admins
    socket.broadcast.emit('user matched', user_room_id); // Remove Me after figuring out all_admins
    socket.broadcast.to(user_room_id).emit('admin matched');
  });

  // User Disconnects:
  socket.on('disconnect', () => {
    var user_room_id = socket.id;
    var num_connected = io.sockets.adapter.rooms[user_room_id].length;
    if (num_connected == 0) {
      // no one else connected, user was pending
      // TODO what if admin disconnected first, dont need to send 'accept user'
      // socket.broadcast.to(all_admins).emit('user matched', user_room_id);
      socket.broadcast.emit('user matched', user_room_id);
    } else {
      // either admin or user left in room, send disconnect
      socket.broadcast.to(user_room_id).emit('user disconnect');
    }
  });
});

server.listen(3000, () => console.log('App is running on port 3000'));