const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const sqlite3 = require('sqlite3');
const nodemailer = require('nodemailer');
const querystring = require('querystring');

var db = new sqlite3.Database('db.sqlite3');

///////////////////////////////////////////////////////////////////////
//        Password Change
///////////////////////////////////////////////////////////////////////

// TODO make these configurable (document configurability)
const VALID_DURATION = process.env.validDuration || 5; //minutes
const URL = (process.env.host || 'http://localhost:3000') + '/admin/change?'

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

function start_password_change(username) {
  let date = new Date();
  let expires = date.setMinutes(date.getMinutes() + VALID_DURATION);
  let request = crypto.randomBytes(16).toString('hex');

  db.run('REPLACE INTO change_requests VALUES (?, ?, ?)', request, expires, username, (err) => {
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
  db.get('SELECT username, expires FROM change_requests WHERE request = ?', request, (err, row) => {
    if (err) throw err;

    if (row) {
      if (Date.now() < row.expires) {
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
//        IP Address Limiting
///////////////////////////////////////////////////////////////////////

// TODO make these configurable (document configurability)
const MAX_ATTEMPTS = process.env.maxAttempts || 2;
const RETRY_WAIT_DURATION = process.env.retryWait || 5; // minutes
const ATTEMPT_SCRUBBER_INTERVAL = process.env.scrubInt || 5; // hours

let attempt_scrubber = setInterval(() => {
  let timestamp = Date.now();
  db.run('DELETE FROM login_attempts WHERE next_attempt < ?', timestamp, (err) => {
    if (err) throw err;
  });
}, ATTEMPT_SCRUBBER_INTERVAL * 3600000);

function delete_login_attempt(ip) {
  db.run('DELETE FROM login_attempts WHERE ip = ?', ip, (err) => {
    if (err) throw err;
  });
}

function increment_attempt(ip, prev_attempts) {
  let date = new Date();
  let attempts = prev_attempts + 1;
  let next_attempt = date.setMinutes(date.getMinutes() + RETRY_WAIT_DURATION);

  db.run('REPLACE INTO login_attempts (ip, attempts, next_attempt) VALUES (?, ?, ?)', ip, attempts, next_attempt, (err) => {
    if (err) throw err;
  });
}

function can_attempt_login(ip, cb) {
  db.get('SELECT attempts, next_attempt FROM login_attempts WHERE ip = ?', ip, (err, row) => {
    let timestamp = Date.now();

    if (err) throw err;

    // no previous attempt, log and allow
    if (!row) {
      // console.log(ip + ' allowed attempt, no previous attempt made');
      increment_attempt(ip, /*this is attempt number*/0);
      return cb(true);
    }

    // still under the maximum allowed attempts, increment, update time and allow
    if (row.attempts < MAX_ATTEMPTS) {
      // console.log(ip + ' allowed attempt, this is attempt ' + (row.attempts + 1));
      increment_attempt(ip, row.attempts);
      return cb(true);
    }

    // made too many attempts but waited alloted time, reset attempt count and allow
    if (row.next_attempt < timestamp) {
      // console.log(ip + ' allowed attempt, waited enough time');
      increment_attempt(ip, 0);
      return cb(true);
    }

    // can't log in yet, wait time milliseconds
    let wait_time = row.next_attempt - timestamp;
    return cb(false, wait_time);
  });
}

module.exports.can_attempt_login = can_attempt_login;
module.exports.delete_login_attempt = delete_login_attempt;

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
