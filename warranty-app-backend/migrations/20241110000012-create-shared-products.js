'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('shared_products', {
      share_id: {
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
      family_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'families',
          key: 'family_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      shared_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      shared_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('shared_products', ['product_id'], {
      name: 'idx_shared_products_product_id'
    });
    await queryInterface.addIndex('shared_products', ['family_id'], {
      name: 'idx_shared_products_family_id'
    });
    await queryInterface.addIndex('shared_products', ['shared_by'], {
      name: 'idx_shared_products_shared_by'
    });
    await queryInterface.addIndex('shared_products', ['product_id', 'family_id'], {
      name: 'idx_shared_products_product_family',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('shared_products');
  }
};

