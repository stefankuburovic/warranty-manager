const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FamilyMember = sequelize.define('FamilyMember', {
  member_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  family_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'families',
      key: 'family_id'
    }
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'family_members',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = FamilyMember;

