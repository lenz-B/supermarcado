const { required } = require('joi');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category_id: {
    type: mongoose.Schema.Types.ObjectId, required: true,
    ref: 'Category'},
  // brand_id: {
  //   type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Brand'},
  name: {
    type: String, required: true, trim: true},
  description: {
    type: String, trim: true},
  price: {
    type: Number, required: true, min: 0},
  promoPrice: {
    type: Number, min: 0},
  stock: {
    type: Number, required: true, min: 0},
  img: {
    type: [String]},
  rating: {
    type: [Number]},
  tags: {
    type: [String]},
  status: {
    type: Boolean, default: true},
  createdAt: {
    type: Date, default: Date.now},
  updatedAt: {
    type: Date, default: Date.now}
});


module.exports = mongoose.model('Product', productSchema)