const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationLog = sequelize.define('NotificationLog', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  notification_type: {
    type: DataTypes.ENUM('30_days', '7_days', 'expired', 'custom'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  was_successful: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  error_message: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'notification_logs',
  timestamps: false
});

module.exports = NotificationLog;

