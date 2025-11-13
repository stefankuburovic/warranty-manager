'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add user_custom_store_id column to products table
    await queryInterface.addColumn('products', 'user_custom_store_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'user_custom_stores',
        key: 'user_custom_store_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for the new column
    await queryInterface.addIndex('products', ['user_custom_store_id'], {
      name: 'idx_products_user_custom_store_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('products', 'idx_products_user_custom_store_id');
    await queryInterface.removeColumn('products', 'user_custom_store_id');
  }
};

