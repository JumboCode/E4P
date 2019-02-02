const express = require('express');
const passport = require('passport');
const path = require('path');

let router = express.Router();
let Admin = require('../models/adminModel');

function ensureAuthenticated(req, res, next) {
  if (process.env.NOAUTH || process.env.NODB) { return next(); }
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/admin/login');
}

function loggedIn(req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/admin'); }
  next();
}

router.get('/', ensureAuthenticated, (req, res) => {
  // console.log("GET /admin")
  res.sendFile('admin.html', {root: path.join(__dirname, '../dist-html')});
});

router.get('/login', loggedIn, (req, res) => {
  // console.log("GET /admin/login")
  res.sendFile('login_page.html', {root: path.join(__dirname, '../dist-html')});
});

function flagCheck(req, res, next) {
  if (process.env.NOAUTH || process.env.NODB) { return res.redirect('/admin'); }
  next();
}

router.post('/login', flagCheck, passport.authenticate('local', { failureRedirect: '/admin/login' }), (req, res) => {
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
  res.sendFile('register_page.html', {root: path.join(__dirname, '../dist-html')});
});

router.post('/register', ensureAuthenticated, (req, res) => {
  // console.log("POST /admin/register")
  Admin.register(new Admin({username : req.body.username }), req.body.password, (err, admin) => {
    if (err) {
      console.log(err);
      res.redirect('/admin/register');
    } else {
      res.redirect('/admin/login');
    }
  });
});

module.exports = router;
