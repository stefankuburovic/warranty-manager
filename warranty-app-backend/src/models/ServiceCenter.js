const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceCenter = sequelize.define('ServiceCenter', {
  service_center_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Authorized brand (e.g., Samsung, Apple)'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'category_id'
    }
  },
  
  // Location
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'Serbia'
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  
  // Contact
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Details
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  services: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of services offered'
  },
  hours: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Operating hours as JSON'
  },
  
  // Ratings
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    comment: 'Average rating (0-5)'
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Status
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Verified by admin'
  },
  
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'service_centers',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['latitude', 'longitude']
    },
    {
      fields: ['brand']
    },
    {
      fields: ['city']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = ServiceCenter;

