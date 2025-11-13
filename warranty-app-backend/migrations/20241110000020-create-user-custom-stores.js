'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_custom_stores', {
      user_custom_store_id: {
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
      store_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('user_custom_stores', ['user_id'], {
      name: 'idx_user_custom_stores_user_id'
    });
    await queryInterface.addIndex('user_custom_stores', ['store_name'], {
      name: 'idx_user_custom_stores_name'
    });
    // Composite index for user-specific searches
    await queryInterface.addIndex('user_custom_stores', ['user_id', 'store_name'], {
      name: 'idx_user_custom_stores_user_name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_custom_stores');
  }
};

