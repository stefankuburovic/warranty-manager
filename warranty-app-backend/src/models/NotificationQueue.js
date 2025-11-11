const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationQueue = sequelize.define('NotificationQueue', {
  queue_id: {
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
    allowNull: true,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  // Notification details
  notification_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('push', 'email', 'sms', 'in_app'),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('critical', 'high', 'normal', 'low'),
    defaultValue: 'normal',
    allowNull: false
  },
  // Content
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  action_data: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Scheduling
  scheduled_for: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  // Status
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'sent', 'failed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Retry
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  max_retries: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false
  }
}, {
  tableName: 'notification_queue',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = NotificationQueue;

