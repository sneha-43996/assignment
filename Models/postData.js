var mongoose = require('mongoose');
require('mongoose-double')(mongoose);

const comment = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true },
    body: { type: String, trim: true, required: true }
});

const postModel = new mongoose.Schema({
    userId: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    comments: [comment],
}, { timestamps: true });

module.exports = mongoose.model('post', postModel);