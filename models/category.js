const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true, unique: true},
  description: {
    type: String, trim: true},
  img: {
    type: [String]},
  status: {
    type: Boolean, default: true}
});

module.exports = mongoose.model('Category', categorySchema);