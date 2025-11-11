const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SharedProduct = sequelize.define('SharedProduct', {
  share_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  
  family_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'families',
      key: 'family_id'
    }
  },
  
  shared_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  
  shared_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'shared_products',
  timestamps: false
});

module.exports = SharedProduct;

