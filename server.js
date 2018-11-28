const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const passport = require('passport');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const adminRoutes = require('./routes/adminRoutes');

///////////////////////////////////////////////////////////////////////
//        Passport Config
///////////////////////////////////////////////////////////////////////

if (process.env.NODB) {
  console.log('NODB flag set, running without database and no authentication!');
} else {
  var db = mongoose.connection;
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/E4P', { useNewUrlParser: true });

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());

  var Admin = require('./models/adminModel');
  passport.use(new LocalStrategy(Admin.authenticate));
  passport.serializeUser(Admin.serializeUser);
  passport.deserializeUser(Admin.deserializeUser);
}
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// initialize admin id array
let admins = [];

///////////////////////////////////////////////////////////////////////
//        Server Configuration
///////////////////////////////////////////////////////////////////////

// Redirect http requests to https when in production
if (app.get('env') == 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`)
    } else {
      next();
    }
  });
};

///////////////////////////////////////////////////////////////////////
//        Routes
///////////////////////////////////////////////////////////////////////

app.use('/admin', adminRoutes);

app.get('/', function(req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});

app.get('/help', function(req, res) {
  res.sendFile('help_page.html', {root: path.join(__dirname, 'public')});
});

app.get('/css/:file', (req, res) => {
  res.sendFile(req.params.file, {root: path.join(__dirname, 'public', 'css')});
});

app.get('/javascript/:file', (req, res) => {
  res.sendFile(req.params.file, {root: path.join(__dirname, 'public', 'javascript')});
});

app.post('/admin', function(req, res) {
  admins.push(req.body.admin);
});

///////////////////////////////////////////////////////////////////////
//        Sockets
///////////////////////////////////////////////////////////////////////

io.on('connection', (socket) => {
  // PHASE I
  socket.on('user connect', () => {

    // console.log('user connect: ' + socket.id)
  	socket.broadcast.emit('user waiting', socket.id);
  });

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
    for (let admin of admins) {
      socket.broadcast.to(admin).emit('user matched', user_room_id);
    }

  });

  // PHASE III
  // recieve chat message from admin or user, and send it to a specific user's room
  socket.on('chat message', function(data) {
    // console.log(data.message);

    let message = data['message'];
    let reciever = data['room'];
    // console.log('reciever: ' + reciever);
    socket.broadcast.to(reciever).emit('chat message', {message: message, room: reciever});
  });

  // PHASE IV
  // User Disconnects:
  socket.on('disconnect', () => {
    // console.log(socket.id + ' DISCONNECTED')
    var user_room_id = socket.id;
    var room = io.sockets.adapter.rooms[user_room_id];
    console.log("Socket that dc'd: " + user_room_id);
    console.log("Role: " + socket.role);
    if (room) {
      // room exists, either admin or user left in room, send disconnect
      socket.broadcast.to(user_room_id).emit('user disconnect', user_room_id);
    } else {
      // room DNE, no one else connected, user was pending
      // TODO what if admin disconnected first, dont need to send 'accept user'
      for (let admin of admins) {
        socket.broadcast.to(admin).emit('user matched', user_room_id);
      }
    }
    // Removes admin ID from admins array when an admin disconnects
    for (let i = 0; i < admins.length; i++) {
      if (admins[i] == user_room_id) {
        admins.splice(i, 1);
      }
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
        console.log('ADMIN LEFT but not connected to anyone');
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
});



server.listen(process.env.PORT || 3000, function() {
  	console.log('Node app is running on port 3000');
});

module.exports = app;
module.exports.admins = admins;
