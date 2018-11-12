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

var db = mongoose.connection;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/admin', { useNewUrlParser: true });

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'secret',
				  resave: true,
    			  saveUninitialized: true}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

///////////////////////////////////////////////////////////////////////
//        Passport Config
///////////////////////////////////////////////////////////////////////
// TODO: uncomment these functions to set up the Admin model authentication stuff
var Admin = require('./models/adminModel');
passport.use(new LocalStrategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { 
    return next(); 
  }
  res.redirect('/login');
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());


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

app.get('/', function(req, res) {
	res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});

app.get('/admin', ensureAuthenticated, function(req, res) {
	res.sendFile('admin.html', {root: path.join(__dirname, 'public')});
});

app.get('/login', function(req, res) {
  res.sendFile('login_page.html', {root: path.join(__dirname, 'public')});
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
  res.redirect('/admin');
});

// TODO make logout accessible on the front end, do some other stuff to check not abandoning chats?
app.get('/logout', ensureAuthenticated, function(req, res) {
  req.logout();
  res.redirect('/login');
});

// TODO figure out what to do with registering users
app.get('/register', /*ensureAuthenticated,*/ function(req, res) {
  res.sendFile('register_page.html', {root: path.join(__dirname, 'public')});
});

app.post('/register', /*ensureAuthenticated,*/ function(req, res) {
  Admin.register(new Admin({username : req.body.username }), req.body.password, function(err, admin) {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/help', function(req, res) {
  res.sendFile('help_page.html', {root: path.join(__dirname, 'public')});
});

app.get('/:folder/:file', function(req, res) {
  res.sendFile(req.params.file, {root: path.join(__dirname, 'public', req.params.folder)});
});

///////////////////////////////////////////////////////////////////////
//        Sockets
///////////////////////////////////////////////////////////////////////

io.on('connection', (socket) => {
  // console.log('CONNECT ' + socket.id);
  
  // PHASE I
  // socket.broadcast.to(all_admins).emit('user waiting', socket.id);
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
    // socket.broadcast.to(all_admins).emit('user matched', user_room_id);
    socket.broadcast.emit('user matched', user_room_id);
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
    // console.log('DISCONNECT ' + socket.id)
    var user_room_id = socket.id;
    var room = io.sockets.adapter.rooms[user_room_id];
    if (room) {
      // room exists, either admin or user left in room, send disconnect
      socket.broadcast.to(user_room_id).emit('user disconnect', user_room_id);
    } else {
      // room DNE, no one else connected, user was pending
      // TODO what if admin disconnected first, dont need to send 'accept user'
      // TODO socket.broadcast.to(all_admins).emit('user matched', user_room_id);
      socket.broadcast.emit('user matched', user_room_id);
    }
  });
});

server.listen(process.env.PORT || 3000, function() {
  	console.log('Node app is running on port 3000');
});

module.exports = app
