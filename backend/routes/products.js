const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Batch = require('../models/Batch');

// Get all products with their batches
router.get('/', async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: 'productId',
          as: 'batches'
        }
      }
    ]);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a product or return existing
router.post('/', async (req, res) => {
  const { barcode, name, brand, image } = req.body;
  
  try {
    let product = await Product.findOne({ barcode });
    if (!product) {
      product = new Product({ barcode, name, brand, image });
      await product.save();
    }
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expiring products within given days
// e.g. /api/products/expiring?days=3
router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    // Also get things that have already expired
    const expiringBatches = await Batch.find({
      $or: [
        { expiryDate: { $lte: targetDate } },
        { expiryDate: { $lt: new Date() } } // already expired
      ]
    }).populate('productId');

    res.json(expiringBatches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
