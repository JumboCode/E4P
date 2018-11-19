const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const Admin = new Schema({
  username: {
    type: String,
    unique: true
  },
  password: { 
    type: String
  }
});

var AdminModel = mongoose.model('admins', Admin);

AdminModel.authenticate = (username, password, done) => {
  AdminModel.findOne({ username: username }, (err, admin) => {
    if (err) throw err;
    
    // admin not found
    if (!admin) { return done(null, false); }

    bcrypt.compare(password, admin.password, (err, match) => {
      if (err) throw err;

      // wrong password
      if (!match) { return done(null, false) }

      // success
      return done(null, admin);
    });
  });
}

AdminModel.serializeUser = (admin, done) => {
  done(null, admin.id);
}

AdminModel.deserializeUser = (id, done) => {
  AdminModel.findById(id, done);
}

AdminModel.register = (admin, password, done) => {
  var password_salt = bcrypt.genSaltSync(10);
  var password_hash = bcrypt.hashSync(password, password_salt);
  
  admin.password = password_hash;
  admin.save(done);
}

module.exports = AdminModel;