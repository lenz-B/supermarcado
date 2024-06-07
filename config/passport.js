const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/users')
require('dotenv').config()

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const useremail = profile.emails[0].value;
    const {id, name } = profile;
    // // console.log(name);
    // // console.log(profile)

    let user = await User.findOne({email: useremail});
    if (!user) {
      user = new User({
        fname: name.givenName,
        lname: name.familyName,
        username: id,
        email: useremail,
        phone: '0123456789',
        password: id
      })

      const savingNewGoogleUser = await user.save()
      console.log('New Google User:', savingNewGoogleUser);
    } else {
      console.log('User alreagy exists', user)
    }
    done(null, user)
  } catch (error) {
    console.error('Google Auth failed', error);
    done(error, null)
  }
}
))

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Deserialize User error', error);
    done(error, null)    
  }
})

module.exports = passport