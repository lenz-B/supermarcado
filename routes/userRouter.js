const express = require('express')
const router = express()
const userController = require('../controllers/userController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const userAuthentication = require('../middlewares/userAuth')
const passport = require('passport')



router.get('/', userController.home)
router.get('/signup',userAuthentication.logOut, userController.signup)
router.post('/signup', userController.registration)

router.get('/login',userAuthentication.logOut, userController.login)
router.post('/login', userController.logingIn)
router.delete('/logout',userController.logOut)

router.get('/verify',userAuthentication.logOut, userController.verify)
router.post('/verify',userController.verification)
router.put('/saving-data',userController.savingNewUser)
router.post('/resend-otp', userController.resendOTP)

router.get('/email-verification', userController.getForgetPassword)
router.post('/email-verification', userController.forgetPassword)
router.post('/send-verification-code', userController.sendCode)
router.post('/confirm-password', userController.confirmPassword)

router.get('/google-auth', passport.authenticate('google', {scope: ['profile', 'email']}))
router.get('/google-auth/callback', passport.authenticate('google', {failureRedirect: '/login'}), userController.googleSignIn)

router.get('/my-account',userAuthentication.login , userController.myAccount)
router.get('/order-details', userController.orderDetails)
router.post('/user-profile-update', userController.profileUpdate)
router.get('/downloadInvoice/:orderId', userController.invoiceDownload)

router.post('/add-address', userController.addAddress)
router.post('/delete-address', userController.deleteAddress)

router.get('/contact', userController.contact)

router.get('/products', productController.shop)
router.get('/product-details', productController.productDetails)
router.get('/api/product-details', productController.quickView)

router.get('/cart',userAuthentication.login, cartController.cart)
router.post('/add-to-cart',userAuthentication.login, cartController.addToCart)
router.post('/update-cart',userAuthentication.login, cartController.updateCart)
router.post('/remove-product',userAuthentication.login, cartController.removeProduct);
router.get('/wishlist', userAuthentication.login, cartController.wishlist)
router.post('/add-to-wishlist', cartController.addToWishlist)

router.get('/checkout',userAuthentication.login, orderController.checkoutPage)
router.post('/checkout', orderController.placeOrder)
router.post('/cancel-order', orderController.cancelOrder)
router.post('/capture-payment', orderController.captureRazorpayPayment);
router.post('/webhook', orderController.razorpayWebhook);
router.get('/wallet', userAuthentication.login, orderController.walletPage)
router.post('/finish-payment', orderController.finishPayment);

router.post('/apply-coupon', couponController.applyCoupon)
router.post('/remove-coupon', couponController.removeCoupon);

router.get('*', userController.page404 )

module.exports = router;