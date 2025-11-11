const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationSchedule = sequelize.define('NotificationSchedule', {
  schedule_id: {
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
    allowNull: false,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  // Custom settings for this product
  custom_intervals: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Status
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  is_snoozed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  snooze_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Last notification
  last_notification_type: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  last_notification_sent: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Next scheduled
  next_notification_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  next_notification_type: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'notification_schedules',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'product_id']
    }
  ]
});

module.exports = NotificationSchedule;

