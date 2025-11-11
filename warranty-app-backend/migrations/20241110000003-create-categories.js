'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
      category_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      category_name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      icon_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      default_warranty_months: {
        type: Sequelize.INTEGER,
        defaultValue: 12,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Create index
    await queryInterface.addIndex('categories', ['category_name'], {
      name: 'idx_categories_name',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('categories');
  }
};

