const express = require('express')
const router = express()
const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const adminAuthentication = require('../middlewares/adminAuth')
const uploadCat = require('../middlewares/multer')
const uploadPro = require('../middlewares/productMulter')

router.get('/',adminAuthentication.logIn, adminController.adminDash)
router.get('/login',adminAuthentication.logOut, adminController.login)
router.post('/login', adminController.logingin)
router.delete('/logout', adminController.logout)
router.get('/user',adminAuthentication.logIn, adminController.user)
router.post('/user/:id', adminController.userStatus)
router.get('/sales-report', adminController.salesReport)
router.post('/sales-report', adminController.salesFilter)

router.get('/categories',adminAuthentication.logIn, categoryController.categories)
router.post('/categories/:id', categoryController.updateCatStatus);
router.get('/add-category', adminAuthentication.logIn , categoryController.addCategory)
router.post('/add-category', uploadCat.single('img'), categoryController.addingCategory)
router.get('/edit-category', categoryController.editCategory)
router.post('/edit-category', uploadCat.single('img'), categoryController.editingCategory)

router.get('/products', adminAuthentication.logIn, productController.products)
router.post('/products/:id', productController.updateProStatus);
router.get('/add-product', adminAuthentication.logIn, productController.addProduct)
router.post('/add-product', uploadPro.array('img', 4), productController.addingProduct)
router.get('/edit-product',adminAuthentication.logIn, productController.editProduct)
router.post('/edit-product', uploadPro.array('img', 4), productController.editingProduct)

router.get('/orders',adminAuthentication.logIn, orderController.orders)
router.post('/update-order-status', orderController.updateOrderStatus)
router.get('/order-details', orderController.orderDetails)

router.get('/coupons', adminAuthentication.logIn, couponController.coupons )
router.post('/coupons/:id/toggle-status', couponController.updateCouponStatus)
router.get('/add-coupon', adminAuthentication.logIn, couponController.addCoupon)
router.post('/add-coupon', adminAuthentication.logIn, couponController.addingCoupon)

router.get('/offers', couponController.offers)
router.post('/offers/:id/toggle-status', couponController.updateOfferStatus)
router.get('/add-offer', adminAuthentication.logIn, couponController.addOffer)
router.post('/add-offer', couponController.addingOffer)

module.exports = router