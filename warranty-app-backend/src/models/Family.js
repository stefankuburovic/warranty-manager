const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Family = sequelize.define('Family', {
  family_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  
  invite_code: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false
  },
  
  max_members: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
}, {
  tableName: 'families',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Family;

