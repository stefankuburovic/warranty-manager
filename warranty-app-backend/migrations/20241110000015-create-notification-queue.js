'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_queue', {
      queue_id: {
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
        allowNull: true,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Notification details
      notification_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      channel: {
        type: Sequelize.ENUM('push', 'email', 'sms', 'in_app'),
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('critical', 'high', 'normal', 'low'),
        defaultValue: 'normal',
        allowNull: false
      },
      // Content
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      action_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      // Scheduling
      scheduled_for: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      // Status
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'sent', 'failed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      // Retry
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      max_retries: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('notification_queue', ['user_id'], {
      name: 'idx_notification_queue_user'
    });
    await queryInterface.addIndex('notification_queue', ['status', 'scheduled_for'], {
      name: 'idx_notification_queue_status'
    });
    await queryInterface.addIndex('notification_queue', ['product_id'], {
      name: 'idx_notification_queue_product'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_queue');
  }
};

