const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: Number, required: true },
    expr: { type: Date, required: true, default: Date.now() }


})
otpSchema.index({ expr: 1 }, { expireAfterSeconds: 180 })

module.exports = mongoose.model('OTP', otpSchema)
