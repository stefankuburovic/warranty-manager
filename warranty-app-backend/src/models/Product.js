const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  product_id: {
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
  store_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'stores',
      key: 'store_id'
    }
  },
  user_custom_store_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user_custom_stores',
      key: 'user_custom_store_id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'categories',
      key: 'category_id'
    }
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING
  },
  model_number: {
    type: DataTypes.STRING
  },
  serial_number: {
    type: DataTypes.STRING
  },
  purchase_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  purchase_price: {
    type: DataTypes.DECIMAL(10, 2)
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'RSD'
  },
  warranty_duration_months: {
    type: DataTypes.INTEGER,
    defaultValue: 12
  },
  warranty_start_date: {
    type: DataTypes.DATEONLY
  },
  warranty_end_date: {
    type: DataTypes.DATEONLY
  },
  notes: {
    type: DataTypes.TEXT
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Product barcode (EAN, UPC, etc.)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeSave: (product) => {
      // Auto-calculate warranty dates
      if (product.purchase_date && product.warranty_duration_months) {
        const startDate = new Date(product.purchase_date);
        product.warranty_start_date = product.purchase_date;
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + product.warranty_duration_months);
        product.warranty_end_date = endDate.toISOString().split('T')[0];
      }
    }
  }
});

module.exports = Product;

