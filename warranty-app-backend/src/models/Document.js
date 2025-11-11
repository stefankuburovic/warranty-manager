const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  document_id: {
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
  document_type: {
    type: DataTypes.ENUM('receipt', 'warranty_card', 'invoice', 'manual', 'other'),
    defaultValue: 'receipt'
  },
  cloud_storage_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER
  },
  mime_type: {
    type: DataTypes.STRING
  },
  thumbnail_url: {
    type: DataTypes.STRING
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ocr_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ocr_raw_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ocr_processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
  createdAt: 'upload_date',
  updatedAt: false
});

module.exports = Document;

