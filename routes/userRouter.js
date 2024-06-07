const express = require('express')
const router = express()
const userController = require('../controllers/userController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const userAuthantication = require('../middlewares/userAuth')
const passport = require('passport')


router.get('/', userController.home)
router.get('/signup',userAuthantication.logOut, userController.signup)
router.post('/signup', userController.registration)

router.get('/login',userAuthantication.logOut, userController.login)
router.post('/login', userController.logingIn)
router.delete('/logout',userController.logOut)

router.get('/verify',userAuthantication.logOut, userController.verify)
router.post('/verify',userController.verification)
router.put('/saving-data',userController.savingNewUser)
router.post('/resend-otp', userController.resendOTP)

router.get('/email-verification', userController.getForgetPassword)
router.post('/email-verification', userController.forgetPassword)
router.post('/send-verification-code', userController.sendCode)
router.post('/confirm-password', userController.confirmPassword)

router.get('/google-auth', passport.authenticate('google', {scope: ['profile', 'email']}))
router.get('/google-auth/callback', passport.authenticate('google', {failureRedirect: '/login'}), userController.googleSignIn)

router.get('/my-account',userAuthantication.login , userController.myAccount)
router.post('/user-profile-update', userController.profileUpdate)

router.post('/add-address', userController.addAddress)
router.post('/delete-address', userController.deleteAddress)

router.get('/products', productController.shop)
router.get('/product-details', productController.productDetails)

router.get('/cart',userAuthantication.login, cartController.cart)
router.post('/add-to-cart',userAuthantication.login, cartController.addToCart)
router.post('/update-cart',userAuthantication.login, cartController.updateCart)
router.post('/remove-product',userAuthantication.login, cartController.removeProduct);

router.get('/checkout', orderController.checkoutPage)

module.exports = router;