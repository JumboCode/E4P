const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const bcrypt = require("bcryptjs");
const sqlite3 = require('sqlite3');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const adminRoutes = require('./routes/adminRoutes');

///////////////////////////////////////////////////////////////////////
//        Passport Config
///////////////////////////////////////////////////////////////////////

var db = new sqlite3.Database('db.sqlite3');

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
  db.get('SELECT salt FROM users WHERE username = ?', username, (err, row) => {
    if (!row) return done(null, false);
    var hash = bcrypt.hashSync(password, row.salt);
    db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, (err, row) => {
      if (!row) return done(null, false);
      return done(null, row);
    });
  });
}));

passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT username, id FROM users WHERE id = ?', id, (err, row) => {
    if (!row) return done(null, false);
    return done(null, row);
  });
});

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

app.get('/img/:file', (req, res) => {
  res.sendFile(req.params.file, {root: path.join(__dirname, 'public', 'img')});
});

app.post('/admin', function(req, res) {
  admins.push(req.body.admin);
});

///////////////////////////////////////////////////////////////////////
//        Sockets
///////////////////////////////////////////////////////////////////////
let overflow_id = 0;
let icons = ["bear", "ox", "flamingo", "panda", "giraffe", "raccoon", "chimpanzee", "bullhead",
             "doe", "mandrill", "badger", "squirrel", "rhino", "dog", "monkey", "lynx",
             "brownbear", "marmoset", "funnylion", "deer", "zebra", "meerkat", "elephant", "cat",
             "hare", "puma", "owl", "antelope", "lion", "fox", "wolf", "hippo"];

io.on('connection', (socket) => {
  // PHASE I
  socket.on('user connect', () => {
    if (icons.length == 0) {
      overflow_id++;
      socket.icon = overflow_id.toString();
    } else {
      socket.icon = icons.splice(Math.floor(Math.random() * icons.length), 1)[0];
    }

    for (let admin of admins) {
      socket.broadcast.to(admin).emit('user waiting', socket.id, socket.icon);
    }
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
    for (let admin of admins) {
      socket.broadcast.to(admin).emit('user matched', user_room_id);
    }
  });

  // PHASE III
  // receive chat message from admin or user, and send it to a specific user's room
  socket.on('chat message', function(data) {
    // console.log(data.message);

    let message = data['message'];
    let receiver = data['room'];
    // console.log('receiver: ' + receiver);
    socket.broadcast.to(receiver).emit('chat message', {message: message, room: receiver});
  });

  // PHASE IV
  // User Disconnects:
  socket.on('disconnect', () => {
    // console.log(socket.id + ' DISCONNECTED')
    var user_room_id = socket.id;

    if (typeof socket.icon !== 'undefined' && isNaN(parseInt(socket.icon))) {
      icons.push(socket.icon);
    }
    var room = io.sockets.adapter.rooms[user_room_id];
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
  });

  //User Typing Event:
  socket.on('typing', function(data) {
    let receiver = data['room']; 
    socket.broadcast.to(receiver).emit('typing', {room: receiver});
  }); 

  socket.on('stop typing', function(data) {
    let receiver = data['room']; 
    socket.broadcast.to(receiver).emit('stop typing', {room: receiver}); 
  }); 

});

server.listen(process.env.PORT || 3000, function() {
  	console.log('Node app is running on port 3000');
});

module.exports = app;
module.exports.admins = admins;
