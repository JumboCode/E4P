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
});

server.listen(3000, () => console.log('App is running on port 3000'));