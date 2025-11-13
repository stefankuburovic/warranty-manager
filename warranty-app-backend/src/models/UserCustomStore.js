const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCustomStore = sequelize.define('UserCustomStore', {
  user_custom_store_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  store_name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'user_custom_stores',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['store_name']
    },
    {
      fields: ['user_id', 'store_name']
    }
  ]
});

module.exports = UserCustomStore;

