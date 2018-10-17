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
    socket.join(user_room_id);
    socket.broadcast.to(user_room_id).emit('admin matched');
    // socket.broadcast.to(all_admins).emit('user matched', user_room_id);
    socket.broadcast.emit('user matched', user_room_id);
  });

  // PHASE III
  // recieve chat message from admin or user, and send it to a specific user's room
  socket.on('chat message', function(data) {
    console.log(data.message);

    let message = data['message'];
    let reciever = data['target'];
    console.log('reciever: ' + reciever);
    socket.broadcast.to(reciever).emit('chat message', message);
  });
});

server.listen(3000, () => console.log('App is running on port 3000'));
