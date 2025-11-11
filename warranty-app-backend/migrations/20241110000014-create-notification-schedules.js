'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_schedules', {
      schedule_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Custom settings for this product
      custom_intervals: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      // Status
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      is_snoozed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      snooze_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // Last notification
      last_notification_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      last_notification_sent: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // Next scheduled
      next_notification_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      next_notification_type: {
        type: Sequelize.STRING(20),
        allowNull: true
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

    // Create unique constraint
    await queryInterface.addConstraint('notification_schedules', {
      fields: ['user_id', 'product_id'],
      type: 'unique',
      name: 'unique_user_product_schedule'
    });

    // Create indexes
    await queryInterface.addIndex('notification_schedules', ['user_id', 'product_id'], {
      name: 'idx_notification_schedules_user_product'
    });
    await queryInterface.addIndex('notification_schedules', ['is_snoozed', 'snooze_until'], {
      name: 'idx_notification_schedules_snooze'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_schedules');
  }
};

