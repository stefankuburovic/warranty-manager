const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_name: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  icon_name: {
    type: DataTypes.STRING
  },
  default_warranty_months: {
    type: DataTypes.INTEGER,
    defaultValue: 12
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'categories',
  timestamps: false
});

module.exports = Category;

