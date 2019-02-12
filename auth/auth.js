const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const sqlite3 = require('sqlite3');
const nodemailer = require('nodemailer');
const querystring = require('querystring');
const assert = require('assert');

const DB_NAME = 'db.sqlite3'

let db = new sqlite3.Database(DB_NAME);

// TODO add schema version check
// TODO add register routes
// TODO add testing

///////////////////////////////////////////////////////////////////////
//        DB Scrubber
///////////////////////////////////////////////////////////////////////

const SCRUBBER_INTERVAL = process.env.scrubInt || 5; // hours

let db_scrubber = setInterval(() => {
  let timestamp = Date.now();
  db.run('DELETE FROM login_attempts WHERE next_attempt < ?', timestamp, (err) => {
    if (err) throw err;
  });

  db.run('DELETE FROM change_requests WHERE expires < ?', timestamp, (err) => {
    if (err) throw err;
  });
}, SCRUBBER_INTERVAL * 3600000);

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

function start_password_change(email) {
  assert(typeof email === 'string');
  let date = new Date();
  let expires = date.setMinutes(date.getMinutes() + VALID_DURATION);
  let request = crypto.randomBytes(16).toString('hex');

  db.get('SELECT username FROM users WHERE email = ?', email, (err, row) => {
    if (err) throw err;

    // TODO maybe alert user attempt was bad?
    if (!row) {
      return;
    }

    db.run('REPLACE INTO change_requests VALUES (?, ?, ?)', request, expires, row.username, (err) => {
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

  db.get('SELECT username, expires FROM change_requests WHERE request = ?', request, (err, row) => {
    if (err) throw err;

    if (row) {
      if (timestamp < row.expires) {
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
//        IP Address Limiting
///////////////////////////////////////////////////////////////////////

// TODO make these configurable (document configurability)
const MAX_ATTEMPTS = process.env.maxAttempts || 10;
const RETRY_WAIT_DURATION = process.env.retryWait || 5; // minutes

function delete_login_attempt(ip) {
  assert(typeof ip === 'string');

  db.run('DELETE FROM login_attempts WHERE ip = ?', ip, (err) => {
    if (err) throw err;
  });
}

function increment_attempt(ip, prev_attempts, cb) {
  assert(typeof ip === 'string');
  assert(typeof prev_attempts === 'number');

  let date = new Date();
  let attempts = prev_attempts + 1;
  let next_attempt = date.setMinutes(date.getMinutes() + RETRY_WAIT_DURATION);

  db.run('REPLACE INTO login_attempts (ip, attempts, next_attempt) VALUES (?, ?, ?)', ip, attempts, next_attempt, (err) => {
    if (err) throw err;

    return cb();
  });
}

function can_attempt_login(ip, cb) {
  assert(typeof ip === 'string');
  let timestamp = Date.now();

  db.serialize(() => {
    // insert or replace handles if this is the first attempt and no entry exists
    //
    // ip value is always just the passed in ip
    //
    // attempts is incremented only when there was a previous attempt and when
    //          we haven't waited long enough. if we haven't attempted login 
    //          before or if we've waited long enough, set attempts to 1
    //
    // next_attempt is adjusted only when there was not a previous attempt or
    //              if we are below the max attempts. if we have attempted 
    //              login before and if we've already tried more than allowed, 
    //              we leave the timestamp unchanged

    db.run('REPLACE INTO login_attempts (ip, attempts, next_attempt) \
            VALUES (?,\
                    CASE WHEN EXISTS (SELECT 1 FROM login_attempts WHERE ip = ?) AND \
                              (SELECT next_attempt FROM login_attempts WHERE ip = ?) > ? \
                         THEN (SELECT attempts FROM login_attempts WHERE ip = ?) + 1 \
                         ELSE 1 \
                    END,\
                    CASE WHEN EXISTS (SELECT 1 FROM login_attempts WHERE ip = ?) AND \
                              (SELECT attempts FROM login_attempts WHERE ip = ?) > ? \
                         THEN (SELECT next_attempt FROM login_attempts WHERE ip = ?) \
                         ELSE ? \
                    END)', 
           ip, ip, ip, timestamp, ip, ip, ip, MAX_ATTEMPTS, ip, timestamp + RETRY_WAIT_DURATION * 60 * 1000, (err) => {
      if (err) throw err;
    });

    db.get('SELECT attempts, next_attempt FROM login_attempts WHERE ip = ?', ip, (err, row) => {
      if (err) throw err;

      if (!row) throw new Error('This isn\'t possible');

      // we only need to check attempts because the query above resets attempts when enough time has elapsed
      if (row.attempts <= MAX_ATTEMPTS) {
        // console.log(ip + ' allowed attempt, this is attempt ' + (row.attempts + 1));
        return cb(true);
      }
      
      // can't log in yet, wait time milliseconds
      // console.log(ip + ' denied attempt');
      let wait_time = row.next_attempt - timestamp;
      return cb(false, wait_time);
    });
  });
}

module.exports.can_attempt_login = can_attempt_login;
module.exports.delete_login_attempt = delete_login_attempt;

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
