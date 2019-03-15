var mongoose = require('mongoose');
require('mongoose-double')(mongoose);

const address = new mongoose.Schema({
    street: { type: String, trim: true, required: true },
    suit: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
    zipcode: { type: String, trim: true, required: true },
    geo: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    }
});

const company = new mongoose.Schema({
    name: { type: String, trim: true, required: true },
    catchPhrase: { type: String, trim: true, required: true },
    bs: { type: String, trim: true, required: true }
});

const userModel = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    address: address,
    phone: { type: String, required: true },
    website: { type: String, required: true },
    company: company,
    accessToken: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('user', userModel);