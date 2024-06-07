const logIn = async (req,res,next)=>{
  try {
    if(!req.session.adminId){
      res.redirect('/admin/login')
    }else{
      next()
    }
    
  } catch (error) {
    console.log(error.message)
  }
}

const logOut = async (req,res,next)=>{
  try {
    console.log(req.session)
    if(req.session.adminId){
      res.redirect('/admin/')
    }else{
      next()
    }
    
  } catch (error) {
    console.log(error.message)
  }
}

module.exports={logIn,logOut}