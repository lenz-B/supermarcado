const { ref } = require('joi');
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true, ref: 'Users'
  },
  products: [{
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type:Number, required: true }, 
    },],
});

module.exports = mongoose.model('Cart', cartSchema);