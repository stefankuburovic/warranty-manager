'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_preferences', {
      preference_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Global settings
      notifications_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      // Channels
      push_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      email_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      sms_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      // Timing
      notification_time: {
        type: Sequelize.TIME,
        defaultValue: '09:00:00',
        allowNull: false
      },
      quiet_hours_start: {
        type: Sequelize.TIME,
        defaultValue: '22:00:00',
        allowNull: false
      },
      quiet_hours_end: {
        type: Sequelize.TIME,
        defaultValue: '08:00:00',
        allowNull: false
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'Europe/Belgrade',
        allowNull: false
      },
      // Reminder intervals (JSON array of days)
      reminder_intervals: {
        type: Sequelize.JSONB,
        defaultValue: [3, 7, 14, 30],
        allowNull: false
      },
      // Category-specific settings (JSON object)
      category_settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      // Grouping
      group_notifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      max_daily_notifications: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
        allowNull: false
      },
      // Do Not Disturb
      dnd_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      dnd_start: {
        type: Sequelize.TIME,
        allowNull: true
      },
      dnd_end: {
        type: Sequelize.TIME,
        allowNull: true
      },
      // Advanced
      priority_filter: {
        type: Sequelize.ENUM('all', 'high_only', 'critical_only'),
        defaultValue: 'all',
        allowNull: false
      },
      notification_sound: {
        type: Sequelize.STRING(50),
        defaultValue: 'default',
        allowNull: false
      },
      vibration_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('notification_preferences', ['user_id'], {
      name: 'idx_notification_preferences_user'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_preferences');
  }
};

