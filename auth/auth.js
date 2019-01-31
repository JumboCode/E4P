const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const sqlite3 = require('sqlite3');
const nodemailer = require('nodemailer');

var db = new sqlite3.Database('db.sqlite3');

///////////////////////////////////////////////////////////////////////
//        Password Change
///////////////////////////////////////////////////////////////////////

const TIMEOUT = 5; //minutes
const URL = 'http://localhost:3000/admin/change?request='

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'steven.dev.email@gmail.com',
    pass: '***REMOVED***'
  }
});

function sendMail(username, email, request) {
  transporter.sendMail({
    to: email,
    subject: 'Ears for Peers Password Change',
    html: 'Hi ' + username + ',<br><br>Someone has requested a password change for your account.<br>If this was you, <a href="' + URL + request + '">click here to change your password</a>.'
  }, (err, info) => {
    if (err) throw err;
  });
}

function start_password_change(username) {
  let date = new Date();
  let invalid = date.setMinutes(date.getMinutes() + TIMEOUT);
  let request = crypto.randomBytes(16).toString('hex');

  db.run('REPLACE INTO change_requests VALUES (?, ?, ?)', request, invalid, username, (err) => {
    if (err) throw err;
    
    db.get('SELECT email FROM users WHERE username = ?', username, (err, row) => {
      if (err) throw err;

      /*TODO maybe implement a better error for if we can't find username of someonet trying to initiate password change*/
      if (!row) console.log('user who initiated password change not found');

      sendMail(username, row.email, request);
    });
  });
}

// if there is valid request pending,
//    calls the callback with the username associated with the request
// if there is not a valid request,
//    calls the callback with no arguments
//    (any attempt to resolve param in cb will result in 'undefined')
function valid_password_change(request, cb) {
  let timestamp = Date.now()
  db.get('SELECT username, invalid FROM change_requests WHERE request = ?', request, (err, row) => {
    if (err) throw err;

    if (row && timestamp < row.invalid) {
      return cb(row.username);
    }

    return cb();
  });
}

function change_password(username, password) {
  // autogenerates salt with default of 10 rounds
  let hash = bcrypt.hashSync(password);

  db.run('UPDATE users SET password = ? WHERE username = ?', hash, username, (err) => {
    if (err) throw err;
  });

  db.run('DELETE FROM change_requests WHERE username = ?', username, (err) => {
    if (err) throw err;
  });
}

module.exports.start_password_change = start_password_change;
module.exports.valid_password_change = valid_password_change;
module.exports.change_password = change_password;

///////////////////////////////////////////////////////////////////////
//        Passport Functions
///////////////////////////////////////////////////////////////////////

function strategy(username, password, done) {
  db.get('SELECT username, password FROM users WHERE username = ?', username, (err, row) => {
    if (err) throw err;

    if (!row) return done(null, false);

    bcrypt.compare(password, row.password, (err, match) => {
      if (err) throw err;

      if (!match) return done(null, false);

      return done(null, row);
    });
  });
}

function serialize(user, done) {
  return done(null, user.username);
}

function deserialize(username, done) {
  db.get('SELECT username FROM users WHERE username = ?', username, (err, row) => {
    if (!row) return done(null, false);
    return done(null, row);
  });
}

module.exports.strategy = strategy;
module.exports.serialize = serialize;
module.exports.deserialize = deserialize;
