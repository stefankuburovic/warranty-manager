const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarrantyAlert = sequelize.define('WarrantyAlert', {
  alert_id: {
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
  alert_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  alert_type: {
    type: DataTypes.ENUM('30_days_before', '7_days_before', 'expired'),
    allowNull: false
  },
  is_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sent_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'warranty_alerts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = WarrantyAlert;

