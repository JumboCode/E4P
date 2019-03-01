const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const auth = require('./auth/auth');
const adminRoutes = require('./routes/adminRoutes');

///////////////////////////////////////////////////////////////////////
//        Passport Config
///////////////////////////////////////////////////////////////////////

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(auth.strategy));
passport.serializeUser(auth.serialize);
passport.deserializeUser(auth.deserialize);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// initialize admin id array
let admins = [];
let currentConversations = [];

function removeConversation(room) {
  currentConversations = currentConversations.filter((ele) => {
    return ele.room != room;
  });
}

///////////////////////////////////////////////////////////////////////
//        Server Configuration
///////////////////////////////////////////////////////////////////////

// Redirect http requests to https when in production
if (app.get('env') == 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

///////////////////////////////////////////////////////////////////////
//        Routes
///////////////////////////////////////////////////////////////////////

app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});

app.get('/help', (req, res) => {
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

app.post('/admin', adminRoutes.ensureAuthenticated, (req, res) => {
  admins.push(req.body.admin);
  res.json(currentConversations);
});

///////////////////////////////////////////////////////////////////////
//        Sockets
///////////////////////////////////////////////////////////////////////
let overflow_id = 0;
let icons = [
  'bear', 'ox', 'flamingo', 'panda', 'giraffe', 'raccoon', 'chimpanzee', 'bullhead',
  'doe', 'mandrill', 'badger', 'squirrel', 'rhino', 'dog', 'monkey', 'lynx',
  'brownbear', 'marmoset', 'funnylion', 'deer', 'zebra', 'meerkat', 'elephant', 'cat',
  'hare', 'puma', 'owl', 'antelope', 'lion', 'fox', 'wolf', 'hippo'
];
let reconnectionTimeouts = {};

io.on('connection', (socket) => {
  // PHASE I
  socket.on('user connect', () => {
    console.log(socket.id);
    if (icons.length == 0) {
      overflow_id++;
      socket.icon = overflow_id.toString();
    } else {
      socket.icon = icons.splice(Math.floor(Math.random() * icons.length), 1)[0];
    }

    for (let admin of admins) {
      socket.broadcast.to(admin).emit('user waiting', socket.id, socket.icon);
    }
    currentConversations.push(
      { user: socket.id,
        icon: socket.icon,
        room: socket.id,
        accepted: false,
        connected: true,
        connected_admin: null
      });
  });

  // PHASE II
  // Admin Accepts User:
  // 1. put admin in same room as user
  // 2. tell user we joined
  // 3. tell other admins to remove user from their lists
  socket.on('accept user', (user_room_id) => {
    // TODO what if user_room_id no longer exists
    socket.join(user_room_id);

    for (let conversation of currentConversations) {
      if (conversation.room === user_room_id) {
        conversation.accepted = true;
        conversation.connected_admin = socket.id;
      }
    }
    console.log(currentConversations);
    console.log('sending admin matched to:');
    console.log(user_room_id);

    socket.broadcast.to(user_room_id).emit('invalid');
    socket.broadcast.to(user_room_id).emit('admin matched');
    for (let admin of admins) {
      socket.broadcast.to(admin).emit('user matched', user_room_id);
    }
  });

  // PHASE III
  // receive chat message from admin or user, and send it to a specific user's room
  socket.on('chat message', (data) => {
    // console.log(data.message);

    let message = data['message'];
    let receiver = data['room'];

    console.log(message);
    console.log(receiver);

    // console.log('receiver: ' + receiver);
    socket.broadcast.to(receiver).emit('chat message', {message: message, room: receiver});
  });

  // PHASE IV
  // User Disconnects:
  socket.on('disconnect', () => {
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

    // Disconnect user ID from room
    for (let conversation of currentConversations) {
      if (conversation.user === user_room_id) {
        conversation.connected = false;
        console.log('conversation disconnected');
        // TODO: After user reconnect is implemented, we'll want to delay this
        //       removing for some time
        reconnectionTimeouts[conversation.room] = setTimeout(() => {
          delete reconnectionTimeouts[conversation.room];
          removeConversation(conversation.room);
        }, process.env.DISCONNECT_GRACE_PERIOD || 60000);
      }
      if (conversation.connected_admin == user_room_id) {
        // Admin of this conversation is disconnecting
        console.log('disconnecting admin from conversation');

        conversation.connected_admin = null;
        conversation.accepted = false;
        for (let admin of admins) {
          socket.broadcast.to(admin).emit('user unmatched', conversation);
        }
      }
    }
    console.log(currentConversations);
  });

  socket.on('user reconnect', (old_room_id) => {
    let foundUser = false;
    console.log('Old socket ID: ' + old_room_id);
    console.log('New socket ID: ' + socket.id);

    for (let conversation of currentConversations) {
      if (conversation.room === old_room_id) {
        clearTimeout(reconnectionTimeouts[conversation.room]);
        delete reconnectionTimeouts[conversation.room];
        foundUser = true;
        console.log('found user\'s old room');
        socket.join(conversation.room);
        conversation.user = socket.id;
        // socket.broadcast.to(socket.id).emit('admin matched');
        socket.emit('reconnected with old socket id');

      }
    }

    console.log('foundUser: ');
    console.log(foundUser);

    if (!foundUser) {
      console.log('invalid old socket id, current id:');
      console.log(socket.id);
      console.log('sending message now');
      socket.emit('invalid old socket id');
    }
    console.log(currentConversations);
  });

  //User Typing Event:
  socket.on('typing', (data) => {
    let receiver = data['room'];
    socket.broadcast.to(receiver).emit('typing', {room: receiver});
  });

  socket.on('stop typing', (data) => {
    let receiver = data['room'];
    socket.broadcast.to(receiver).emit('stop typing', {room: receiver});
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Node app is running on port 3000');
});

module.exports = app;
module.exports.admins = admins;
module.exports.currentConversations = currentConversations;
