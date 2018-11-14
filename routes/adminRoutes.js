const express = require('express');
const passport = require('passport');
const path = require('path');

let router = express.Router();
let Admin = require('../models/adminModel');

function ensureAuthenticated(req, res, next) {
  if (process.env.NOAUTH) { return next(); }
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/admin/login');
}

function loggedIn(req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/admin') }
  next();
}

router.get('/', ensureAuthenticated, (req, res) => {
  // console.log("GET /admin")
  res.sendFile('admin.html', {root: path.join(__dirname, '../public')});
});

router.get('/login', loggedIn, (req, res) => {
  // console.log("GET /admin/login")
  res.sendFile('login_page.html', {root: path.join(__dirname, '../public')});
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/admin/login' }), (req, res) => {
  // console.log("POST /admin/login")
  res.redirect('/admin');
});

router.get('/logout', ensureAuthenticated, (req, res) => {
  // console.log("GET /admin/logout")
  req.logout();
  res.redirect('/admin/login');
});

router.get('/register', ensureAuthenticated, (req, res) => {
  // console.log("GET /admin/register")
  res.sendFile('register_page.html', {root: path.join(__dirname, '../public')});
});

router.post('/register', ensureAuthenticated, (req, res) => {
  // console.log("POST /admin/register")
  Admin.register(new Admin({username : req.body.username }), req.body.password, function(err, admin) {
    if (err) {
      console.log(err);
      res.redirect('/admin/register');
    } else {
      res.redirect('/admin/login');
    }
  });
});

// TODO THIS IS NOT SECURE, PROTECT ALL ADMIN ROUTES BEHIND AUTH
router.get('/:folder/:file', function(req, res) {
  res.sendFile(req.params.file, {root: path.join(__dirname, '../public', req.params.folder)});
});

module.exports = router;