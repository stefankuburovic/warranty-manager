const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SearchHistory = sequelize.define('SearchHistory', {
    history_id: {
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
    search_query: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Applied filters as JSON'
    },
    results_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'search_history',
    timestamps: false,
    indexes: [
      { fields: ['user_id', 'created_at'] },
      { fields: ['search_query'] }
    ]
  });

  SearchHistory.associate = (models) => {
    SearchHistory.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE'
    });
  };

  return SearchHistory;
};

