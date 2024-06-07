const login = async (req,res,next)=>{
  try {
    if(!req.session.user_id){
      res.redirect('/login')
    }else{
      next()
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