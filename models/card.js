// card.js

const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    name: {
        en: { type: String, required: true },
        other: { type: String, required: true }
    },
    description: {
        en: { type: String, required: true },
        other: { type: String, required: true }
    },
    images: { type: [String], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
