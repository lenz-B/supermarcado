const express = require("express")
const app = express()
const session = require('express-session')
const flash = require('connect-flash');
const noCache = require('nocache')
const connectDB = require('mongoose')
const bodyParser = require('body-parser');
const passport = require('./config/passport')


connectDB.connect('mongodb://localhost:27017/eCom')

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(noCache())
app.use(session({
  secret: 'myScecret',
  resave: false,
  saveUninitialized: true
}))

app.use(flash())
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});
app.use(express.static('./public'));

app.use(passport.initialize())
app.use(passport.session())

const morgan = require('morgan')
// app.use(morgan('dev'))

require('dotenv').config()
const {PORT} = process.env


const userRouter = require('./routes/userRouter')
app.use('/', userRouter)

const adminRouter = require('./routes/adminRouter')
app.use('/admin', adminRouter)

app.listen(PORT, () => console.log(`Server running in ${PORT}`))