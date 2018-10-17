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

// TODO Look into socket.io p2p?

io.on('connection', (socket) => {
  console.log('A user connected.' + socket.id);

  socket.on('message', (message) => {
    io.emit('message', message);
  });

  // socket.broadcast.to(all_admins).emit('user waiting', socket.id);
  socket.on('user connect', (user_connect) => { 
  	socket.broadcast.emit('user waiting', socket.id);
  }); 

});


server.listen(3000, () => console.log('App is running on port 3000'));