const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  email: { type: String, required: true },
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Message', MessageSchema);
