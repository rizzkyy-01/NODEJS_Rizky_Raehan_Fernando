const mongoose = require('mongoose');

const User = mongoose.model('user', {
  username: { type: String, required: true },
  password: { type: String, required: true },
});

// menambah satu data
const admin = new User({
  username: 'admin',
  password: 'admin',
});

// Simpan ke collection
admin.save();
module.exports = User;