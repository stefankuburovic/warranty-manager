'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saved_searches', {
      saved_search_id: {
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
      search_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      search_query: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      filters: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Filter configuration as JSON'
      },
      sort_by: {
        type: Sequelize.STRING(50),
        defaultValue: 'purchase_date_desc'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Load this search on app open'
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('saved_searches', ['user_id'], {
      name: 'idx_saved_searches_user'
    });
    await queryInterface.addIndex('saved_searches', ['user_id', 'is_default'], {
      name: 'idx_saved_searches_default'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('saved_searches');
  }
};

