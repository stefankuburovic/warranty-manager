const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: In production, use environment variables or service account file
// For now, we'll use a try-catch to handle missing service account
let messaging = null;

try {
  // Try to load service account file if it exists
  const serviceAccountPath = require('path').join(__dirname, '../../firebase-service-account.json');
  const fs = require('fs');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
    
    messaging = admin.messaging();
    console.log('✓ Firebase Admin initialized');
  } else {
    console.warn('⚠ Firebase service account file not found. Notifications will be disabled.');
    console.warn('⚠ Create firebase-service-account.json in backend root to enable notifications.');
  }
} catch (error) {
  console.warn('⚠ Firebase initialization failed:', error.message);
  console.warn('⚠ Notifications will be disabled until Firebase is configured.');
}

// Send notification to single device
const sendNotification = async (fcmToken, notification, data = {}) => {
  if (!messaging) {
    console.warn('Firebase not initialized, skipping notification');
    return { error: 'firebase_not_configured' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        // Convert all data values to strings (FCM requirement)
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {})
      },
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
    return { success: true, messageId: response };
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
  if (!messaging) {
    console.warn('Firebase not initialized, skipping batch notifications');
    return { successCount: 0, failedTokens: tokens };
  }

  try {
    const messages = tokens.map(token => ({
      token: token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        ...data,
        ...Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {})
      },
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

