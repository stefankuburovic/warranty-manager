const app = require('./src/app');
const { sequelize } = require('./src/models');
const { startNotificationScheduler } = require('./src/jobs/notificationScheduler');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync models (use { force: true } to drop tables - only in development!)
    await sequelize.sync({ alter: true });
    console.log('✓ Database models synced');

    // Optionally seed database (set SEED_DB=true in .env to enable)
    if (process.env.SEED_DB === 'true') {
      const seedDatabase = require('./src/seeders/initial-data');
      await seedDatabase();
    }

    // Start notification scheduler
    startNotificationScheduler();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Accessible at: http://localhost:${PORT} and http://192.168.0.27:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

