'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('search_history', {
      history_id: {
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
        onDelete: 'CASCADE'
      },
      search_query: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      filters: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Applied filters as JSON'
      },
      results_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('search_history', ['user_id', 'created_at'], {
      name: 'idx_search_history_user'
    });
    await queryInterface.addIndex('search_history', ['search_query'], {
      name: 'idx_search_history_query'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('search_history');
  }
};

