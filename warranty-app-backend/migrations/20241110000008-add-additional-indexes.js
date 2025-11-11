'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // This migration ensures all required indexes exist
    // Most indexes are already created in the table creation migrations,
    // but this serves as a safety net and ensures the composite search index exists
    
    try {
      // Check if composite search index exists, create if not
      const [results] = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_products_search' AND tablename = 'products';`
      );

      if (results.length === 0) {
        await queryInterface.addIndex('products', ['product_name', 'brand', 'model_number'], {
          name: 'idx_products_search'
        });
        console.log('✅ Created composite search index: idx_products_search');
      } else {
        console.log('⏭️  Index idx_products_search already exists');
      }
    } catch (error) {
      // If table doesn't exist yet, that's okay - the table creation migration will handle it
      if (!error.message.includes('does not exist')) {
        console.error('Error checking/creating idx_products_search:', error.message);
      }
    }

    // Add composite index for common query pattern (user_id + is_active + warranty_end_date)
    // This significantly improves performance for the getProducts query
    try {
      const [compositeResults] = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_products_user_active_warranty' AND tablename = 'products';`
      );

      if (compositeResults.length === 0) {
        await queryInterface.addIndex('products', ['user_id', 'is_active', 'warranty_end_date'], {
          name: 'idx_products_user_active_warranty'
        });
        console.log('✅ Created composite index: idx_products_user_active_warranty');
      } else {
        console.log('⏭️  Index idx_products_user_active_warranty already exists');
      }
    } catch (error) {
      if (!error.message.includes('does not exist')) {
        console.error('Error checking/creating idx_products_user_active_warranty:', error.message);
      }
    }

    // Add composite indexes for login queries (optimize login performance)
    // These help PostgreSQL use indexes efficiently for login lookups
    try {
      const [usernameAuthResults] = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_users_username_auth_type' AND tablename = 'users';`
      );

      if (usernameAuthResults.length === 0) {
        await queryInterface.addIndex('users', ['username', 'auth_type'], {
          name: 'idx_users_username_auth_type'
        });
        console.log('✅ Created composite index: idx_users_username_auth_type');
      } else {
        console.log('⏭️  Index idx_users_username_auth_type already exists');
      }
    } catch (error) {
      if (!error.message.includes('does not exist')) {
        console.error('Error checking/creating idx_users_username_auth_type:', error.message);
      }
    }

    try {
      const [emailAuthResults] = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_users_email_auth_type' AND tablename = 'users';`
      );

      if (emailAuthResults.length === 0) {
        await queryInterface.addIndex('users', ['email', 'auth_type'], {
          name: 'idx_users_email_auth_type'
        });
        console.log('✅ Created composite index: idx_users_email_auth_type');
      } else {
        console.log('⏭️  Index idx_users_email_auth_type already exists');
      }
    } catch (error) {
      if (!error.message.includes('does not exist')) {
        console.error('Error checking/creating idx_users_email_auth_type:', error.message);
      }
    }

    // Verify other indexes exist (they should from table creation migrations)
    const requiredIndexes = [
      { name: 'idx_products_user_id', table: 'products', columns: ['user_id'] },
      { name: 'idx_products_warranty_end', table: 'products', columns: ['warranty_end_date'] },
      { name: 'idx_products_is_active', table: 'products', columns: ['is_active'] },
      { name: 'idx_documents_product_id', table: 'documents', columns: ['product_id'] },
      { name: 'idx_stores_name', table: 'stores', columns: ['store_name'] },
      { name: 'idx_users_username', table: 'users', columns: ['username'] },
      { name: 'idx_users_auth_type', table: 'users', columns: ['auth_type'] }
    ];

    for (const index of requiredIndexes) {
      try {
        const [results] = await queryInterface.sequelize.query(
          `SELECT indexname FROM pg_indexes WHERE indexname = '${index.name}' AND tablename = '${index.table}';`
        );

        if (results.length === 0) {
          await queryInterface.addIndex(index.table, index.columns, {
            name: index.name
          });
          console.log(`✅ Created missing index: ${index.name}`);
        }
      } catch (error) {
        // Silently skip if table doesn't exist (will be created by earlier migrations)
        if (!error.message.includes('does not exist')) {
          console.error(`Error checking/creating ${index.name}:`, error.message);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the composite search index
    try {
      await queryInterface.removeIndex('products', 'idx_products_search');
    } catch (error) {
      console.error('Error removing idx_products_search:', error.message);
    }
  }
};

