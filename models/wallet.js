const mongoose = require('mongoose')

const walletSchema = mongoose.Schema({
  user_id : { type: mongoose.SchemaTypes.ObjectId, required: true, ref: 'Users'},
  wallet_amount :{ type : Number, default : 0},
  transaction_history : [{
    amount : { type : Number, default: 0},
    Payment_type:{ type: String, default:null},
    date:{ type: Date, default: Date.now}
  }]
})

module.exports = mongoose.model('Wallet',walletSchema)