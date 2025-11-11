'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add barcode column to products table
    await queryInterface.addColumn('products', 'barcode', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Product barcode (EAN, UPC, etc.)'
    });

    // Add index for barcode lookups
    await queryInterface.addIndex('products', ['barcode'], {
      name: 'idx_products_barcode'
    });

    // Add composite index for user_id + barcode lookups (common query pattern)
    await queryInterface.addIndex('products', ['user_id', 'barcode', 'is_active'], {
      name: 'idx_products_user_barcode_active'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    try {
      await queryInterface.removeIndex('products', 'idx_products_user_barcode_active');
    } catch (error) {
      console.error('Error removing idx_products_user_barcode_active:', error.message);
    }

    try {
      await queryInterface.removeIndex('products', 'idx_products_barcode');
    } catch (error) {
      console.error('Error removing idx_products_barcode:', error.message);
    }

    // Remove column
    await queryInterface.removeColumn('products', 'barcode');
  }
};

