require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const setupCronJobs = require('./utils/cron');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Setup Cron
setupCronJobs();

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/batches', require('./routes/batches'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
