const bcrypt = require('bcrypt');
const User = require('../models/users')
const categoryDB = require('../models/category')
const productDB = require('../models/products');

//admin home page
const adminDash = async (req, res) => {

  res.render('admin/dashboard')
}

//login
const login = async (req, res) => {
  res.render('admin/login')
}

//loging in
const logingin = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const { FOR_ADMIN_EMAIL, FOR_ADMIN_EMAIL_PASSWORD } = process.env;
    
    if (email === FOR_ADMIN_EMAIL && password === FOR_ADMIN_EMAIL_PASSWORD) {
      req.session.adminId = email;
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.json({ success: false, message: 'Invalid email or password' });
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log('error in login', error.message);
  }  
}

//logout
const logout = async (req, res) => {
  console.log("logout")
  req.session.destroy()
  res.send({status:true})
}

const user = async (req, res) => {
  try {
    const userData = await User.find()
    
    res.render('admin/user', {userData })
  } catch (error) {
    
  }
}

//block and unblock
const userStatus = async (req, res) => {
  try {
    const { id: userId } = req.params;
    console.log('id ' +userId);

    const user = await User.findById(userId)
    console.log('user fond: ' + user.username);

    if (user) {
      user.is_block = !user.is_block;
      const update = await user.save();
      console.log(`${user.username}'s status changed to : ${user.is_block}`);
      res.send({success: true})
    } else {
      console.log('user id not found');
      res.send({success: false})
    }
  } catch (error) {
    console.log("Error in block user", error.message)
  }
}

module.exports = {adminDash, login,
  logingin, logout, user, userStatus
}