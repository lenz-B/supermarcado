const { required } = require('joi');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId, required: true,
    ref: 'Category'},
  name: { type: String, required: true, trim: true},
  description: { type: String, trim: true},
  price: { type: Number, required: true, min: 0},
  promoPrice: { type: Number, min: 0},
  stock: { type: Number, required: true, min: 0, default: 0},
  img: { type: [String]},
  rating: { type: [Number]},
  tags: { type: [String]},
  status: { type: Boolean, default: true},
  offer: [{ type: mongoose.Types.ObjectId, default: null, ref: 'Offer'}],
  createdAt: { type: Date, default: Date.now},
  updatedAt: { type: Date, default: Date.now}
},
{timestamps: true});


module.exports = mongoose.model('Product', productSchema)