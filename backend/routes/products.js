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

// Add a product or update existing
router.post('/', async (req, res) => {
  const { barcode, name, brand, image } = req.body;
  
  try {
    let product = await Product.findOne({ barcode });
    if (!product) {
      product = new Product({ barcode, name, brand, image });
      await product.save();
    } else {
        // Update details if provided
        if (name) product.name = name;
        if (brand) product.brand = brand;
        if (image) product.image = image;
        await product.save();
    }
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expiring products within given days
router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const expiringBatches = await Batch.find({
      $or: [
        { expiryDate: { $lte: targetDate } },
        { expiryDate: { $lt: new Date() } }
      ]
    }).populate('productId');

    res.json(expiringBatches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product (and its batches)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await Batch.deleteMany({ productId: req.params.id });
    res.json({ message: 'Product and all batches deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
