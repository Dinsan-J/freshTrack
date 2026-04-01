const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String },
  image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
