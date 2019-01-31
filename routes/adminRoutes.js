const express = require('express');
const passport = require('passport');
const path = require('path');
const auth = require('../auth/auth');

let router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (/*process.env.NOAUTH || process.env.NODB*/ false) { return next(); }
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/admin/login');
}

function loggedIn(req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/admin'); }
  next();
}

router.get('/', ensureAuthenticated, (req, res) => {
  res.sendFile('admin.html', {root: path.join(__dirname, '../public')});
});

router.get('/login', loggedIn, (req, res) => {
  res.sendFile('login_page.html', {root: path.join(__dirname, '../public')});
});

function flagCheck(req, res, next) {
  if (/*process.env.NOAUTH || process.env.NODB*/ false) { return res.redirect('/admin'); }
  next();
}

router.post('/login', flagCheck, passport.authenticate('local', { failureRedirect: '/admin/login' }), (req, res) => {
  res.redirect('/admin');
});

router.get('/logout', ensureAuthenticated, (req, res) => {
  req.logout();
  res.redirect('/admin/login');
});

router.get('/change/request', ensureAuthenticated, (req, res) => {
  res.sendFile('change_request.html', {root: path.join(__dirname, '../public')});
});

router.post('/change/request', ensureAuthenticated, (req, res) => {
  auth.start_password_change(req.user.username);
  res.redirect('/admin/logout');
});

/*TODO figure out how to redirect to login then back to confirm*/
router.get('/change', /*ensureAuthenticated,*/ (req, res) => {
  let request = req.query.request;

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
  let request = req.query.request;
  let password = req.body.new_pwd;

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