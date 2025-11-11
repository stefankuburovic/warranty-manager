const cron = require('node-cron');
const notificationService = require('../services/notificationService');

// Schedule notification check daily at 9:00 AM
const startNotificationScheduler = () => {
  // Run at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('Running scheduled warranty expiration check...');
    await notificationService.checkWarrantyExpirations();
  }, {
    scheduled: true,
    timezone: "Europe/Belgrade" // Serbian timezone
  });

  console.log('✓ Notification scheduler started (runs daily at 9:00 AM)');

  // Process notification queue every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Processing notification queue...');
    try {
      await notificationService.processQueue();
    } catch (error) {
      console.error('Error processing notification queue:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Belgrade"
  });

  console.log('✓ Notification queue processor started (runs every 5 minutes)');

  // For testing: Run every hour
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly warranty check (dev mode)...');
      await notificationService.checkWarrantyExpirations();
    }, {
      scheduled: true,
      timezone: "Europe/Belgrade"
    });
    console.log('✓ Dev mode: Also running hourly checks');
  }
};

module.exports = { startNotificationScheduler };

