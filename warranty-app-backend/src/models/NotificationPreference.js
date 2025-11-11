const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
  preference_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  // Global settings
  notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  // Channels
  push_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  email_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  sms_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  // Timing
  notification_time: {
    type: DataTypes.TIME,
    defaultValue: '09:00:00',
    allowNull: false
  },
  quiet_hours_start: {
    type: DataTypes.TIME,
    defaultValue: '22:00:00',
    allowNull: false
  },
  quiet_hours_end: {
    type: DataTypes.TIME,
    defaultValue: '08:00:00',
    allowNull: false
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Europe/Belgrade',
    allowNull: false
  },
  // Reminder intervals (JSON array of days)
  reminder_intervals: {
    type: DataTypes.JSONB,
    defaultValue: [3, 7, 14, 30],
    allowNull: false
  },
  // Category-specific settings (JSON object)
  category_settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  // Grouping
  group_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  max_daily_notifications: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    allowNull: false
  },
  // Do Not Disturb
  dnd_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  dnd_start: {
    type: DataTypes.TIME,
    allowNull: true
  },
  dnd_end: {
    type: DataTypes.TIME,
    allowNull: true
  },
  // Advanced
  priority_filter: {
    type: DataTypes.ENUM('all', 'high_only', 'critical_only'),
    defaultValue: 'all',
    allowNull: false
  },
  notification_sound: {
    type: DataTypes.STRING(50),
    defaultValue: 'default',
    allowNull: false
  },
  vibration_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'notification_preferences',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = NotificationPreference;

