'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('warranty_alerts', {
      alert_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      alert_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      alert_type: {
        type: Sequelize.ENUM('30_days_before', '7_days_before', 'expired'),
        allowNull: false
      },
      is_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('warranty_alerts', ['product_id'], {
      name: 'idx_alerts_product_id'
    });
    await queryInterface.addIndex('warranty_alerts', ['alert_date'], {
      name: 'idx_alerts_date'
    });
    await queryInterface.addIndex('warranty_alerts', ['is_sent'], {
      name: 'idx_alerts_is_sent'
    });
    await queryInterface.addIndex('warranty_alerts', ['alert_type'], {
      name: 'idx_alerts_type'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('warranty_alerts');
  }
};

