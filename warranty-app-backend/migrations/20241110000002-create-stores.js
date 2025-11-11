'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stores', {
      store_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      store_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      store_chain: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true
      },
      logo_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create index for search
    await queryInterface.addIndex('stores', ['store_name'], {
      name: 'idx_stores_name'
    });
    await queryInterface.addIndex('stores', ['city'], {
      name: 'idx_stores_city'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stores');
  }
};

