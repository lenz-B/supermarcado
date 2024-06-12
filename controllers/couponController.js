const couponDB = require('../models/coupon')

//coupon list
const coupons = async (req, res) => {
  try {
    res.render('admin/coupons')
  } catch (error) {
    
  }
}

//add coupon page
const addCoupon = async (req, res) => {
  try {
    res.render('admin/add-coupon')
  } catch (error) {
    
  }
}

module.exports = { coupons, addCoupon

}