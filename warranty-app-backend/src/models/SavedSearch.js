const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SavedSearch = sequelize.define('SavedSearch', {
    saved_search_id: {
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
    search_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    search_query: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Filter configuration as JSON'
    },
    sort_by: {
      type: DataTypes.STRING(50),
      defaultValue: 'purchase_date_desc'
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Load this search on app open'
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'saved_searches',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  SavedSearch.associate = (models) => {
    SavedSearch.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE'
    });
  };

  return SavedSearch;
};

