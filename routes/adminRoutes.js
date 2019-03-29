const express = require('express');
const passport = require('passport');
const path = require('path');
const auth = require('../auth/auth');
const querystring = require('querystring');

let router = express.Router();

///////////////////////////////////////////////////////////////////////
//        Helper Functions
///////////////////////////////////////////////////////////////////////

let FIRSTLOGIN = (process.env.FIRSTLOGIN === 'true' ? true : (process.env.FIRSTLOGIN === 'false' ? false : true));
function ensureAuthenticated(req, res, next) {
  if (/*process.env.NOAUTH || process.env.NODB*/ false) { return next(); }
  if (req.isAuthenticated()) { return next(); }
  if (FIRSTLOGIN) {
    FIRSTLOGIN = false;
    process.env.FIRSTLOGIN = 'false';
    res.sendFile('first_login.html', {root: path.join(__dirname, '../public')});
  } else {
    res.redirect('/admin/login');
  }
}

function loggedIn(req, res, next) {
  if (req.isAuthenticated() || FIRSTLOGIN) { return res.redirect('/admin'); }
  next();
}

function flagCheck(req, res, next) {
  if (/*process.env.NOAUTH || process.env.NODB*/ false) { return res.redirect('/admin'); }
  next();
}

function limitCheck(req, res, next) {
  auth.can_attempt_login(String(req.ip), (valid, time) => {
    if (valid) {
      next();
    } else {
      let query = querystring.stringify({ time: time });
      res.redirect('/admin/wait?' + query);
    }
  });
}

function limitReset(req, res, next) {
  auth.delete_login_attempt(String(req.ip));
  next();
}

///////////////////////////////////////////////////////////////////////
//        Admin Routes
///////////////////////////////////////////////////////////////////////

router.get('/', ensureAuthenticated, (req, res) => {
  res.sendFile('admin.html', {root: path.join(__dirname, '../public')});
});

router.get('/login', loggedIn, (req, res) => {
  res.sendFile('login_page.html', {root: path.join(__dirname, '../public')});
});

router.post('/login', flagCheck, limitCheck, passport.authenticate('local', { failureRedirect: '/admin/login' }), limitReset, (req, res) => {
  res.redirect('/admin');
});

router.get('/logout', ensureAuthenticated, (req, res) => {
  req.logout();
  res.redirect('/admin/login');
});

router.post('/first', ensureAuthenticated, (req, res) => {
  let username = String(req.body.username);
  let email = String(req.body.email);
  let password = String(req.body.new_pwd);

  auth.register_user(username, email, password);
  res.redirect('/admin/logout');
});

router.get('/wait', (req, res) => {
  res.sendFile('login_wait.html', {root: path.join(__dirname, '../public')});
});

router.get('/change/request', (req, res) => {
  res.sendFile('change_request.html', {root: path.join(__dirname, '../public')});
});

router.post('/change/request', (req, res) => {
  auth.start_password_change(String(req.body.email));
  res.redirect('/admin/logout');
});

router.get('/change', (req, res) => {
  let request = String(req.query.request);

  // check request still valid and redirect as necessary
  auth.valid_password_change(request, (valid) => {
    if (valid) {
      res.sendFile('change_password.html', {root: path.join(__dirname, '../public')});
    } else {
      res.sendFile('change_invalid.html', {root: path.join(__dirname, '../public')});
    }
  });
});

router.post('/change', (req, res) => {
  let request = String(req.body.request);
  let password = String(req.body.new_pwd);

  auth.valid_password_change(request, (username) => {
    if (username) {
      auth.change_password(username, password);
      res.redirect('/admin/login');
    } else {
      res.sendFile('change_invalid.html', {root: path.join(__dirname, '../public')});
    }
  });
});

module.exports = router;
module.exports.ensureAuthenticated = ensureAuthenticated;
