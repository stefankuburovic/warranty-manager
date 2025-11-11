# Warranty App - Complete Project Setup

## Part 1: Backend Setup (Node.js + Express + PostgreSQL)

### 1.1 Initialize Backend Project

```bash
mkdir warranty-app-backend
cd warranty-app-backend
npm init -y
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install express pg pg-hstore sequelize dotenv cors helmet
npm install express-validator jsonwebtoken bcrypt
npm install google-auth-library multer aws-sdk

# Development dependencies
npm install --save-dev nodemon sequelize-cli
```

### 1.3 Project Structure

```
warranty-app-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── auth.js
│   │   └── storage.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Store.js
│   │   ├── Category.js
│   │   ├── Document.js
│   │   └── WarrantyAlert.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── storeController.js
│   │   └── documentController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── stores.js
│   │   └── documents.js
│   ├── utils/
│   │   └── validators.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

### 1.4 Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_app
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3 (or use Cloudinary)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-central-1
AWS_BUCKET_NAME=warranty-app-documents

# CORS
ALLOWED_ORIGINS=http://localhost:19000,exp://192.168.1.100:19000
```

### 1.5 Database Configuration (src/config/database.js)

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
```

### 1.6 User Model (src/models/User.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  google_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
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
  last_login_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
```

### 1.7 Product Model (src/models/Product.js)

```javascript
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
```

### 1.8 Store Model (src/models/Store.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('Store', {
  store_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  store_chain: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING
  },
  logo_url: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'stores',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Store;
```

### 1.9 Category Model (src/models/Category.js)

```javascript
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
```

### 1.10 Document Model (src/models/Document.js)

```javascript
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
  }
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
  createdAt: 'upload_date',
  updatedAt: false
});

module.exports = Document;
```

### 1.11 WarrantyAlert Model (src/models/WarrantyAlert.js)

```javascript
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
```

### 1.12 Model Associations (src/models/index.js)

```javascript
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Store = require('./Store');
const Category = require('./Category');
const Document = require('./Document');
const WarrantyAlert = require('./WarrantyAlert');

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

module.exports = {
  sequelize,
  User,
  Product,
  Store,
  Category,
  Document,
  WarrantyAlert
};
```

### 1.13 Authentication Middleware (src/middleware/auth.js)

```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };
```

### 1.14 Auth Controller (src/controllers/authController.js)

```javascript
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

exports.googleAuth = async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const fullName = payload['name'];
    const profilePicture = payload['picture'];

    // Find or create user
    let user = await User.findOne({ where: { google_id: googleId } });

    if (!user) {
      user = await User.create({
        google_id: googleId,
        email: email,
        full_name: fullName,
        profile_picture_url: profilePicture,
        last_login_at: new Date()
      });
    } else {
      await user.update({ last_login_at: new Date() });
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['google_id'] }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
```

### 1.15 Auth Routes (src/routes/auth.js)

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/google', authController.googleAuth);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
```

### 1.16 Main App (src/app.js)

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
```

### 1.17 Server Entry Point (server.js)

```javascript
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync models (use { force: true } to drop tables - only in development!)
    await sequelize.sync({ alter: true });
    console.log('✓ Database models synced');

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
```

### 1.18 Package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:migrate": "sequelize-cli db:migrate",
    "db:seed": "sequelize-cli db:seed:all"
  }
}
```

---

## Part 2: Mobile App Setup (React Native + Expo)

### 2.1 Initialize Expo Project

```bash
npx create-expo-app warranty-app
cd warranty-app
```

### 2.2 Install Dependencies

```bash
# Core dependencies
npx expo install expo-auth-session expo-web-browser
npx expo install @react-native-async-storage/async-storage
npx expo install expo-image-picker expo-camera
npx expo install axios

# Navigation
npm install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# UI
npm install react-native-paper
npx expo install react-native-vector-icons

# State management
npm install @tanstack/react-query
```

### 2.3 Project Structure

```
warranty-app/
├── src/
│   ├── api/
│   │   ├── client.js
│   │   ├── auth.js
│   │   └── products.js
│   ├── components/
│   │   ├── ProductCard.js
│   │   └── WarrantyBadge.js
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── AddProductScreen.js
│   │   └── ProductDetailScreen.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── utils/
│   │   ├── storage.js
│   │   └── dateHelpers.js
│   └── constants/
│       └── config.js
├── App.js
├── app.json
└── package.json
```

### 2.4 Configuration (src/constants/config.js)

```javascript
export const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api/v1'  // Replace with your local IP
  : 'https://api.warranty-app.com/v1';

export const GOOGLE_WEB_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'your-ios-client-id.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = 'your-android-client-id.apps.googleusercontent.com';
```

### 2.5 Storage Utility (src/utils/storage.js)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async setTokens(accessToken, refreshToken) {
    await AsyncStorage.multiSet([
      ['@access_token', accessToken],
      ['@refresh_token', refreshToken]
    ]);
  },

  async getAccessToken() {
    return await AsyncStorage.getItem('@access_token');
  },

  async getRefreshToken() {
    return await AsyncStorage.getItem('@refresh_token');
  },

  async clearTokens() {
    await AsyncStorage.multiRemove(['@access_token', '@refresh_token']);
  },

  async setUser(user) {
    await AsyncStorage.setItem('@user', JSON.stringify(user));
  },

  async getUser() {
    const user = await AsyncStorage.getItem('@user');
    return user ? JSON.parse(user) : null;
  },

  async clearUser() {
    await AsyncStorage.removeItem('@user');
  }
};
```

### 2.6 API Client (src/api/client.js)

```javascript
import axios from 'axios';
import { API_URL } from '../constants/config';
import { storage } from '../utils/storage';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token } = response.data;
        await storage.setTokens(access_token, refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await storage.clearTokens();
        await storage.clearUser();
        // Trigger logout in your app
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2.7 Auth API (src/api/auth.js)

```javascript
import apiClient from './client';

export const authApi = {
  async loginWithGoogle(idToken) {
    const response = await apiClient.post('/auth/google', {
      id_token: idToken
    });
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};
```

### 2.8 Auth Context (src/context/AuthContext.js)

```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '../api/auth';
import { storage } from '../utils/storage';
import { 
  GOOGLE_WEB_CLIENT_ID, 
  GOOGLE_IOS_CLIENT_ID, 
  GOOGLE_ANDROID_CLIENT_ID 
} from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const checkAuth = async () => {
    try {
      const token = await storage.getAccessToken();
      const savedUser = await storage.getUser();

      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken) => {
    try {
      setIsLoading(true);
      const data = await authApi.loginWithGoogle(idToken);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = () => {
    promptAsync();
  };

  const signOut = async () => {
    await storage.clearTokens();
    await storage.clearUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2.9 Login Screen (src/screens/LoginScreen.js)

```javascript
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo.png')} 
        style={styles.logo}
      />
      <Text variant="headlineMedium" style={styles.title}>
        Warranty Manager
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Never lose a warranty again
      </Text>

      <Button
        mode="contained"
        onPress={signIn}
        loading={isLoading}
        disabled={isLoading}
        icon="google"
        style={styles.button}
      >
        Sign in with Google
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
    color: '#666'
  },
  button: {
    marginTop: 20,
    paddingVertical: 8
  }
});
```

### 2.10 Home Screen (src/screens/HomeScreen.js)

```javascript
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Appbar, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();

  // Placeholder data - will be replaced with real data
  const products = [];

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="My Warranties" />
        <Appbar.Action icon="account-circle" onPress={() => {}} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No warranties yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Add your first product to start tracking warranties
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{item.product_name}</Text>
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666'
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 12
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});
```

### 2.11 App Navigator (src/navigation/AppNavigator.js)

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AddProductScreen from '../screens/AddProductScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen 
              name="AddProduct" 
              component={AddProductScreen}
              options={{ headerShown: true, title: 'Add Product' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 2.12 Add Product Screen (src/screens/AddProductScreen.js)

```javascript
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

export default function AddProductScreen({ navigation }) {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [receiptImage, setReceiptImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!productName || !purchaseDate) {
      alert('Please fill in required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement API call to save product
      console.log('Saving product:', {
        productName,
        brand,
        purchaseDate,
        price,
        warrantyMonths,
        receiptImage
      });
      
      // Navigate back on success
      navigation.goBack();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <TextInput
          label="Product Name *"
          value={productName}
          onChangeText={setProductName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Brand"
          value={brand}
          onChangeText={setBrand}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Purchase Date (YYYY-MM-DD) *"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          mode="outlined"
          placeholder="2024-11-10"
          style={styles.input}
        />

        <TextInput
          label="Price (RSD)"
          value={price}
          onChangeText={setPrice}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Warranty Duration (months)"
          value={warrantyMonths}
          onChangeText={setWarrantyMonths}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Receipt/Warranty Document
        </Text>

        {receiptImage && (
          <Image source={{ uri: receiptImage }} style={styles.image} />
        )}

        <View style={styles.imageButtons}>
          <Button 
            mode="outlined" 
            onPress={takePhoto}
            icon="camera"
            style={styles.imageButton}
          >
            Take Photo
          </Button>
          <Button 
            mode="outlined" 
            onPress={pickImage}
            icon="image"
            style={styles.imageButton}
          >
            Choose Image
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        >
          Save Product
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  form: {
    padding: 16
  },
  input: {
    marginBottom: 16
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  imageButton: {
    flex: 1,
    marginHorizontal: 4
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8
  }
});
```

### 2.13 Main App.js

```javascript
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
```

### 2.14 Update app.json

```json
{
  "expo": {
    "name": "Warranty Manager",
    "slug": "warranty-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.warrantyapp",
      "config": {
        "googleSignIn": {
          "reservedClientId": "YOUR_IOS_CLIENT_ID"
        }
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.warrantyapp",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app needs access to your photos to upload receipts and warranty documents."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "The app needs access to your camera to take photos of receipts."
        }
      ]
    ]
  }
}
```

---

## Part 3: Setup Instructions

### 3.1 Backend Setup Steps

1. **Install PostgreSQL**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # On macOS
   brew install postgresql
   ```

2. **Create Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE warranty_app;
   CREATE USER warranty_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE warranty_app TO warranty_user;
   \q
   ```

3. **Setup Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs
   - Copy Client ID and Secret to `.env`

4. **Run Backend**
   ```bash
   cd warranty-app-backend
   npm install
   npm run dev
   ```

5. **Test API**
   ```bash
   curl http://localhost:3000/health
   ```

### 3.2 Mobile App Setup Steps

1. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

2. **Setup Google Sign-In**
   - For Android: Add SHA-1 fingerprint to Firebase
   - For iOS: Add URL scheme to app.json
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

3. **Update Configuration**
   - Edit `src/constants/config.js` with your backend IP and Google Client IDs
   - Replace `your-google-client-id` with actual values

4. **Run Mobile App**
   ```bash
   cd warranty-app
   npm install
   npx expo start
   ```

5. **Test on Device**
   - Scan QR code with Expo Go app
   - Or run on emulator: `npx expo run:android` or `npx expo run:ios`

### 3.3 Seed Database (Optional)

Create a seed file `src/seeders/initial-data.js`:

```javascript
const { Category, Store } = require('../models');

async function seedDatabase() {
  // Seed Categories
  const categories = [
    { category_name: 'Electronics', icon_name: 'laptop', default_warranty_months: 24 },
    { category_name: 'Home Appliances', icon_name: 'washing-machine', default_warranty_months: 12 },
    { category_name: 'Furniture', icon_name: 'sofa', default_warranty_months: 12 },
    { category_name: 'Tools', icon_name: 'hammer', default_warranty_months: 12 },
    { category_name: 'Sports Equipment', icon_name: 'dumbbell', default_warranty_months: 6 }
  ];

  await Category.bulkCreate(categories);

  // Seed Popular Serbian Stores
  const stores = [
    { store_name: 'Tehnomanija - Knez Mihailova', store_chain: 'Tehnomanija', city: 'Belgrade', website: 'https://www.tehnomanija.rs' },
    { store_name: 'Gigatron - Ušće', store_chain: 'Gigatron', city: 'Belgrade', website: 'https://www.gigatron.rs' },
    { store_name: 'Emmi - Delta City', store_chain: 'Emmi', city: 'Belgrade', website: 'https://www.emmi.rs' },
    { store_name: 'Tempo - Novi Sad', store_chain: 'Tempo', city: 'Novi Sad', website: 'https://www.tempo.rs' },
    { store_name: 'JYSK - BIG', store_chain: 'JYSK', city: 'Belgrade', website: 'https://www.jysk.rs' }
  ];

  await Store.bulkCreate(stores);

  console.log('✓ Database seeded successfully');
}

module.exports = seedDatabase;
```

Run seed:
```javascript
// Add to server.js after sync
const seedDatabase = require('./src/seeders/initial-data');
await seedDatabase();
```

---

## Part 4: Testing

### 4.1 Test Google Authentication

```bash
# Use Postman or curl
curl -X POST http://localhost:3000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "YOUR_GOOGLE_ID_TOKEN"}'
```

### 4.2 Test Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Next Steps

1. ✅ Backend authentication working
2. ✅ Mobile app Google Sign-In implemented
3. ⏭️ Implement Product CRUD endpoints
4. ⏭️ Implement Document upload with S3/Cloudinary
5. ⏭️ Add image compression before upload
6. ⏭️ Implement warranty expiry notifications
7. ⏭️ Add OCR for receipt scanning
8. ⏭️ Build statistics dashboard
9. ⏭️ Add search and filters
10. ⏭️ Deploy to production

**Ready to continue?** Let me know if you want to implement any specific feature next!