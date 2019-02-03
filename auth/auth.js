const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const sqlite3 = require('sqlite3');
const nodemailer = require('nodemailer');
const querystring = require('querystring');
const assert = require('assert');

var db = new sqlite3.Database('db.sqlite3');

///////////////////////////////////////////////////////////////////////
//        Password Change
///////////////////////////////////////////////////////////////////////

const TIMEOUT = 5; //minutes
const URL = 'http://localhost:3000/admin/change?'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    // TODO remove hard coded elements in dev
    user: process.env.email || 'steven.dev.email@gmail.com',
    clientId: process.env.emailId || '345888905186-junsh1mfvrurcd5t2m5kapkdggi2e6tf.apps.googleusercontent.com',
    clientSecret: process.env.emailSecret || 'OGbdzRpdmF-edJk1U4N6dSw4',
    refreshToken: process.env.emailRefresh || '1/TIEIoYkYQoHoaDEsc3dE3J90n8wiHPbc6Xx2kKHPPRY',
  }
});

function sendMail(username, email, request) {
  let query = querystring.stringify({ request: request });
  transporter.sendMail({
    to: email,
    subject: 'Ears for Peers Password Change',
    html: 'Hi ' + username + ',<br><br>Someone has requested a password change for your account.<br>If this was you, <a href="' + URL + query + '">click here to change your password</a>.',
  }, (err, res) => {
    if (err) throw err;
  });
}

function start_password_change(email) {
  assert(typeof email === 'string');
  let date = new Date();
  let invalid = date.setMinutes(date.getMinutes() + TIMEOUT);
  let request = crypto.randomBytes(16).toString('hex');

  db.get('SELECT username FROM users WHERE email = ?', email, (err, row) => {
    if (err) throw err;

    // TODO maybe alert user attempt was bad?
    if (!row) {
      return;
    }

    db.run('REPLACE INTO change_requests VALUES (?, ?, ?)', request, invalid, row.username, (err) => {
      if (err) throw err;

      sendMail(row.username, email, request);
    });
  });
}

// if there is valid request pending,
//    calls the callback with the username associated with the request
// if there is not a valid request,
//    calls the callback with no arguments
//    (any attempt to resolve param in cb will result in 'undefined')
function valid_password_change(request, cb) {
  assert(typeof request === 'string');
  let timestamp = Date.now()

  db.get('SELECT username, invalid FROM change_requests WHERE request = ?', request, (err, row) => {
    if (err) throw err;

    if (row) {
      if (timestamp < row.invalid) {
        return cb(row.username);
      }

      db.run('DELETE FROM change_requests WHERE request = ?', request, (err) => {
        if (err) throw err;
      });
    }

    return cb();
  });
}

function change_password(username, password) {
  assert(typeof username === 'string');
  assert(typeof password === 'string');

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
  assert(typeof username === 'string');
  assert(typeof password === 'string');

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
  assert(typeof username === 'string');

  db.get('SELECT username FROM users WHERE username = ?', username, (err, row) => {
    if (!row) return done(null, false);
    return done(null, row);
  });
}

module.exports.strategy = strategy;
module.exports.serialize = serialize;
module.exports.deserialize = deserialize;
