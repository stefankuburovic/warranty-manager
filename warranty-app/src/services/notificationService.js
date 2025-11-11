import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { notificationsApi } from '../api/notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const priority = notification.request.content.data?.priority || 'normal';
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: ['critical', 'high'].includes(priority),
      shouldSetBadge: true,
      priority: priority === 'critical' ? 'max' : 'default'
    };
  },
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.navigation = null;
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

      // Get Expo push token (for Expo Go, or FCM token for standalone)
      // Try multiple ways to get projectId
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId || 
        Constants.expoConfig?.extra?.easProjectId ||
        Constants.expoConfig?.projectId ||
        Constants.expoConfig?.slug || // Fallback to slug if no projectId
        undefined;

      let token;
      if (projectId && projectId !== 'your-project-id-here') {
        // Use projectId if it's configured
        token = await Notifications.getExpoPushTokenAsync({ projectId });
      } else {
        // Try without projectId (works in Expo Go)
        try {
          token = await Notifications.getExpoPushTokenAsync();
        } catch (error) {
          // If that fails, log warning but don't throw - app should still work
          console.warn('⚠️ Push notifications: projectId not configured');
          console.warn('📱 Push notifications will work in Expo Go, but may not work in standalone builds');
          console.warn('💡 To fix: Run "eas init" or add projectId to app.json under extra.eas.projectId');
          // Return null gracefully - don't break registration/login
          return null;
        }
      }

      console.log('Push Token:', token.data);

      await this.setupNotificationCategories();
      
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async setupNotificationCategories() {
    // Warranty expiring category with actions
    await Notifications.setNotificationCategoryAsync('warranty_expiring', [
      {
        identifier: 'view',
        buttonTitle: 'View',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'snooze_1h',
        buttonTitle: 'Snooze 1h',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze_1d',
        buttonTitle: 'Snooze 1 day',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]);

    // Expired category
    await Notifications.setNotificationCategoryAsync('warranty_expired', [
      {
        identifier: 'view',
        buttonTitle: 'View',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false },
      },
    ]);

    // Group category
    await Notifications.setNotificationCategoryAsync('warranty_group', [
      {
        identifier: 'view_all',
        buttonTitle: 'View All',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false },
      },
    ]);
  }

  async setupNotificationChannels() {
    // Critical channel
    await Notifications.setNotificationChannelAsync('warranty_critical', {
      name: 'Critical Warranty Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F44336',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // High priority channel
    await Notifications.setNotificationChannelAsync('warranty_high', {
      name: 'Important Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250],
      lightColor: '#FF9800',
      sound: 'default',
    });

    // Normal channel
    await Notifications.setNotificationChannelAsync('warranty_normal', {
      name: 'Warranty Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#6366F1',
    });

    // Expired channel
    await Notifications.setNotificationChannelAsync('warranty_expired', {
      name: 'Expired Warranties',
      importance: Notifications.AndroidImportance.LOW,
      lightColor: '#9E9E9E',
    });
  }

  // Setup notification listeners
  setupNotificationListeners(navigation) {
    this.navigation = navigation;

    this.notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const currentBadge = notification.request.content.badge || 0;
        await Notifications.setBadgeCountAsync(currentBadge);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        const actionIdentifier = response.actionIdentifier;
        
        await this.handleNotificationAction(actionIdentifier, data);
        await Notifications.setBadgeCountAsync(0);
      }
    );
  }

  async handleNotificationAction(actionIdentifier, data) {
    try {
      switch (actionIdentifier) {
        case 'snooze_1h':
          if (data?.product_id) {
            await notificationsApi.snoozeNotification(data.product_id, 1);
            await this.showLocalNotification(
              '⏰ Notification Snoozed',
              'You\'ll be reminded again in 1 hour'
            );
          }
          break;

        case 'snooze_1d':
          if (data?.product_id) {
            await notificationsApi.snoozeNotification(data.product_id, 24);
            await this.showLocalNotification(
              '⏰ Notification Snoozed',
              'You\'ll be reminded again tomorrow'
            );
          }
          break;

        case 'dismiss':
          break;

        case 'view':
        case 'view_all':
        case Notifications.DEFAULT_ACTION_IDENTIFIER:
          this.navigateFromNotification(data);
          break;
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }

  navigateFromNotification(data) {
    if (!this.navigation) return;

    if (data.type === 'warranty_expiry' && data.product_id) {
      this.navigation.navigate('ProductDetail', {
        productId: parseInt(data.product_id),
      });
    } else if (data.type === 'warranty_group') {
      this.navigation.navigate('Home', { filter: 'expiring' });
    }
  }

  async showLocalNotification(title, body) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { seconds: 1 },
    });
  }

  // Remove listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
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
    await Notifications.setBadgeCountAsync(0);
  }

  // Set badge count
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default new NotificationService();

