'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make google_id nullable (for username/password users)
    await queryInterface.changeColumn('users', 'google_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });

    // Add username field
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING(50),
      unique: true,
      allowNull: true
    });

    // Add password_hash field
    await queryInterface.addColumn('users', 'password_hash', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add auth_type enum
    // Sequelize will handle enum creation automatically
    await queryInterface.addColumn('users', 'auth_type', {
      type: Sequelize.ENUM('google', 'local'),
      defaultValue: 'local',
      allowNull: false
    });

    // Add email verification fields
    await queryInterface.addColumn('users', 'email_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('users', 'verification_token', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add password reset fields
    await queryInterface.addColumn('users', 'reset_token', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'reset_token_expiry', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add preferred_language field
    await queryInterface.addColumn('users', 'preferred_language', {
      type: Sequelize.STRING(10),
      defaultValue: 'en',
      allowNull: true
    });

    // Create unique index for username (only for non-null values)
    // PostgreSQL doesn't support partial unique indexes directly in Sequelize,
    // so we'll create a regular unique index and handle nulls in application logic
    await queryInterface.addIndex('users', ['username'], {
      name: 'idx_users_username',
      unique: true
    });

    await queryInterface.addIndex('users', ['auth_type'], {
      name: 'idx_users_auth_type'
    });

    // Add composite indexes for login queries (optimize OR queries)
    // These help PostgreSQL use indexes efficiently for login lookups
    await queryInterface.addIndex('users', ['username', 'auth_type'], {
      name: 'idx_users_username_auth_type'
    });

    await queryInterface.addIndex('users', ['email', 'auth_type'], {
      name: 'idx_users_email_auth_type'
    });

    // Update existing users to have auth_type = 'google'
    await queryInterface.sequelize.query(`
      UPDATE users SET auth_type = 'google' WHERE google_id IS NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('users', 'idx_users_auth_type');
    await queryInterface.removeIndex('users', 'idx_users_username');

    // Remove columns
    await queryInterface.removeColumn('users', 'preferred_language');
    await queryInterface.removeColumn('users', 'reset_token_expiry');
    await queryInterface.removeColumn('users', 'reset_token');
    await queryInterface.removeColumn('users', 'verification_token');
    await queryInterface.removeColumn('users', 'email_verified');
    await queryInterface.removeColumn('users', 'auth_type');
    await queryInterface.removeColumn('users', 'password_hash');
    await queryInterface.removeColumn('users', 'username');

    // Restore google_id to NOT NULL
    await queryInterface.changeColumn('users', 'google_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    });

    // Drop enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_auth_type";
    `);
  }
};

