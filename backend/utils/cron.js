const cron = require('node-cron');
const Batch = require('../models/Batch');

const setupCronJobs = () => {
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily expiry check...');
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3);

      const expiringBatches = await Batch.find({
        expiryDate: { $lte: targetDate }
      }).populate('productId');

      if (expiringBatches.length > 0) {
        console.log(`Found ${expiringBatches.length} items expiring soon!`);
        // Additional push notification logic can be placed here
      } else {
        console.log('No items expiring in 3 days.');
      }
    } catch (err) {
      console.error('Error in cron job:', err);
    }
  });
};

module.exports = setupCronJobs;
