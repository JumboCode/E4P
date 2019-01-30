const express = require('express');
const passport = require('passport');
const path = require('path');
const bcrypt = require("bcryptjs");
const sqlite3 = require('sqlite3');

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

/********************************************/
/*              Password Change             */
/********************************************/

const TIMEOUT = 5; //minutes
var db = new sqlite3.Database('db.sqlite3');

router.get('/change_request', ensureAuthenticated, (req, res) => {
  res.sendFile('change_request.html', {root: path.join(__dirname, '../public')});
});

router.post('/change_request', ensureAuthenticated, (req, res) => {
  let username = req.user.username;
  let request = bcrypt.genSaltSync();
  let timestamp = new Date();
  let invalid = timestamp.setMinutes(timestamp.getMinutes() + TIMEOUT);

  db.run('REPLACE INTO change_requests VALUES (?, ?, ?)', request, invalid, username, (err) => {
    if (err) console.log(err);
  });

  res.redirect('/admin/logout');
});

/*TODO figure out how to redirect to login then back to confirm*/
router.get('/change_confirm', /*ensureAuthenticated,*/ (req, res) => {

});

router.get('/change_password', (req, res) => {

});

module.exports = router;