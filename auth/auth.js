const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const querystring = require('querystring');
const assert = require('assert');

const SCHEMA_VERSION = 2;

if (process.env.NODB != 'true' && process.env.NODE_ENV != 'test') {
  const { Client } = require('pg');
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  db.connect();

  // TODO add register routes
  // TODO add testing

  ///////////////////////////////////////////////////////////////////////
  //        DB Schema Check
  ///////////////////////////////////////////////////////////////////////

  db.query('SELECT version FROM schema_version', (err, res) => {
    if (err) {
      // create table
      db.query('CREATE TABLE schema_version (version integer)', (err) => {
        if (err) throw err;
        db.query('INSERT INTO schema_version VALUES ($1)', [SCHEMA_VERSION], (err) => { if (err) throw err; });
      });
      db.query('CREATE TABLE users (username text primary key, password text, email text)', (err) => { if (err) throw err; });
      db.query('CREATE TABLE change_requests (request text unique, expires timestamptz, username text unique, foreign key(username) references users (username))', (err) => { if (err) throw err; });
      db.query('CREATE TABLE login_attempts (ip text unique, attempts integer, next_attempt timestamptz)', (err) => { if (err) throw err; });
    } else if (!res.rows[0] || res.rows[0].version != SCHEMA_VERSION) {
      // error bad schema version
      throw new Error('Database Schema Version Mismatch');
    }
  });

  ///////////////////////////////////////////////////////////////////////
  //        DB Scrubber
  ///////////////////////////////////////////////////////////////////////

  const SCRUBBER_INTERVAL = process.env.scrubInt || 5; // hours

  let db_scrubber = setInterval(() => {
    db.query('DELETE FROM login_attempts WHERE next_attempt < CURRENT_TIMESTAMP', (err) => {
      // console.log('scrubbed login attempts');
      if (err) throw err;
    });

    db.query('DELETE FROM change_requests WHERE expires < CURRENT_TIMESTAMP', (err) => {
      // console.log('scrubbed change requests');
      if (err) throw err;
    });
  }, SCRUBBER_INTERVAL * 3600000);

  ///////////////////////////////////////////////////////////////////////
  //        Password Change
  ///////////////////////////////////////////////////////////////////////

  const VALID_DURATION = process.env.validDuration || 5; //minutes
  const URL = (process.env.host || 'http://localhost:3000') + '/admin/change?';

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.email,
      clientId: process.env.emailId,
      clientSecret: process.env.emailSecret,
      refreshToken: process.env.emailRefresh,
    }
  });

  const sendMail = (username, email, request) => {
    let query = querystring.stringify({ request: request });

    transporter.sendMail({
      to: email,
      subject: 'Ears for Peers Password Change',
      html: 'Hi ' + username + ',<br><br>Someone has requested a password change for your account.<br>If this was you, <a href="' + URL + query + '">click here to change your password</a>.',
    }, (err, res) => {
      if (err) throw err;
    });
  };

  const start_password_change = (email) => {
    assert(typeof email === 'string');
    let request = crypto.randomBytes(16).toString('hex');

    db.query('SELECT username FROM users WHERE email = $1', [email], (err, res) => {
      if (err) throw err;

      // TODO maybe alert user attempt was bad?
      if (!res.rows[0]) {
        return;
      }

      db.query('INSERT INTO change_requests (request, expires, username) VALUES ($1, CURRENT_TIMESTAMP + ($2 * interval \'1 minute\'), $3) ON CONFLICT (username) DO UPDATE SET request = $1, expires = CURRENT_TIMESTAMP + ($2 * interval \'1 minute\')', [request, VALID_DURATION, res.rows[0].username], (err) => {
        if (err) throw err;

        sendMail(res.rows[0].username, email, request);
      });
    });
  };

  // if there is valid request pending,
  //    calls the callback with the username associated with the request
  // if there is not a valid request,
  //    calls the callback with no arguments
  //    (any attempt to resolve param in cb will result in 'undefined')
  const valid_password_change = (request, cb) => {
    assert(typeof request === 'string');
    let timestamp = new Date();

    db.query('SELECT username, expires FROM change_requests WHERE request = $1', [request], (err, res) => {
      if (err) throw err;

      if (res.rows[0]) {
        if (timestamp < res.rows[0].expires) {
          return cb(res.rows[0].username);
        }

        db.query('DELETE FROM change_requests WHERE request = $1', [request], (err) => {
          if (err) throw err;
        });
      }

      return cb();
    });
  };

  const change_password = (username, password) => {
    assert(typeof username === 'string');
    assert(typeof password === 'string');

    // autogenerates salt with default of 10 rounds
    let hash = bcrypt.hashSync(password);

    db.query('UPDATE users SET password = $1 WHERE username = $2', [hash, username], (err) => {
      if (err) throw err;
    });

    db.query('DELETE FROM change_requests WHERE username = $1', [username], (err) => {
      if (err) throw err;
    });
  };

  module.exports.start_password_change = start_password_change;
  module.exports.valid_password_change = valid_password_change;
  module.exports.change_password = change_password;

  ///////////////////////////////////////////////////////////////////////
  //        Register User
  ///////////////////////////////////////////////////////////////////////

  const register_user = (username, email, password) => {
    assert(typeof username === 'string');
    assert(typeof email    === 'string');
    assert(typeof password === 'string');

    let hash = bcrypt.hashSync(password);

    // TODO switch out replace and do actual checks for conflicts
    db.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [username, email, hash], (err) => {
      if (err) throw err;
    });
  };

  module.exports.register_user = register_user;

  ///////////////////////////////////////////////////////////////////////
  //        IP Address Limiting
  ///////////////////////////////////////////////////////////////////////

  const MAX_ATTEMPTS = process.env.maxAttempts || 3;
  const RETRY_WAIT_DURATION = process.env.retryWait || 5; // minutes

  const delete_login_attempt = (ip) => {
    assert(typeof ip === 'string');

    db.query('DELETE FROM login_attempts WHERE ip = $1', [ip], (err) => {
      if (err) throw err;
    });
  };

  const can_attempt_login = (ip, cb) => {
    assert(typeof ip === 'string');

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
    db.query('INSERT INTO login_attempts (ip, attempts, next_attempt) \
              VALUES ($1, 1, CURRENT_TIMESTAMP + ($2 * INTERVAL \'1 minute\')) \
              ON CONFLICT (ip) \
              DO \
                UPDATE \
                  SET attempts     = CASE WHEN login_attempts.next_attempt > CURRENT_TIMESTAMP \
                                          THEN login_attempts.attempts + 1 \
                                          ELSE 1 \
                                     END, \
                      next_attempt = CASE WHEN login_attempts.attempts > $3 \
                                          THEN login_attempts.next_attempt \
                                          ELSE CURRENT_TIMESTAMP + ($2 * INTERVAL \'1 minute\')\
                                     END',
    [ip, RETRY_WAIT_DURATION, MAX_ATTEMPTS], (err) => {
      if (err) throw err;

      db.query('SELECT attempts, next_attempt FROM login_attempts WHERE ip = $1', [ip], (err, res) => {
        if (err) throw err;

        if (!res.rows[0]) throw new Error('This isn\'t possible');

        // we only need to check attempts because the query above resets attempts when enough time has elapsed
        if (res.rows[0].attempts <= MAX_ATTEMPTS) {
          // console.log(ip + ' allowed attempt, this is attempt ' + (res.rows[0] + 1));
          return cb(true);
        }
        
        // can't log in yet, wait time milliseconds
        // console.log(ip + ' denied attempt');
        let timestamp = new Date();
        let wait_time = res.rows[0].next_attempt - timestamp;
        return cb(false, wait_time);
      });
    });
  };

  module.exports.can_attempt_login = can_attempt_login;
  module.exports.delete_login_attempt = delete_login_attempt;

  ///////////////////////////////////////////////////////////////////////
  //        Passport Functions
  ///////////////////////////////////////////////////////////////////////

  const strategy = (username, password, done) => {
    assert(typeof username === 'string');
    assert(typeof password === 'string');

    db.query('SELECT username, password FROM users WHERE username = $1', [username], (err, res) => {
      if (err) throw err;

      if (!res.rows[0]) return done(null, false);

      bcrypt.compare(password, res.rows[0].password, (err, match) => {
        if (err) throw err;

        if (!match) return done(null, false);

        return done(null, { username: res.rows[0].username, password: res.rows[0].password });
      });
    });
  };

  const serialize = (user, done) => {
    return done(null, user.username);
  };

  const deserialize = (username, done) => {
    assert(typeof username === 'string');

    db.query('SELECT username FROM users WHERE username = $1', [username], (err, res) => {
      if (!res.rows[0]) return done(null, false);
      return done(null, { username: res.rows[0].username });
    });
  };

  module.exports.strategy = strategy;
  module.exports.serialize = serialize;
  module.exports.deserialize = deserialize;
} else {
  module.exports.start_password_change = () => { return; };
  module.exports.valid_password_change = (request, cb) => { return cb(true); };
  module.exports.change_password = () => { return; };
  module.exports.register_user = () => { return; };
  module.exports.can_attempt_login = (ip, cb) => { return cb(true); };
  module.exports.delete_login_attempt = () => { return; };
  module.exports.strategy = (username, password, done) => { return done(null, { username: username, password: password }); };
  module.exports.serialize = (user, done) => { return done(null, user.username); };
  module.exports.deserialize = (username, done) => { return done(null, { username: username }); };
}