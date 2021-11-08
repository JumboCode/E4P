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

// Parse process.env.operatingHours to figure out start hour and end hour
const operatingHoursString = process.env.operatingHours;
const matches = /(\d{1,2})(am|pm)\s*[-–—]\s*(\d{1,2})(am|pm)/i.exec(operatingHoursString);
const startHour = parseInt(matches[1]);
const startAmPm = matches[2];
const endHour = parseInt(matches[3]);
const endAmPm = matches[4];

function hourWithAmPmTo24H(hour, amPm) {
  if (amPm == 'pm' && hour != 12) {
    return hour + 12;
  } else if (amPm == 'am' && hour == 12) {
    return 0;
  }
  return hour;
}

const START_HOUR = hourWithAmPmTo24H(startHour, startAmPm);
const END_HOUR = hourWithAmPmTo24H(endHour, endAmPm);

///////////////////////////////////////////////////////////////////////
//        Passport Config
///////////////////////////////////////////////////////////////////////

app.use(bodyParser.urlencoded({extended: true}));
app.use(session(
  { secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge : 3600000 * 24 } // 24 hours
  }));
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
let unsentMessageBuffer = {};

function removeConversation(room) {
  currentConversations = currentConversations.filter((ele) => {
    return ele.room != room;
  });
  delete unsentMessageBuffer[room];

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
  const standardAvailability = (now.getHours() < END_HOUR || now.getHours() >= START_HOUR);
  const isAvailable = !DOAVAILCHECK || (ISAVAILABLE && standardAvailability);
  res.json({isAvailable: isAvailable});
});

app.get('/keepalive', (req, res) => {
  res.sendStatus(200);
});

app.get('/hours', (req, res) => {
  res.json({hours: process.env.operatingHours})
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

app.get('/img/icons/:icon', (req, res) => {
  res.sendFile(req.params.icon, {root: path.join(__dirname, 'public', 'img', 'icons')});
});

app.get('/audio/:file', (req, res) => {
  res.sendFile(req.params.file, {root: path.join(__dirname, 'public', 'audio')});
});

app.post('/admin', adminRoutes.ensureAuthenticated, (req, res) => {
  admins.push(req.body.admin);
  res.json(currentConversations);
});

app.post('/admin/removeConversation', adminRoutes.ensureAuthenticated, (req, res) => {
  removeConversation(req.body.userId);
  res.sendStatus(200);
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
        active: false,
        everAccepted: false,
        connected: true,
        connected_admin: null,
        messages: [],
        readTo: new Date(0)
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
        conversation.active = true;
        // everAccepted will never be set to false again
        conversation.everAccepted = true;
        conversation.connected_admin = socket.id;
      }
    }

    socket.broadcast.to(user_room_id).emit('invalid');
    socket.broadcast.to(user_room_id).emit('admin matched');
    for (let admin of admins) {
      socket.broadcast.to(admin).emit('user matched', user_room_id);
    }
  });

  // PHASE III
  // receive chat message from admin or user, and send it to a specific user's room
  socket.on('chat message', (data) => {
    // Add message to conversation
    for (let conversation of currentConversations) {
      if (conversation.room === data.room) {
        conversation.messages.push(data);
        if (data.role == 'user') {
          if (conversation.connected_admin === null) {
            // no specific admin connected, update all admins with the new message
            admins.forEach((adminId) => {
              socket.broadcast.to(adminId).emit('chat message', data);
            });
          } else {
            // send message to the specific connected admin
            socket.broadcast.to(data.room).emit('chat message', data);
          }
        } else {
          if (conversation.connected) {
            socket.broadcast.to(data.room).emit('chat message', data);
          } else {
            if (typeof unsentMessageBuffer[data.room] === 'undefined') {
              unsentMessageBuffer[data.room] = [];
            }
            unsentMessageBuffer[data.room].push(data);
          }
        }
      }
    }
  });

  // PHASE IV
  // User Disconnects:
  socket.on('disconnect', () => {
    let socket_is_user = false;

    // iterate through all the current conversations to figure out who's disconnecting
    for (let conversation of currentConversations) {
      if (conversation.user === socket.id) {
        // disconnecting socket was a user
        /*
         * If we know the disconnecting socket was a user in a room,
         * use conversation.room as the original socketid that admins are tracking.
         * Let room know if user has been accepted, else tell all admins.
         */
        if (conversation.everAccepted || conversation.connected_admin != null) {
          // notify anyone else in the room the user left
          io.to(conversation.room).emit('user disconnect', conversation.room);
        } else {
          // user was never accepted so let admins all admins know
          for (let admin of admins) {
            io.to(admin).emit('user disconnect', conversation.room);
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
        }, process.env.DISCONNECT_GRACE_PERIOD || 60 * 60000); // 60 minutes
      } else if (conversation.connected_admin === socket.id) {
        // disconnecting socket was an admin
        conversation.connected_admin = null;
        conversation.active = false;

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

    for (let conversation of currentConversations) {
      if (conversation.room === old_room_id) {
        clearTimeout(reconnectionTimeouts[conversation.room]);
        delete reconnectionTimeouts[conversation.room];
        foundUser = true;
        socket.join(conversation.room);
        conversation.user = socket.id;
        conversation.connected = true;
        socket.emit('reconnected with old socket id');

        if (conversation.connected_admin === null) {
          // no specific admin connected, update all admins with the new message
          admins.forEach((adminId) => {
            socket.broadcast.to(adminId).emit('user reconnect', conversation.room);
          });
        } else {
          // send message to the specific connected admin
          socket.broadcast.to(conversation.room).emit('user reconnect', conversation.room);
        }

        if (conversation.everAccepted == true) {
          socket.emit('admin matched');
        }

        if (typeof unsentMessageBuffer[conversation.room] !== 'undefined') {
          for (let message of unsentMessageBuffer[conversation.room]) {
            socket.emit('chat message', message);
          }
          unsentMessageBuffer[conversation.room] = [];
        }
      }
    }

    if (!foundUser) {
      socket.emit('invalid old socket id');
    }
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
    currentConversations.forEach((conv) => {
      if (conv.room === data.room) {
        conv.readTo = data.ts;
        if (conv.connected_admin === null) {
          admins.forEach((adminId) => {
            socket.broadcast.to(adminId).emit('read to timestamp', data);
          });
        } else {
          socket.broadcast.to(data.room).emit('read to timestamp', data);
        }
      }
    });
  });

  socket.on('sound on', () => {
    socket.emit('sound on');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Node app is running on port 3000');
});

module.exports = app;
module.exports.admins = admins;
module.exports.currentConversations = currentConversations;
module.exports.unsentMessageBuffer = unsentMessageBuffer;
