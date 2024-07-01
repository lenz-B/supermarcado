const express = require("express");
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const noCache = require('nocache');
const connectDB = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('./config/passport');
const cartMiddleware = require('./middlewares/cartMiddleware');
const morgan = require('morgan');
require('dotenv').config();

const { PORT } = process.env;

// Connect to MongoDB
connectDB.connect(process.env.MONGODB_URI)
.then(data=>{
  console.log("mongoDB connected ");
})

// Set view engine
app.set('view engine', 'ejs');

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(noCache());
app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});
app.use(express.static('./public'));

app.use(passport.initialize());
app.use(passport.session());

// Apply cart middleware
app.use(cartMiddleware);

// Morgan
// app.use(morgan('dev'));

// Load cron jobs
require('./config/cron-jobs');

// Load routes
const adminRouter = require('./routes/adminRouter');
app.use('/admin', adminRouter);

const userRouter = require('./routes/userRouter');
app.use('/', userRouter);

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;