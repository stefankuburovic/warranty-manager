require('dotenv').config();

// Get default PostgreSQL user (Homebrew uses macOS username)
const getDefaultUser = () => {
  if (process.env.DB_USER) return process.env.DB_USER;
  // Try macOS username first (Homebrew default)
  try {
    return require('os').userInfo().username;
  } catch {
    return 'postgres';
  }
};

module.exports = {
  development: {
    username: process.env.DB_USER || getDefaultUser(),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'warranty_manager',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  },
  test: {
    username: process.env.DB_USER || getDefaultUser(),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || 'warranty_manager_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

