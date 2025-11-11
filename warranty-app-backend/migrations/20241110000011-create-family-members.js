'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Sequelize will handle enum creation automatically

    await queryInterface.createTable('family_members', {
      member_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'member'),
        defaultValue: 'member',
        allowNull: false
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
    await queryInterface.addIndex('family_members', ['family_id'], {
      name: 'idx_family_members_family_id'
    });
    await queryInterface.addIndex('family_members', ['user_id'], {
      name: 'idx_family_members_user_id'
    });
    await queryInterface.addIndex('family_members', ['family_id', 'user_id'], {
      name: 'idx_family_members_family_user',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('family_members');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_family_members_role";
    `);
  }
};

