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

var ISAVAILABLE = (process.env.ISAVAILABLE === 'true' ? true : (process.env.ISAVAILABLE === 'false' ? false : true));
const DOAVAILCHECK = (process.env.DOAVAILCHECK === 'true' ? true : false);
app.get('/available', (req, res) => {
  let now = new Date();
  const standardAvailability = (now.getHours() < 7 || now.getHours() > 19);
  const isAvailable = !DOAVAILCHECK || (ISAVAILABLE && standardAvailability);
  res.json({isAvailable: isAvailable});
});

app.post('/setavailable', adminRoutes.ensureAuthenticated, (req, res) => {
  ISAVAILABLE = req.body.isAvailable;
  res.sendStatus(200);
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

app.get('/audio/:file', (req, res) => {
  res.sendFile(req.params.file, {root: path.join(__dirname, 'public', 'audio')});  
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
    let timestamp = data['timestamp'];

    console.log(message, receiver, timestamp);

    // console.log('receiver: ' + receiver);
    socket.broadcast.to(receiver).emit('chat message', {
      message: message,
      room: receiver,
      timestamp: timestamp
    });
  });

  // PHASE IV
  // User Disconnects:
  socket.on('disconnect', () => {
    let socket_is_user = false;

    // iterate through all the current conversations to figure out who's disconnecting
    for (let conversation of currentConversations) {
      if (conversation.user === socket.id) {
        // disconnecting socket was a user
        console.log('disconnecting user from conversation');
        
        /* 
         * if we know the disconnecting socket was a user in a room, 
         * use conversation.room as the original socketid that admins are tracking
         */

        if (conversation.accepted) {
          // user was previously accepted so notify anyone else in the room the user left
          io.to(conversation.room).emit('user disconnect', conversation.room);
        } else {
          // user was not accepted so we can just let admins remove from menus
          for (let admin of admins) {
            io.to(admin).emit('user matched', conversation.room);
          }
        }
        
        socket_is_user = true;
        conversation.connected = false;

        // delete the room after a delayed time
        reconnectionTimeouts[conversation.room] = setTimeout(() => {
          // tell anyone connected to room the user didnt reconnect in the allowed time
          io.to(conversation.room).emit('user gone for good', conversation.room);

          // remove related objects from data structs
          delete reconnectionTimeouts[conversation.room];
          removeConversation(conversation.room);
          let room = io.sockets.adapter.rooms[conversation.room];
          if (room) {
            for (let id in room.sockets) {
              io.sockets.connected[id].leave(conversation.room);
            }
          }

          // recycle icon
          if (typeof socket.icon !== 'undefined' && isNaN(parseInt(socket.icon))) {
            icons.push(socket.icon);
          }
        }, process.env.DISCONNECT_GRACE_PERIOD || 60000);
      } else if (conversation.connected_admin === socket.id) {
        // disconnecting socket was an admin
        console.log('disconnecting admin from conversation');

        conversation.connected_admin = null;
        conversation.accepted = false;

        // let other admins pick up the conversation
        for (let admin of admins) {
          socket.broadcast.to(admin).emit('user unmatched', conversation);
        }
      }
    }

    // on top of notifying any connected users their admin is gone,
    // remove the admin from the related admins data structs
    if (!socket_is_user) {
      for (let i = 0; i < admins.length; i++) {
        if (admins[i] == socket.id) {
          admins.splice(i, 1);
        }
      }
    }
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
        io.to(conversation.room).emit('user reconnect', conversation.room);
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

  socket.on('read to timestamp', (data) => {
    let receiver = data['room'];
    let timestamp = data['ts'];
    socket.broadcast.to(receiver).emit('read to timestamp', {room: receiver, ts: timestamp});
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Node app is running on port 3000');
});

module.exports = app;
module.exports.admins = admins;
module.exports.currentConversations = currentConversations;
