const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Admin = new Schema({
    username: String,
    password: String
});

Admin.plugin(passportLocalMongoose);

module.exports = mongoose.model('admins', Admin);