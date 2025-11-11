const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Google OAuth fields (optional now)
  google_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  // Username/Password fields (new)
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true,
    validate: {
      len: [3, 50],
      // Allow alphanumeric and underscore/hyphen
      is: {
        args: /^[a-zA-Z0-9_-]+$/,
        msg: 'Username can only contain letters, numbers, underscores, and hyphens'
      }
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Common fields
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profile_picture_url: {
    type: DataTypes.STRING
  },
  phone_number: {
    type: DataTypes.STRING
  },
  // Authentication type
  auth_type: {
    type: DataTypes.ENUM('google', 'local'),
    defaultValue: 'local',
    allowNull: false
  },
  // Email verification
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Password reset
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Existing fields
  last_login_at: {
    type: DataTypes.DATE
  },
  fcm_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notification_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_notification_check: {
    type: DataTypes.DATE
  },
  preferred_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      // Hash password if it's a local auth user (has password_hash set)
      // auth_type defaults to 'local', so if password_hash exists, hash it
      if (user.password_hash && (!user.auth_type || user.auth_type === 'local')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      // Only hash if password_hash is being changed and user is local auth
      if (user.changed('password_hash') && user.password_hash) {
        // If auth_type is not being changed and is 'local', or if it's undefined (defaults to local)
        const authType = user.auth_type !== undefined ? user.auth_type : user._previousDataValues?.auth_type;
        if (!authType || authType === 'local') {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      }
    }
  }
});

// Instance method to verify password
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;

