'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_logs', {
      log_id: {
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
      notification_type: {
        type: Sequelize.ENUM('30_days', '7_days', 'expired', 'custom'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      was_successful: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Create indexes
    await queryInterface.addIndex('notification_logs', ['user_id'], {
      name: 'idx_notification_logs_user_id'
    });
    await queryInterface.addIndex('notification_logs', ['product_id'], {
      name: 'idx_notification_logs_product_id'
    });
    await queryInterface.addIndex('notification_logs', ['sent_at'], {
      name: 'idx_notification_logs_sent_at'
    });
    await queryInterface.addIndex('notification_logs', ['notification_type'], {
      name: 'idx_notification_logs_type'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_logs');
  }
};

