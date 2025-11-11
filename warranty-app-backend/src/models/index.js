const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Store = require('./Store');
const Category = require('./Category');
const Document = require('./Document');
const WarrantyAlert = require('./WarrantyAlert');
const NotificationLog = require('./NotificationLog');
const NotificationPreference = require('./NotificationPreference');
const NotificationSchedule = require('./NotificationSchedule');
const NotificationQueue = require('./NotificationQueue');
const Family = require('./Family');
const FamilyMember = require('./FamilyMember');
const SharedProduct = require('./SharedProduct');
const SearchHistory = require('./SearchHistory')(sequelize);
const SavedSearch = require('./SavedSearch')(sequelize);
const ServiceCenter = require('./ServiceCenter');

// User -> Products (One to Many)
User.hasMany(Product, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'user_id' });

// Store -> Products (One to Many)
Store.hasMany(Product, { foreignKey: 'store_id' });
Product.belongsTo(Store, { foreignKey: 'store_id' });

// Category -> Products (One to Many)
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Product -> Documents (One to Many)
Product.hasMany(Document, { foreignKey: 'product_id', onDelete: 'CASCADE' });
Document.belongsTo(Product, { foreignKey: 'product_id' });

// Product -> WarrantyAlerts (One to Many)
Product.hasMany(WarrantyAlert, { foreignKey: 'product_id', onDelete: 'CASCADE' });
WarrantyAlert.belongsTo(Product, { foreignKey: 'product_id' });

// User -> NotificationLogs (One to Many)
User.hasMany(NotificationLog, { foreignKey: 'user_id' });
NotificationLog.belongsTo(User, { foreignKey: 'user_id' });

// Product -> NotificationLogs (One to Many)
Product.hasMany(NotificationLog, { foreignKey: 'product_id' });
NotificationLog.belongsTo(Product, { foreignKey: 'product_id' });

// User -> NotificationPreferences (One to One)
User.hasOne(NotificationPreference, { foreignKey: 'user_id', onDelete: 'CASCADE' });
NotificationPreference.belongsTo(User, { foreignKey: 'user_id' });

// User -> NotificationSchedules (One to Many)
User.hasMany(NotificationSchedule, { foreignKey: 'user_id', onDelete: 'CASCADE' });
NotificationSchedule.belongsTo(User, { foreignKey: 'user_id' });

// Product -> NotificationSchedules (One to Many)
Product.hasMany(NotificationSchedule, { foreignKey: 'product_id', onDelete: 'CASCADE' });
NotificationSchedule.belongsTo(Product, { foreignKey: 'product_id' });

// User -> NotificationQueue (One to Many)
User.hasMany(NotificationQueue, { foreignKey: 'user_id', onDelete: 'CASCADE' });
NotificationQueue.belongsTo(User, { foreignKey: 'user_id' });

// Product -> NotificationQueue (One to Many)
Product.hasMany(NotificationQueue, { foreignKey: 'product_id', onDelete: 'SET NULL' });
NotificationQueue.belongsTo(Product, { foreignKey: 'product_id' });

// Family associations
User.hasOne(Family, { foreignKey: 'owner_id', as: 'OwnedFamily' });
Family.belongsTo(User, { foreignKey: 'owner_id', as: 'Owner' });

User.belongsToMany(Family, { through: FamilyMember, foreignKey: 'user_id' });
Family.belongsToMany(User, { through: FamilyMember, foreignKey: 'family_id' });

FamilyMember.belongsTo(User, { foreignKey: 'user_id' });
FamilyMember.belongsTo(Family, { foreignKey: 'family_id' });

// Shared products
Product.belongsToMany(Family, { through: SharedProduct, foreignKey: 'product_id' });
Family.belongsToMany(Product, { through: SharedProduct, foreignKey: 'family_id' });

SharedProduct.belongsTo(Product, { foreignKey: 'product_id' });
SharedProduct.belongsTo(Family, { foreignKey: 'family_id' });
SharedProduct.belongsTo(User, { foreignKey: 'shared_by', as: 'Sharer' });

// Search associations
User.hasMany(SearchHistory, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SearchHistory.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(SavedSearch, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SavedSearch.belongsTo(User, { foreignKey: 'user_id' });

// Service Center associations
ServiceCenter.belongsTo(Category, {
  foreignKey: 'category_id',
  onDelete: 'SET NULL'
});
Category.hasMany(ServiceCenter, { foreignKey: 'category_id' });

module.exports = {
  sequelize,
  User,
  Product,
  Store,
  Category,
  Document,
  WarrantyAlert,
  NotificationLog,
  NotificationPreference,
  NotificationSchedule,
  NotificationQueue,
  Family,
  FamilyMember,
  SharedProduct,
  SearchHistory,
  SavedSearch,
  ServiceCenter
};

