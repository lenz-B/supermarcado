const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fname: { type: String, required: true, trim: true},
    lname: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, validate: /^[0-9]{10}$/ },
    password: { type: String, required: true, trim: true },
    is_admin: { type: Boolean, default: false },
    is_verified: { type: Boolean, default: false },
    is_block: { type: Boolean, default: false},
  },
  {timestamps: true}
  );
  
  const Users = mongoose.model('Users', userSchema);

  module.exports = Users;