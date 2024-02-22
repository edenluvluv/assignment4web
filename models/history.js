// history.js

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: String,
  endpoint: String,
  requestData: Object,
  outcome: String,
  timestamp: { type: Date, default: Date.now }
});

const History = mongoose.model('History', historySchema);

module.exports = History;
