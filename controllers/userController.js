const bcrypt = require('bcrypt'); 
const otpGen = require('otp-generator')
const nodemailer = require('nodemailer')
const User = require('../models/users')
const otpDb =require('../models/otp')
const productDB = require('../models/products');
const categoryDB = require('../models/category')
const cartDB = require('../models/cart')
const addressDB = require('../models/address')
const orderDB = require('../models/orders')
const { joiRegSchema, addressValidationSchema} = require('../models/joi');
const flash = require('flash');



const getHeaderData = async () => {
  const categories = await categoryDB.find({ status: true }).lean();
  const products = await productDB.find({ status: true }).populate('category_id').lean();

  const categoryData = categories.map(category => ({
    ...category,
    products: products.filter(product => product.category_id._id.toString() === category._id.toString())
  }));

  return categoryData;
};

//calculation
async function calculateCartTotals(userId, session) {
  try {
    const cart = await cartDB.findOne({ user_id: userId }).populate('products.product_id');

    if (!cart) {
      throw new Error('Cart not found');
    }

    let orderTotal = 0;
    const shipping = 15;
    const vat = 0;

    cart.products.forEach(product => {
      const subTotal = product.product_id.price * product.quantity;
      product.subTotal = subTotal;
      orderTotal += subTotal;
    });

    orderTotal += shipping + vat;

    session.cartTotals = {
      subTotals: cart.products.map(product => ({
        productId: product.product_id._id,
        subTotal: product.subTotal,
        quantity: product.quantity 
      })),
      orderTotal: orderTotal,
      shipping: shipping,
      vat: vat
    };

    console.log('Cart totals calculated and stored in session:', session.cartTotals);
  } catch (error) {
    console.error('Error calculating cart totals:', error);
  }
}


const home = async (req, res) => {
  try {
  
    const categories = await categoryDB.find({ status: true }).lean();
    const products = await productDB.find({ status: true }).populate('category_id').lean();

    const categoryData = categories.map(category => {
      return {
        ...category,
        products: products.filter(product => product.category_id._id.toString() === category._id.toString())
      };
    });

    const { user_id } = req.session;

    res.render('user/home', { user_id, categoryData});
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Internal Server Error");
  }
};

const signup = async (req, res) => {
  const categoryData = await getHeaderData();

  const { user_id } = req.session;
  res.render('user/signup', {
    message: req.flash('message'),user_id, categoryData});
}

// registration
const registration = async (req, res) => {
  try {
    console.log('req.body:' + req.body);
    const { error } = joiRegSchema.validate(req.body, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const validationResult = await joiRegSchema.validateAsync(req.body);

    console.log('validationResult:' +validationResult);
    if (validationResult.error) {
      console.error(validationResult.error);
      return;
    }
    
    const { fname, lname, username, email, phone, password } = validationResult
 
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'Provided email or username already exists');
      return res.redirect('/signup');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({fname, lname, username, email, phone, 
    password: hashedPassword});

    req.session.userData = newUser;
    console.log(req.session.userData);
    const otp = otpGen.generate(6, { upperCaseAlphabets: false, 
      specialChars: false, digits: true, lowerCaseAlphabets: false })

    console.log(`Generated OTP: ${otp}`);
    const Otp = new otpDb({
      email,otp
    })
    const otpSave = await Otp.save()

    console.log(otpSave);
    sendOtp(email,otpSave.otp)
    console.log('reg otp ayach');

    res.redirect('/verify')
  } catch (error) {
    console.error('Error in registration:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  } 
}

// Email Sender

const sendOtp = async ( email, otp) => {
  try {
    const emailSender = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.FROM_EMAIL_PASS
      }
    })
    
    const otpEmailStructure = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'OTP to Login to your Brocoli Account',
      text: `OTP is " ${otp} " to login into your Bracoli account. 
      Please do not share it with anyone.`
    }
    
    emailSender.sendMail(otpEmailStructure, (error, info) =>{
      if(error) {
        console.log(error)
      } else {
        console.log('otp send', info.response);
      }
    })   
  } catch (error) {
    console.log(error.message)
  }
}

// loading verify page
async function verify( req, res) {
  console.log('================================otp')
  const categoryData = await getHeaderData();

  const { user_id } = req.session;
  res.render('user/verify', {user_id, categoryData})
}

// verification
async function verification( req, res) {
  try {
    console.log("verificationnnnnn")
    const {otp}=req.body
    if(!req.session.userData) {
      req.flash('error', 'email not exist, try again')
      return res.redirect('/signup')
    }
    const {email}=req.session.userData;
  
    const findOtp = await otpDb.findOne({email})
    if(!findOtp) {
      req.flash('error', 'OTP expired');
      return res.redirect('/signup');    
    }
      
    if(findOtp.otp==otp.trim()){   
      console.log('varified succces')
    return  res.send({status:true})
    }else{
     return res.send({status:false}) 
    }
  } catch (error) {
    res.status(500).send('server error')
  }
}

//saving 
const savingNewUser = async (req,res)=>{
  try {
    console.log(req.session.userData)
    const {email}= req.session.userData

    const userData = {
      ...req.session.userData,
      is_verified: true
    };

    await User.create(userData)

    const newUser = await User.findOne({email})    
    req.session.user_id = newUser._id
    if(newUser){
      await otpDb.deleteOne({email})
      res.send({status:true, message: 'Registered Successfully'})
      
    }else{
      res.send({status:false})
    }
  
  } catch (error) {
    console.log(error.message)
    res.send({ status: false, message: 'Registration Failed' });
  }
}

//resend otp
const resendOTP = async (req, res) => {
  try {
    console.log('ethi monee');
    console.log('ys: ', req.session.userData);
    if(!req.session.userData) {
      console.log('emial illadaa');
      req.flash('error', 'email not exist, try again')
      return res.redirect('/signup')
    }
    const {email}= req.session.userData;
    console.log('email indd',  email);

    await otpDb.deleteOne({ email });

    const otp = otpGen.generate(6, { upperCaseAlphabets: false, 
      specialChars: false, digits: true, lowerCaseAlphabets: false })

    console.log(`Generated OTP: ${otp}`);
    const Otp = new otpDb({
      email,otp
    })
    const otpSave = await Otp.save()

    console.log(otpSave);
    await sendOtp(email,otpSave.otp)
    console.log('resend otp ayach');

    res.json({ status: true });    
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.json({ status: false });
  }
}

// Login 
async function login(req, res) {
  try {
    const categoryData = await getHeaderData();
    const { user_id } = req.session;


    res.render('user/login',{user_id, categoryData})
  } catch (error) {
    console.error('Error in login:', error);
  }
}

//Login post
async function logingIn (req, res) {
  try {
    const {email,password}=req.body
    console.log(email, password);

    const user = await User.findOne({$or:[{email},{username: email}]});
    console.log(user);

    if (!user) {
      req.flash('error', 'User not found!');
      return res.redirect('/login')
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(passwordMatch);

    if (!passwordMatch) {
      req.flash('error', 'Invalid user or password');
      return res.redirect('/login')
    } else {
      console.log("settt");
      req.session.user_id = user._id;
      res.redirect('/')
    }

  } catch (error) {
    console.log(error.message);
  }
}

async function googleSignIn(req, res) {
  try {
    const user = req.user;
    req.session.user_id = user._id;
    res.redirect('/');
  } catch (error) {
    console.error('Error in Google auth', error);
    res.redirect('/login');
  }
}

  
const logOut = async (req,res)=>{
  try {
    req.session.destroy()
    res.send({status:true})
    
  } catch (error) {
    console.log(error.message)
  }
}

const sendCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: false, message: 'Email is required' });
    }
    const user = await User.findOne({email})
    if (!user) {
      return await res.json({ status: false, message: 'Enter a valid user\'s email' });
    }

    req.session.userData = { email }
    console.log('Session userData set: ', req.session.userData);

    const otp = otpGen.generate(6, { upperCaseAlphabets: false, 
      specialChars: false, digits: true, lowerCaseAlphabets: false })

    console.log(`Generated OTP: ${otp}`);
    const Otp = new otpDb({
      email,otp
    })
    const otpSave = await Otp.save()

    console.log(otpSave);
    await sendOtp(email,otpSave.otp)
    console.log('sendcode otp ayach');

    res.json({ status: true, message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Error sending OTP: ', error);
    res.status(500).json({ status: false, message: 'An error occurred' });
  }
}

const getForgetPassword = async (req, res) => {
  try {
    console.log('===otp')
    const categoryData = await getHeaderData();
    const { user_id } = req.session;


    res.render('user/email-verification', {user_id, categoryData})    
  } catch (error) {
    console.log(error.message)
  }
}

const forgetPassword = async (req, res) => {
  try {
    console.log('forget password');
    
    const userData = req.session.userData;
    const email = userData.email;
    const {otp} = req.body

    if (!email) {
      console.log('email forget password il illa');
      req.flash('error', 'email not exist, try again')
      return res.redirect('/login')
    }

    console.log('qu', email, otp, otpDb);
    
    const findOtp = await otpDb.findOne({email})
    console.log('otp DB ind: ', findOtp);
    if(!findOtp) {
      req.flash('error', 'OTP expired');
      return res.redirect('/login');
    }

    const dbOtp = findOtp.otp.toString().trim();
    const userOtp = otp.toString().trim();

    console.log('Comparing OTPs:', dbOtp, userOtp);
      
    if (dbOtp === userOtp) {
      console.log('OTP verified successfully');
      return res.send({ status: true });
    } else {
      console.log('pani pali');
      return res.send({ status: false });
    }
  } catch (error) {
    console.error('Error in forgetPassword:', error);
    res.status(500).send({ status: false, message: 'An error occurred' });
  }
}

const confirmPassword = async (req, res) => {
  try {
    const userData = req.session.userData;
    const email = userData.email;

    const { password } = req.body;

    await otpDb.deleteOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatePass =  await User.updateOne({ email }, { $set: { password: hashedPassword } });

    if (updatePass) {
      console.log('pass set akki', updatePass);

      const user = await User.findOne({email})
      req.session.user_id = user._id;
      console.log('user ', user, ' session ', req.session.user_id );

      res.send({ status: true, message: 'Password Updated Successfully' });
    } else {
      console.log('update ayikkilla');
      res.send({ status: false, message: 'Password Updation Failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: false, message: 'An error occurred' });
  }
};

//my account page
const myAccount = async (req, res) => {
  try {
    console.log('my account');
    const { user_id } = req.session;
    const user = await User.findById(user_id)
    const categoryData = await getHeaderData();
    const addressData = await addressDB.findOne({user_id: user_id})
    const orderData = await orderDB.find({ user_id: user_id }).populate('orderedItems.product_id');

    if (!orderData) {
      console.log('Order data not found for user:', user_id);
    }

    await calculateCartTotals(user_id, req.session);
    // console.log(req.session.cartTotals);
    const {orderTotal, subTotals} = req.session.cartTotals
    // console.log('subtotals',subTotals);

    // console.log('address: ', addressData);

    res.render('user/account', {user, user_id, categoryData,
      addressData, orderData, orderTotal, subTotals})
  } catch (error) {
    
  }
}

//edit user profile
const profileUpdate = async (req, res) => {
  try {
    console.log('profile-update');
    const { user_id } = req.session;
    const user = await User.findById(user_id);
    let { fname, lname, username, phone, password, newPassword, confirmPassword } = req.body;

    if (newPassword || confirmPassword) {
      if (!password) {
        return res.status(400).json({ message: 'Current password required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password does not match' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Current password does not match' });
      }

      password = newPassword;
    } else {
      password = user.password;
    }

    const email = user.email;
    let updateData = { fname, lname, username, email, phone, password };
    console.log('pass: ', password);
    console.log('upd: ', updateData);

    const { error } = joiRegSchema.validate(updateData, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }

    const existingUsername = await User.findOne({ username, _id: { $ne: user_id } });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    if (password !== user.password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    } else {
      delete updateData.password;
    }

    const update = await User.findByIdAndUpdate(user_id, { $set: updateData }, { new: true });

    if (update) {
      console.log('updated');
      return res.status(200).json({ status: true, message: 'Profile updated successfully!' });
    } else {
      console.log('not updated');
      return res.status(404).json({ status: false, message: 'Profile not updated' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
}

// add address
const addAddress = async (req, res) => {
  try {
    console.log('add-address');
    const { user_id } = req.session;
    if (!user_id) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }

    console.log('req.body: ', req.body);

    const { error } = addressValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }

    const user_address = req.body;

    await addressDB.findOneAndUpdate(
      { user_id },
      { $push: { user_address: user_address } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Address added/updated successfully');

    return res.json({ status: true, message: 'Address added successfully' });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
};

//delete address
const deleteAddress = async (req, res) => {
  try {
    console.log('delete address');
    const user_id = req.session.user_id;
    const {addressIndex} = req.body;

    const user = await User.findById(user_id);

    if (!user) {
      console.log('no user');
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const addressData = await addressDB.findOne({user_id: user_id})
    addressData.user_address.splice(addressIndex, 1)

    // if (addressIndex < 0 || addressIndex >= addressData.user_address.length) {
    //   console.log('Invalid address index');
    //   return res.status(400).json({ status: false, message: "Invalid address index" });
    // }

    const save = await addressData.save()
    if (save) {
      res.json({ status: true, message: "Address deleted successfully" });

    }    
  } catch (error) {
    console.error('Error:', error);
        res.status(500).json({ status: false, message: "Internal server error" });
  }
}



module.exports = {home, signup, registration, 
  verify, verification, savingNewUser,
  resendOTP, login, logingIn, googleSignIn,
  logOut, sendCode, getForgetPassword,
  forgetPassword, confirmPassword, myAccount,
  profileUpdate, addAddress, deleteAddress
}