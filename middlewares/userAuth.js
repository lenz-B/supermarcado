const mongoose = require('mongoose');
const User = require('../models/users')

const login = async (req,res,next)=>{
  try {
    if(!req.session.user_id){
      res.redirect('/login')
    }else{
      const user = await User.findById(req.session.user_id)

      console.log('user ind da: ', user);
      if (!user) {
        req.session.destroy();
        return res.redirect('/login');
      }
  
      if (user.is_block) {
        req.session.destroy();
        return res.redirect('/login');
      }

      next();
    }
  } catch (error) {
    console.log(error.message)
  }
}

const logOut = async (req,res,next)=>{
  try {
    if(req.session.user_id){
      res.redirect('/')
    }else{
      next()
    }
    
  } catch (error) {
    console.log(error.message)
  }
}

module.exports={login, logOut}