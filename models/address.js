const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true, ref: 'Users'
    },
    user_address: [{
        name: { type: String, required: true },
        email: { type: String, required: true },
        mobile: { type: Number, required: true },
        pin: { type: Number, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        is_Home: { type: Boolean, default: false },
        is_Work: { type: Boolean, default: false }
    }]
});


module.exports = mongoose.model('Address', addressSchema);

  
const address = mongoose.model('Address', addressSchema);

 module.exports = address;


