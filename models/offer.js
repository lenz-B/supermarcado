const mongoose = require('mongoose')

const offerSchema = mongoose.Schema({
  name: { type: String, required: true},
  offer_type: { type: String, required: true},
  product_name: { type: String},
  category_name: { type: String},
  discount: { type: Number, required: true},
  expiry_date: { type: Date, required: true},
  max_redeemable_amount: { type: Number, required: true},
  status: { type: Boolean, default: false}
})

module.exports = mongoose.model('Offer', offerSchema)