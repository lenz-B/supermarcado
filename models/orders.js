const { required, number } = require('joi');
const mongoose = require('mongoose');
const address = require('./address');

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true, ref: 'Users'
  },
  orderedItems: [{
    product_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: {type: Number, required: true }, 
    subTotal: {type: Number, required: true},
    productStatus:{type:String,enum: ['Pending','Cancel', 'Return','Processing', 'Shipped', 'Delivered',"placed"], default: 'Pending'}
  },],
  paymentMethod: {type: String, required: true},
  address: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: Number, required: true },
    pin: { type: Number, required: true },
    // locality: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    // landmark: { type: String },
    // alternatePhone: { type: String },
    is_Home: { type: Boolean, default: false },
    is_Work: { type: Boolean, default: false }
  },
  totalAmount: {type: Number, required: true},
  payment: {type: Number},
  orderStatus: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered',"placed"], default: 'Pending' },
  date: {type: Date, required: true},

});

module.exports = mongoose.model('Orders', orderSchema);