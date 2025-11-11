'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check existing columns in stores table
    const storesTableDescription = await queryInterface.describeTable('stores');
    
    // Add location fields to stores table (only if they don't exist)
    if (!storesTableDescription.latitude) {
      await queryInterface.addColumn('stores', 'latitude', {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Store latitude coordinate'
      });
    }
    
    if (!storesTableDescription.longitude) {
      await queryInterface.addColumn('stores', 'longitude', {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Store longitude coordinate'
      });
    }
    
    if (!storesTableDescription.country) {
      await queryInterface.addColumn('stores', 'country', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
    
    if (!storesTableDescription.postal_code) {
      await queryInterface.addColumn('stores', 'postal_code', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
    
    if (!storesTableDescription.email) {
      await queryInterface.addColumn('stores', 'email', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
    
    if (!storesTableDescription.hours) {
      await queryInterface.addColumn('stores', 'hours', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Operating hours as JSON'
      });
    }
    
    if (!storesTableDescription.updated_at) {
      await queryInterface.addColumn('stores', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }
    
    // Update address column to TEXT if it's not already
    await queryInterface.changeColumn('stores', 'address', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    // Update phone column length
    await queryInterface.changeColumn('stores', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    
    // Update city column length
    await queryInterface.changeColumn('stores', 'city', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    
    // Update website column length
    await queryInterface.changeColumn('stores', 'website', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    
    // Create indexes for stores (only if they don't exist)
    try {
      await queryInterface.addIndex('stores', ['latitude', 'longitude'], {
        name: 'idx_stores_coordinates'
      });
    } catch (error) {
      // Index might already exist, ignore error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
    
    // Check if service_centers table already exists
    const tables = await queryInterface.showAllTables();
    const serviceCentersExists = tables.includes('service_centers');
    
    // Create service_centers table (only if it doesn't exist)
    if (!serviceCentersExists) {
      await queryInterface.createTable('service_centers', {
      service_center_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      brand: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Authorized brand (e.g., Samsung, Apple)'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'category_id'
        },
        onDelete: 'SET NULL'
      },
      
      // Location
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: 'Serbia'
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      
      // Contact
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      
      // Details
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      services: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Array of services offered'
      },
      hours: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Operating hours as JSON'
      },
      
      // Ratings
      rating: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true,
        comment: 'Average rating (0-5)'
      },
      review_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // Status
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Verified by admin'
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
      
      // Create indexes for service_centers
      try {
        await queryInterface.addIndex('service_centers', ['latitude', 'longitude'], {
          name: 'idx_service_centers_coordinates'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
      
      try {
        await queryInterface.addIndex('service_centers', ['brand'], {
          name: 'idx_service_centers_brand'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
      
      try {
        await queryInterface.addIndex('service_centers', ['city'], {
          name: 'idx_service_centers_city'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
      
      try {
        await queryInterface.addIndex('service_centers', ['is_active'], {
          name: 'idx_service_centers_active'
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop service_centers table
    await queryInterface.dropTable('service_centers');
    
    // Remove indexes from stores
    await queryInterface.removeIndex('stores', 'idx_stores_coordinates');
    
    // Remove columns from stores
    await queryInterface.removeColumn('stores', 'latitude');
    await queryInterface.removeColumn('stores', 'longitude');
    await queryInterface.removeColumn('stores', 'country');
    await queryInterface.removeColumn('stores', 'postal_code');
    await queryInterface.removeColumn('stores', 'email');
    await queryInterface.removeColumn('stores', 'hours');
    await queryInterface.removeColumn('stores', 'updated_at');
  }
};

