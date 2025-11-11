'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      product_id: {
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
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'stores',
          key: 'store_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'category_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      purchase_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      purchase_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'RSD',
        allowNull: false
      },
      warranty_duration_months: {
        type: Sequelize.INTEGER,
        defaultValue: 12,
        allowNull: false
      },
      warranty_start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      warranty_end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addIndex('products', ['user_id'], {
      name: 'idx_products_user_id'
    });
    await queryInterface.addIndex('products', ['store_id'], {
      name: 'idx_products_store_id'
    });
    await queryInterface.addIndex('products', ['category_id'], {
      name: 'idx_products_category_id'
    });
    await queryInterface.addIndex('products', ['warranty_end_date'], {
      name: 'idx_products_warranty_end'
    });
    await queryInterface.addIndex('products', ['is_active'], {
      name: 'idx_products_is_active'
    });
    await queryInterface.addIndex('products', ['product_name'], {
      name: 'idx_products_name'
    });
    // Composite index for search functionality
    await queryInterface.addIndex('products', ['product_name', 'brand', 'model_number'], {
      name: 'idx_products_search'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
  }
};

