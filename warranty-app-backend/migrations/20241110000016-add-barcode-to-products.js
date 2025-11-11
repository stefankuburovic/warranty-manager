'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if barcode column already exists
    const tableDescription = await queryInterface.describeTable('products');
    
    // Add barcode column to products table if it doesn't exist
    if (!tableDescription.barcode) {
      await queryInterface.addColumn('products', 'barcode', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Product barcode (EAN, UPC, etc.)'
      });
    }

    // Add index for barcode lookups (check if it exists first)
    try {
      await queryInterface.addIndex('products', ['barcode'], {
        name: 'idx_products_barcode'
      });
    } catch (error) {
      // Index might already exist, ignore error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Add composite index for user_id + barcode lookups (common query pattern)
    try {
      await queryInterface.addIndex('products', ['user_id', 'barcode', 'is_active'], {
        name: 'idx_products_user_barcode_active'
      });
    } catch (error) {
      // Index might already exist, ignore error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
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

