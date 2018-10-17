const express = require('express');
const passport = require('passport');
let router = express.Router();
let Account = require('../models/adminModel');

router.get('/login', () => {});

router.post('/login', () => {});

router.get('/logout', () => {});

router.get('/register', () => {});

router.post('/register', () => {});

module.exports = router;