const mongoose = require('mongoose')

const couponSchema = mongoose.Schema({
  coupon_code :{ type:String, required:true, unique:true},
  status:{ type:Boolean, default:false},
  discount_percentage:{ type:Number, required:true},
  expiry_date:{ type: Date, required: true},
  created_date:{ type: Date, required: true, default:Date.now()},
  min_purchase_amount:{ type:Number, required:true},
  max_redeemable_amount:{ type:Number, required:true}
})

module.exports = mongoose.model('Coupon',couponSchema)