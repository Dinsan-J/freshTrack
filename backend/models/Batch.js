const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, default: 1 },
  addedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
