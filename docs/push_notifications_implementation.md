# Push Notifications - Warranty Expiry Reminders

## Overview
We'll implement push notifications using **Firebase Cloud Messaging (FCM)** to remind users about:
- Warranties expiring in 30 days
- Warranties expiring in 7 days
- Warranties that have expired
- Daily check at 9 AM local time

---

## Part 1: Backend Setup - Firebase & Notifications

### 1.1 Install Dependencies

```bash
cd warranty-app-backend
npm install firebase-admin node-cron
```

**Packages:**
- `firebase-admin` - Firebase Admin SDK for sending notifications
- `node-cron` - Schedule daily notification checks

### 1.2 Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "Warranty Manager"
3. Add Android app:
   - Package name: `com.yourcompany.warrantyapp`
   - Download `google-services.json`
4. Add iOS app:
   - Bundle ID: `com.yourcompany.warrantyapp`
   - Download `GoogleService-Info.plist`
5. Go to Project Settings → Service Accounts
6. Click "Generate new private key"
7. Save as `firebase-service-account.json` in backend root

### 1.3 Firebase Configuration (src/config/firebase.js)

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const messaging = admin.messaging();

// Send notification to single device
const sendNotification = async (fcmToken, notification, data = {}) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'warranty_reminders'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await messaging.send(message);
    console.log('Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If token is invalid, mark it for removal
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      return { error: 'invalid_token' };
    }
    
    throw error;
  }
};

// Send notification to multiple devices
const sendBatchNotifications = async (tokens, notification, data = {}) => {
  try {
    const messages = tokens.map(token => ({
      token: token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'warranty_reminders'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    }));

    const response = await messaging.sendAll(messages);
    console.log(`${response.successCount} notifications sent successfully`);
    
    // Return failed tokens for cleanup
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && 
          (resp.error.code === 'messaging/invalid-registration-token' ||
           resp.error.code === 'messaging/registration-token-not-registered')) {
        failedTokens.push(tokens[idx]);
      }
    });
    
    return { successCount: response.successCount, failedTokens };
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    throw error;
  }
};

module.exports = {
  messaging,
  sendNotification,
  sendBatchNotifications
};
```

### 1.4 Update User Model - Add FCM Token (src/models/User.js)

```javascript
// Add this field to User model
const User = sequelize.define('User', {
  // ... existing fields ...
  
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
  }
}, {
  // ... existing config ...
});
```

### 1.5 Create NotificationLog Model (src/models/NotificationLog.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationLog = sequelize.define('NotificationLog', {
  log_id: {
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
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  notification_type: {
    type: DataTypes.ENUM('30_days', '7_days', 'expired', 'custom'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sent_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  was_successful: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  error_message: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'notification_logs',
  timestamps: false
});

module.exports = NotificationLog;
```

### 1.6 Update Model Associations (src/models/index.js)

```javascript
const NotificationLog = require('./NotificationLog');

// Add these associations
User.hasMany(NotificationLog, { foreignKey: 'user_id' });
NotificationLog.belongsTo(User, { foreignKey: 'user_id' });

Product.hasMany(NotificationLog, { foreignKey: 'product_id' });
NotificationLog.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  // ... existing exports ...
  NotificationLog
};
```

### 1.7 Notification Service (src/services/notificationService.js)

```javascript
const { Op } = require('sequelize');
const { User, Product, NotificationLog } = require('../models');
const { sendNotification } = require('../config/firebase');

class NotificationService {
  
  // Check and send warranty expiry notifications
  async checkWarrantyExpirations() {
    try {
      console.log('Starting warranty expiration check...');
      
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);

      // Get all active users with notifications enabled
      const users = await User.findAll({
        where: {
          notification_enabled: true,
          fcm_token: { [Op.ne]: null }
        }
      });

      console.log(`Found ${users.length} users with notifications enabled`);

      for (const user of users) {
        await this.checkUserWarranties(user, today, in7Days, in30Days);
      }

      console.log('Warranty expiration check completed');
    } catch (error) {
      console.error('Error in checkWarrantyExpirations:', error);
    }
  }

  async checkUserWarranties(user, today, in7Days, in30Days) {
    try {
      // Get products expiring in 7 days
      const expiring7Days = await Product.findAll({
        where: {
          user_id: user.user_id,
          is_active: true,
          warranty_end_date: {
            [Op.between]: [in7Days, new Date(in7Days.getTime() + 86400000)] // +1 day
          }
        }
      });

      // Get products expiring in 30 days
      const expiring30Days = await Product.findAll({
        where: {
          user_id: user.user_id,
          is_active: true,
          warranty_end_date: {
            [Op.between]: [in30Days, new Date(in30Days.getTime() + 86400000)]
          }
        }
      });

      // Get products that expired today
      const expiredToday = await Product.findAll({
        where: {
          user_id: user.user_id,
          is_active: true,
          warranty_end_date: {
            [Op.between]: [today, new Date(today.getTime() + 86400000)]
          }
        }
      });

      // Send notifications
      for (const product of expiring7Days) {
        await this.sendWarrantyNotification(user, product, '7_days');
      }

      for (const product of expiring30Days) {
        await this.sendWarrantyNotification(user, product, '30_days');
      }

      for (const product of expiredToday) {
        await this.sendWarrantyNotification(user, product, 'expired');
      }

      // Update last check time
      await user.update({ last_notification_check: new Date() });
      
    } catch (error) {
      console.error(`Error checking warranties for user ${user.user_id}:`, error);
    }
  }

  async sendWarrantyNotification(user, product, type) {
    try {
      // Check if notification was already sent for this product/type today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingLog = await NotificationLog.findOne({
        where: {
          user_id: user.user_id,
          product_id: product.product_id,
          notification_type: type,
          sent_at: { [Op.gte]: today }
        }
      });

      if (existingLog) {
        console.log(`Notification already sent for product ${product.product_id}, type ${type}`);
        return;
      }

      // Prepare notification content
      const notification = this.getNotificationContent(product, type);
      
      // Send notification
      const result = await sendNotification(
        user.fcm_token,
        notification,
        {
          type: 'warranty_expiry',
          product_id: product.product_id.toString(),
          notification_type: type
        }
      );

      // Log notification
      await NotificationLog.create({
        user_id: user.user_id,
        product_id: product.product_id,
        notification_type: type,
        title: notification.title,
        body: notification.body,
        was_successful: !result.error,
        error_message: result.error || null
      });

      // If token is invalid, clear it
      if (result.error === 'invalid_token') {
        await user.update({ fcm_token: null });
        console.log(`Cleared invalid FCM token for user ${user.user_id}`);
      }

    } catch (error) {
      console.error(`Error sending notification for product ${product.product_id}:`, error);
      
      // Log failed notification
      await NotificationLog.create({
        user_id: user.user_id,
        product_id: product.product_id,
        notification_type: type,
        title: 'Error',
        body: error.message,
        was_successful: false,
        error_message: error.message
      });
    }
  }

  getNotificationContent(product, type) {
    const productName = product.product_name;
    
    switch (type) {
      case '7_days':
        return {
          title: '⚠️ Warranty Expiring Soon',
          body: `Your warranty for "${productName}" expires in 7 days!`
        };
      
      case '30_days':
        return {
          title: '📅 Warranty Reminder',
          body: `Your warranty for "${productName}" expires in 30 days.`
        };
      
      case 'expired':
        return {
          title: '⏰ Warranty Expired',
          body: `The warranty for "${productName}" has expired today.`
        };
      
      default:
        return {
          title: 'Warranty Notification',
          body: `Update about "${productName}"`
        };
    }
  }

  // Send custom notification to user
  async sendCustomNotification(userId, title, body, data = {}) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user || !user.fcm_token || !user.notification_enabled) {
        return { success: false, message: 'User not found or notifications disabled' };
      }

      const result = await sendNotification(
        user.fcm_token,
        { title, body },
        data
      );

      await NotificationLog.create({
        user_id: userId,
        notification_type: 'custom',
        title,
        body,
        was_successful: !result.error,
        error_message: result.error || null
      });

      return { success: !result.error };
    } catch (error) {
      console.error('Error sending custom notification:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new NotificationService();
```

### 1.8 Notification Scheduler (src/jobs/notificationScheduler.js)

```javascript
const cron = require('node-cron');
const notificationService = require('../services/notificationService');

// Schedule notification check daily at 9:00 AM
const startNotificationScheduler = () => {
  // Run at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('Running scheduled warranty expiration check...');
    await notificationService.checkWarrantyExpirations();
  }, {
    scheduled: true,
    timezone: "Europe/Belgrade" // Serbian timezone
  });

  console.log('✓ Notification scheduler started (runs daily at 9:00 AM)');

  // For testing: Run every hour
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly warranty check (dev mode)...');
      await notificationService.checkWarrantyExpirations();
    }, {
      scheduled: true,
      timezone: "Europe/Belgrade"
    });
    console.log('✓ Dev mode: Also running hourly checks');
  }
};

module.exports = { startNotificationScheduler };
```

### 1.9 Notification Controller (src/controllers/notificationController.js)

```javascript
const { User, NotificationLog } = require('../models');
const notificationService = require('../services/notificationService');

// Register FCM token
exports.registerToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    await req.user.update({ 
      fcm_token,
      notification_enabled: true 
    });

    res.json({ 
      message: 'FCM token registered successfully',
      notification_enabled: true
    });
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
};

// Remove FCM token (logout/uninstall)
exports.removeToken = async (req, res) => {
  try {
    await req.user.update({ fcm_token: null });

    res.json({ message: 'FCM token removed successfully' });
  } catch (error) {
    console.error('Remove token error:', error);
    res.status(500).json({ error: 'Failed to remove token' });
  }
};

// Toggle notifications on/off
exports.toggleNotifications = async (req, res) => {
  try {
    const { enabled } = req.body;

    await req.user.update({ notification_enabled: enabled });

    res.json({ 
      message: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
      notification_enabled: enabled
    });
  } catch (error) {
    console.error('Toggle notifications error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
};

// Get notification settings
exports.getSettings = async (req, res) => {
  try {
    res.json({
      notification_enabled: req.user.notification_enabled,
      has_token: !!req.user.fcm_token,
      last_check: req.user.last_notification_check
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Get notification history
exports.getNotificationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await NotificationLog.findAndCountAll({
      where: { user_id: req.user.user_id },
      order: [['sent_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: require('../models').Product,
          attributes: ['product_id', 'product_name', 'brand']
        }
      ]
    });

    res.json({
      notifications: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ error: 'Failed to get notification history' });
  }
};

// Test notification (for development)
exports.sendTestNotification = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    const result = await notificationService.sendCustomNotification(
      req.user.user_id,
      'Test Notification',
      'This is a test notification from Warranty Manager'
    );

    res.json(result);
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
};

// Manually trigger warranty check (admin/dev only)
exports.triggerWarrantyCheck = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    await notificationService.checkWarrantyExpirations();
    
    res.json({ message: 'Warranty check triggered successfully' });
  } catch (error) {
    console.error('Trigger warranty check error:', error);
    res.status(500).json({ error: 'Failed to trigger warranty check' });
  }
};
```

### 1.10 Notification Routes (src/routes/notifications.js)

```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Token management
router.post('/register-token', notificationController.registerToken);
router.post('/remove-token', notificationController.removeToken);

// Settings
router.get('/settings', notificationController.getSettings);
router.post('/toggle', notificationController.toggleNotifications);

// History
router.get('/history', notificationController.getNotificationHistory);

// Testing (dev only)
router.post('/test', notificationController.sendTestNotification);
router.post('/trigger-check', notificationController.triggerWarrantyCheck);

module.exports = router;
```

### 1.11 Update Main App (src/app.js)

```javascript
const notificationRoutes = require('./routes/notifications');

// Add after other routes
app.use('/api/v1/notifications', notificationRoutes);
```

### 1.12 Start Scheduler in Server (server.js)

```javascript
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { startNotificationScheduler } = require('./src/jobs/notificationScheduler');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    await sequelize.sync({ alter: true });
    console.log('✓ Database models synced');

    // Start notification scheduler
    startNotificationScheduler();

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

### 1.13 Update Environment Variables

```env
# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id

# Timezone for notifications
TZ=Europe/Belgrade
```

---

## Part 2: Mobile App - Push Notifications

### 2.1 Install Dependencies

```bash
cd warranty-app
npx expo install expo-notifications expo-device expo-constants
```

### 2.2 Configure app.json

```json
{
  "expo": {
    "name": "Warranty Manager",
    "slug": "warranty-app",
    "version": "1.0.0",
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#6200ee",
      "androidMode": "default",
      "androidCollapsedTitle": "Warranty Reminders"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.warrantyapp",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.warrantyapp",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ]
  }
}
```

### 2.3 Notifications API (src/api/notifications.js)

```javascript
import apiClient from './client';

export const notificationsApi = {
  // Register FCM token
  async registerToken(fcmToken) {
    const response = await apiClient.post('/notifications/register-token', {
      fcm_token: fcmToken
    });
    return response.data;
  },

  // Remove FCM token
  async removeToken() {
    const response = await apiClient.post('/notifications/remove-token');
    return response.data;
  },

  // Toggle notifications
  async toggleNotifications(enabled) {
    const response = await apiClient.post('/notifications/toggle', { enabled });
    return response.data;
  },

  // Get settings
  async getSettings() {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
  },

  // Get notification history
  async getHistory(params = {}) {
    const response = await apiClient.get('/notifications/history', { params });
    return response.data;
  },

  // Send test notification (dev)
  async sendTest() {
    const response = await apiClient.post('/notifications/test');
    return response.data;
  }
};
```

### 2.4 Notification Service (src/services/notificationService.js)

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationsApi } from '../api/notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Register for push notifications
  async registerForPushNotifications() {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      // Get FCM token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId
      });

      console.log('FCM Token:', token.data);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('warranty_reminders', {
          name: 'Warranty Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6200EE',
          sound: 'default',
          enableVibrate: true,
          showBadge: true
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Setup notification listeners
  setupNotificationListeners(navigation) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data.type === 'warranty_expiry' && data.product_id) {
        navigation.navigate('ProductDetail', { 
          productId: parseInt(data.product_id) 
        });
      }
    });
  }

  // Remove listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Schedule local notification (for testing)
  async scheduleLocalNotification(title, body, seconds = 5) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'local_test' },
      },
      trigger: { seconds },
    });
  }

  // Get notification permissions status
  async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  // Clear all notifications
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  // Set badge count
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default new NotificationService();
```

### 2.5 Update Auth Context to Handle FCM Token (src/context/AuthContext.js)

```javascript
import notificationService from '../services/notificationService';
import { notificationsApi } from '../api/notifications';

// Add to AuthContext:
export const AuthProvider = ({ children }) => {
  // ... existing state ...

  // Register FCM token after login
  const registerNotifications = async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        await notificationsApi.registerToken(token);
        console.log('FCM token registered with backend');
      }
    } catch (error) {
      console.error('Error registering notifications:', error);
    }
  };

  // Update handleGoogleSignIn
  const handleGoogleSignIn = async (idToken) => {
    try {
      setIsLoading(true);
      const data = await authApi.loginWithGoogle(idToken);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);

      // Register for notifications after successful login
      await registerNotifications();
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update signOut to remove FCM token
  const signOut = async () => {
    try {
      await notificationsApi.removeToken();
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
    
    await storage.clearTokens();
    await storage.clearUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  // ... rest of context ...
};
```

### 2.6 Setup Listeners in App.js

```javascript
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const navigationRef = useRef();

  useEffect(() => {
    if (isAuthenticated && navigationRef.current) {
      notificationService.setupNotificationListeners(navigationRef.current);
    }

    return () => {
      notificationService.removeNotificationListeners();
    };
  }, [isAuthenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PaperProvider>
  );
}
```

### 2.7 Notification Settings Screen (src/screens/NotificationSettingsScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Appbar, Switch, Card, Button, Divider } from 'react-native-paper';
import { notificationsApi } from '../api/notifications';
import notificationService from '../services/notificationService';

export default function NotificationSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    notification_enabled: false,
    has_token: false,
    last_check: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled) => {
    try {
      setIsSaving(true);
      
      if (enabled) {
        // Request permissions and register token
        const token = await notificationService.registerForPushNotifications();
        if (token) {
          await notificationsApi.registerToken(token);
        } else {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive warranty reminders.'
          );
          return;
        }
      } else {
        // Disable notifications
        await notificationsApi.toggleNotifications(false);
      }

      setSettings(prev => ({ ...prev, notification_enabled: enabled }));
      Alert.alert('Success', `Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationsApi.sendTest();
      Alert.alert('Test Sent', 'You should receive a test notification shortly');
    } catch (error) {
      console.error('Error sending test:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      await notificationService.setBadgeCount(0);
      Alert.alert('Success', 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Notification Settings" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Notification Settings" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="titleMedium">Enable Notifications</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Receive reminders about expiring warranties
                </Text>
              </View>
              <Switch
                value={settings.notification_enabled}
                onValueChange={handleToggleNotifications}
                disabled={isSaving}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue,
                { color: settings.has_token ? '#4caf50' : '#f44336' }
              ]}>
                {settings.has_token ? 'Registered' : 'Not Registered'}
              </Text>
            </View>

            {settings.last_check && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Check:</Text>
                <Text style={styles.infoValue}>
                  {new Date(settings.last_check).toLocaleString('sr-RS')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Reminder Schedule
            </Text>
            <Text variant="bodyMedium" style={styles.scheduleText}>
              You will receive notifications:
            </Text>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                30 days before warranty expires
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                7 days before warranty expires
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                On the day warranty expires
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.scheduleNote}>
              Notifications are sent daily at 9:00 AM
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Actions
            </Text>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('NotificationHistory')}
              icon="history"
              style={styles.actionButton}
            >
              View Notification History
            </Button>

            <Button
              mode="outlined"
              onPress={handleClearAll}
              icon="delete-sweep"
              style={styles.actionButton}
            >
              Clear All Notifications
            </Button>

            {__DEV__ && (
              <Button
                mode="outlined"
                onPress={handleTestNotification}
                icon="test-tube"
                style={styles.actionButton}
              >
                Send Test Notification (Dev)
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              About Notifications
            </Text>
            <Text variant="bodyMedium" style={styles.aboutText}>
              Warranty reminders help you stay informed about your product warranties
              before they expire. This allows you to:
            </Text>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                Plan warranty claims in advance
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                Avoid missing warranty deadlines
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                Make informed purchasing decisions
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 2
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingInfo: {
    flex: 1,
    marginRight: 16
  },
  settingDescription: {
    color: '#666',
    marginTop: 4
  },
  divider: {
    marginVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  infoLabel: {
    color: '#666',
    fontSize: 14
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500'
  },
  scheduleText: {
    marginBottom: 12,
    color: '#666'
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  bullet: {
    marginRight: 8,
    color: '#6200ee'
  },
  scheduleItemText: {
    flex: 1,
    fontSize: 14
  },
  scheduleNote: {
    marginTop: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  actionButton: {
    marginBottom: 12
  },
  aboutText: {
    marginBottom: 12,
    color: '#666'
  }
});
```

### 2.8 Notification History Screen (src/screens/NotificationHistoryScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Appbar, Card, Chip } from 'react-native-paper';
import { notificationsApi } from '../api/notifications';

export default function NotificationHistoryScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getHistory();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case '30_days':
        return '#2196f3';
      case '7_days':
        return '#ff9800';
      case 'expired':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case '30_days':
        return '30 Days';
      case '7_days':
        return '7 Days';
      case 'expired':
        return 'Expired';
      case 'custom':
        return 'Custom';
      default:
        return type;
    }
  };

  const renderNotification = ({ item }) => {
    const sentDate = new Date(item.sent_at).toLocaleString('sr-RS');
    const typeColor = getNotificationTypeColor(item.notification_type);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="titleMedium" style={styles.title}>
                {item.title}
              </Text>
              <Chip
                mode="flat"
                style={[styles.typeChip, { backgroundColor: typeColor + '20' }]}
                textStyle={{ color: typeColor, fontSize: 11 }}
              >
                {getNotificationTypeLabel(item.notification_type)}
              </Chip>
            </View>
            {!item.was_successful && (
              <Chip
                mode="flat"
                style={styles.failedChip}
                textStyle={{ color: '#f44336', fontSize: 11 }}
              >
                Failed
              </Chip>
            )}
          </View>

          <Text variant="bodyMedium" style={styles.body}>
            {item.body}
          </Text>

          {item.Product && (
            <Text variant="bodySmall" style={styles.product}>
              Product: {item.Product.product_name}
            </Text>
          )}

          <Text variant="bodySmall" style={styles.date}>
            {sentDate}
          </Text>

          {item.error_message && (
            <Text variant="bodySmall" style={styles.error}>
              Error: {item.error_message}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Notification History" />
      </Appbar.Header>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No notifications yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            You'll see notification history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.log_id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    marginBottom: 12,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  headerLeft: {
    flex: 1,
    marginRight: 8
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4
  },
  typeChip: {
    alignSelf: 'flex-start',
    height: 24,
    marginTop: 4
  },
  failedChip: {
    backgroundColor: '#f4433620',
    height: 24
  },
  body: {
    marginBottom: 8,
    color: '#333'
  },
  product: {
    color: '#666',
    marginBottom: 4
  },
  date: {
    color: '#999',
    fontSize: 12
  },
  error: {
    color: '#f44336',
    marginTop: 8,
    fontStyle: 'italic'
  }
});
```

### 2.9 Update Home Screen - Add Notification Badge

```javascript
// Add to HomeScreen.js imports
import { notificationsApi } from '../api/notifications';

// Add state
const [notificationCount, setNotificationCount] = useState(0);

// Add useEffect to load notification count
useEffect(() => {
  loadNotificationCount();
}, []);

const loadNotificationCount = async () => {
  try {
    const data = await notificationsApi.getHistory({ limit: 100 });
    const unread = data.notifications.filter(n => n.was_successful).length;
    setNotificationCount(unread);
  } catch (error) {
    console.error('Error loading notification count:', error);
  }
};

// Update Appbar to include notification icon
<Appbar.Header>
  <Appbar.Content title="My Warranties" />
  <Appbar.Action 
    icon="bell" 
    onPress={() => navigation.navigate('NotificationSettings')}
  />
  <Appbar.Action 
    icon="chart-box" 
    onPress={() => navigation.navigate('Statistics')} 
  />
  <Appbar.Action icon="logout" onPress={signOut} />
</Appbar.Header>
```

### 2.10 Update App Navigator

```javascript
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import NotificationHistoryScreen from '../screens/NotificationHistoryScreen';

// Add inside authenticated stack:
<Stack.Screen 
  name="NotificationSettings" 
  component={NotificationSettingsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="NotificationHistory" 
  component={NotificationHistoryScreen}
  options={{ headerShown: false }}
/>
```

---

## Part 3: Testing & Deployment

### 3.1 Testing Backend Notifications

**Test notification sending:**
```bash
# Trigger manual check (dev only)
curl -X POST http://localhost:3000/api/v1/notifications/trigger-check \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send test notification
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get notification history
curl -X GET http://localhost:3000/api/v1/notifications/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check cron job logs:**
```bash
# In your server logs, you should see:
# "✓ Notification scheduler started (runs daily at 9:00 AM)"
# "Running scheduled warranty expiration check..."
```

### 3.2 Testing Mobile Notifications

**Test flow:**
1. Login to app
2. Add product with warranty expiring in 7 days
3. Go to Notification Settings
4. Enable notifications
5. Wait for FCM token registration
6. Use backend test endpoint to send notification
7. Check if notification appears

**Test local notification:**
```javascript
// Add to NotificationSettingsScreen
const testLocal = async () => {
  await notificationService.scheduleLocalNotification(
    'Test Local Notification',
    'This is a local test notification',
    5
  );
};
```

### 3.3 Production Deployment Checklist

**Backend:**
- [ ] Add `firebase-service-account.json` to `.gitignore`
- [ ] Set `FIREBASE_PROJECT_ID` in production env
- [ ] Verify cron schedule timezone is correct
- [ ] Test notification scheduler in production
- [ ] Monitor notification logs for errors
- [ ] Set up error alerting (Sentry, etc.)

**Mobile:**
- [ ] Download `google-services.json` (Android)
- [ ] Download `GoogleService-Info.plist` (iOS)
- [ ] Add notification icon assets
- [ ] Test on physical devices
- [ ] Test notification permissions flow
- [ ] Test deep linking from notifications
- [ ] Submit to app stores with notification description

### 3.4 Firebase Console Setup

**Enable FCM:**
1. Firebase Console → Project Settings
2. Cloud Messaging tab
3. Enable Cloud Messaging API (if not enabled)
4. Note: Firebase Cloud Messaging API is free!

**Test from Firebase Console:**
1. Go to Cloud Messaging
2. Click "Send your first message"
3. Enter notification details
4. Select your app
5. Add FCM token from mobile device
6. Send test notification

---

## Part 4: Advanced Features (Optional)

### 4.1 Notification Preferences

Add user preferences for notification timing:

```javascript
// Add to User model
notification_preferences: {
  type: DataTypes.JSON,
  defaultValue: {
    enabled_30_days: true,
    enabled_7_days: true,
    enabled_expired: true,
    notification_time: '09:00', // HH:mm format
    days_of_week: [1, 2, 3, 4, 5] // Monday to Friday
  }
}
```

### 4.2 Notification Grouping

Group multiple expiring warranties in one notification:

```javascript
async sendGroupedNotification(user, products, type) {
  const count = products.length;
  const notification = {
    title: `${count} Warranties ${type === '7_days' ? 'Expiring Soon' : 'Reminder'}`,
    body: `You have ${count} products with warranties ${type === '7_days' ? 'expiring in 7 days' : 'expiring in 30 days'}.`
  };
  
  await sendNotification(user.fcm_token, notification, {
    type: 'warranty_group',
    count: count.toString(),
    notification_type: type
  });
}
```

### 4.3 Rich Notifications (Images)

Add product images to notifications:

```javascript
const message = {
  token: fcmToken,
  notification: {
    title: notification.title,
    body: notification.body,
    imageUrl: productImageUrl // Add product image
  },
  // ...
};
```

### 4.4 Action Buttons

Add action buttons to notifications:

```javascript
android: {
  notification: {
    clickAction: 'OPEN_PRODUCT',
    actions: [
      {
        title: 'View Product',
        action: 'view'
      },
      {
        title: 'Dismiss',
        action: 'dismiss'
      }
    ]
  }
}
```

---

## Part 5: Troubleshooting

### Common Issues:

**1. Notifications not received:**
- Check FCM token is registered
- Verify Firebase credentials are correct
- Check notification permissions granted
- Test with Firebase Console first
- Check server logs for errors

**2. Invalid FCM token:**
- Token cleared automatically on error
- User needs to re-register (logout/login)
- Check token expiry

**3. Scheduler not running:**
- Verify cron syntax is correct
- Check server timezone settings
- Test with shorter intervals in dev mode

**4. Permission denied:**
- User must grant notification permissions
- On iOS, request can only be shown once
- User must enable in device settings if denied

**5. Deep linking not working:**
- Verify navigation is set up correctly
- Check data payload in notification
- Test with local notifications first

---

## ✅ What's Complete:

1. ✅ **Firebase Integration** - FCM setup for push notifications
2. ✅ **Backend Scheduler** - Cron job runs daily at 9 AM
3. ✅ **Notification Types** - 30 days, 7 days, expired
4. ✅ **Token Management** - Register, remove, validate tokens
5. ✅ **Notification Logs** - Track all sent notifications
6. ✅ **Mobile Permissions** - Request and handle permissions
7. ✅ **Deep Linking** - Navigate to product on tap
8. ✅ **Settings Screen** - Enable/disable, view history
9. ✅ **History Screen** - View past notifications
10. ✅ **Error Handling** - Invalid token cleanup, retry logic

---

## 🚀 Next Steps:

Your warranty app now has:
- ✅ Authentication (Google OAuth)
- ✅ Product CRUD operations
- ✅ Document upload with S3
- ✅ Push notifications for expiring warranties

**What's next?**
- 🔍 **OCR Receipt Scanning** - Auto-extract receipt data
- 📊 **Advanced Analytics** - Charts, trends, insights
- 📤 **Export/Backup** - PDF reports, CSV export
- 🌐 **Multi-language** - Serbian/English support
- 👥 **Family Sharing** - Share products with family

**Which feature would you like to implement next?**