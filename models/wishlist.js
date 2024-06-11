const mongoose = require('mongoose')

const wishlistSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true, ref: 'Users'
      },
    products: [{
        type: mongoose.Types.ObjectId,
        required: true, ref: 'Product'
      }]

})

module.exports = mongoose.model('Wishlist', wishlistSchema)