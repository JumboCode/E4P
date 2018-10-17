const express = require('express');
const path = require('path');
const app = express();
const passport = require('passport');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var db = mongoose.connection;
mongoose.connect('mongodb://localhost/admin', { useNewUrlParser: true });

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({ secret: 'secret',
				  resave: true,
    			  saveUninitialized: true}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());


// passport config
var Admin = require('./models/adminModel');
passport.use(new LocalStrategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());


function ensureAuthenticated(req, res, next) {
	//return next();
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/public/login');
}

app.get('/', function(req, res) {
	res.sendFile('index.html', {root: path.join(__dirname, 'public')});
});

app.get('/admin', ensureAuthenticated, function(req, res) {
	res.sendFile('admin.html', {root: path.join(__dirname, 'public')});
});

app.listen(process.env.PORT || 3000, function() {
  	console.log('Node app is running on port 3000');
});