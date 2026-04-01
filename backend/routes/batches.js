const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');

// Add a batch
router.post('/', async (req, res) => {
  const { productId, expiryDate, quantity } = req.body;
  
  try {
    const batch = new Batch({ productId, expiryDate, quantity });
    await batch.save();
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
