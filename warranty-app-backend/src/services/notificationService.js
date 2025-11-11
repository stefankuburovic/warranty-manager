const { Op } = require('sequelize');
const { 
  User, 
  Product, 
  NotificationLog, 
  NotificationPreference, 
  NotificationSchedule, 
  NotificationQueue,
  Category 
} = require('../models');
const { sendNotification } = require('../config/firebase');
const emailService = require('./emailService');
const smsService = require('./smsService');

class NotificationService {
  
  // Get or create user preferences
  async getUserPreferences(userId) {
    let preferences = await NotificationPreference.findOne({
      where: { user_id: userId }
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        user_id: userId,
        notifications_enabled: true,
        push_enabled: true,
        email_enabled: false,
        sms_enabled: false,
        reminder_intervals: [3, 7, 14, 30],
        category_settings: {},
        group_notifications: true,
        max_daily_notifications: 10
      });
    }

    return preferences;
  }

  // Check if notification should be sent based on preferences
  async shouldSendNotification(userId, product, notificationType) {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences.notifications_enabled) {
      return false;
    }

    // Check Do Not Disturb
    if (preferences.dnd_enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      if (preferences.dnd_start && preferences.dnd_end) {
        const dndStart = this.timeToMinutes(preferences.dnd_start);
        const dndEnd = this.timeToMinutes(preferences.dnd_end);
        
        if (dndStart <= dndEnd) {
          // Normal range (e.g., 22:00 to 08:00 next day)
          if (currentTime >= dndStart || currentTime < dndEnd) {
            return false;
          }
        } else {
          // Wraps around midnight (e.g., 22:00 to 08:00)
          if (currentTime >= dndStart || currentTime < dndEnd) {
            return false;
          }
        }
      }
    }

    // Check quiet hours
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const quietStart = this.timeToMinutes(preferences.quiet_hours_start);
    const quietEnd = this.timeToMinutes(preferences.quiet_hours_end);
    
    if (quietStart <= quietEnd) {
      if (currentTime >= quietStart && currentTime < quietEnd) {
        return false;
      }
    } else {
      if (currentTime >= quietStart || currentTime < quietEnd) {
        return false;
      }
    }

    // Check category settings
    if (product.category_id && preferences.category_settings) {
      const categorySettings = preferences.category_settings[product.category_id];
      if (categorySettings && categorySettings.enabled === false) {
        return false;
      }
    }

    // Check if product is snoozed
    const schedule = await NotificationSchedule.findOne({
      where: {
        user_id: userId,
        product_id: product.product_id
      }
    });

    if (schedule && schedule.is_snoozed && schedule.snooze_until) {
      if (new Date() < new Date(schedule.snooze_until)) {
        return false;
      }
    }

    return true;
  }

  // Convert time string to minutes
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Calculate days until expiry
  calculateDaysUntilExpiry(warrantyEndDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(warrantyEndDate);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Get notification priority
  getNotificationPriority(daysUntilExpiry) {
    if (daysUntilExpiry < 0) return 'critical';
    if (daysUntilExpiry <= 7) return 'high';
    if (daysUntilExpiry <= 30) return 'normal';
    return 'low';
  }

  // Add notification to queue
  async queueNotification(userId, productId, notificationType, channels, priority = 'normal', scheduledFor = null) {
    const user = await User.findByPk(userId);
    const product = productId ? await Product.findByPk(productId) : null;
    
    if (!user) {
      throw new Error('User not found');
    }

    const preferences = await this.getUserPreferences(userId);
    const daysUntilExpiry = product && product.warranty_end_date 
      ? this.calculateDaysUntilExpiry(product.warranty_end_date)
      : null;
    
    const notificationContent = this.getNotificationContent(
      product || { product_name: 'Product' },
      notificationType,
      daysUntilExpiry
    );

    const queueItems = [];

    for (const channel of channels) {
      // Check if channel is enabled
      if (channel === 'push' && !preferences.push_enabled) continue;
      if (channel === 'email' && !preferences.email_enabled) continue;
      if (channel === 'sms' && !preferences.sms_enabled) continue;

      const queueItem = await NotificationQueue.create({
        user_id: userId,
        product_id: productId,
        notification_type: notificationType,
        channel,
        priority: priority || this.getNotificationPriority(daysUntilExpiry || 0),
        title: notificationContent.title,
        body: notificationContent.body,
        image_url: product?.image_url || null,
        action_data: {
          type: 'warranty_expiry',
          product_id: productId?.toString(),
          notification_type: notificationType,
          days_until_expiry: daysUntilExpiry
        },
        scheduled_for: scheduledFor || new Date(),
        status: 'pending'
      });

      queueItems.push(queueItem);
    }

    return queueItems;
  }

  // Process notification queue
  async processQueue() {
    const pendingNotifications = await NotificationQueue.findAll({
      where: {
        status: 'pending',
        scheduled_for: { [Op.lte]: new Date() }
      },
      order: [['priority', 'DESC'], ['scheduled_for', 'ASC']],
      limit: 50,
      include: [
        { model: User, attributes: ['user_id', 'email', 'phone_number', 'fcm_token'] },
        { model: Product, attributes: ['product_id', 'product_name', 'brand', 'warranty_end_date'] }
      ]
    });

    console.log(`Processing ${pendingNotifications.length} queued notifications`);

    for (const queueItem of pendingNotifications) {
      await this.processQueueItem(queueItem);
    }
  }

  // Process single queue item
  async processQueueItem(queueItem) {
    try {
      // Mark as processing
      await queueItem.update({ status: 'processing' });

      const user = queueItem.User;
      const product = queueItem.Product;

      let result;

      switch (queueItem.channel) {
        case 'push':
          result = await this.sendPushNotification(user, queueItem);
          break;
        case 'email':
          result = await this.sendEmailNotification(user, product, queueItem);
          break;
        case 'sms':
          result = await this.sendSMSNotification(user, product, queueItem);
          break;
        default:
          throw new Error(`Unknown channel: ${queueItem.channel}`);
      }

      // Mark as sent
      await queueItem.update({
        status: 'sent',
        sent_at: new Date()
      });

      // Log notification
      await NotificationLog.create({
        user_id: queueItem.user_id,
        product_id: queueItem.product_id,
        notification_type: queueItem.notification_type,
        title: queueItem.title,
        body: queueItem.body,
        was_successful: true,
        error_message: null
      });

      return result;
    } catch (error) {
      console.error(`Error processing queue item ${queueItem.queue_id}:`, error);
      
      const retryCount = queueItem.retry_count + 1;
      
      if (retryCount < queueItem.max_retries) {
        // Retry later (exponential backoff)
        const retryDelay = Math.pow(2, retryCount) * 60 * 1000; // 2^retryCount minutes
        await queueItem.update({
          status: 'pending',
          retry_count: retryCount,
          scheduled_for: new Date(Date.now() + retryDelay)
        });
      } else {
        // Max retries reached, mark as failed
        await queueItem.update({
          status: 'failed',
          failed_at: new Date(),
          error_message: error.message
        });

        // Log failed notification
        await NotificationLog.create({
          user_id: queueItem.user_id,
          product_id: queueItem.product_id,
          notification_type: queueItem.notification_type,
          title: queueItem.title,
          body: queueItem.body,
          was_successful: false,
          error_message: error.message
        });
      }

      throw error;
    }
  }

  // Send push notification
  async sendPushNotification(user, queueItem) {
    if (!user.fcm_token) {
      throw new Error('User FCM token not available');
    }

    const result = await sendNotification(
      user.fcm_token,
      {
        title: queueItem.title,
        body: queueItem.body
      },
      queueItem.action_data || {}
    );

    if (result.error === 'invalid_token') {
      await user.update({ fcm_token: null });
    }

    return result;
  }

  // Send email notification
  async sendEmailNotification(user, product, queueItem) {
    if (!user.email) {
      throw new Error('User email not available');
    }

    const daysUntilExpiry = product && product.warranty_end_date
      ? this.calculateDaysUntilExpiry(product.warranty_end_date)
      : null;

    return await emailService.sendWarrantyNotification(
      user,
      product || { product_name: 'Product' },
      queueItem.notification_type,
      daysUntilExpiry
    );
  }

  // Send SMS notification
  async sendSMSNotification(user, product, queueItem) {
    if (!user.phone_number) {
      throw new Error('User phone number not available');
    }

    const daysUntilExpiry = product && product.warranty_end_date
      ? this.calculateDaysUntilExpiry(product.warranty_end_date)
      : null;

    return await smsService.sendWarrantyNotification(
      user,
      product || { product_name: 'Product' },
      queueItem.notification_type,
      daysUntilExpiry
    );
  }

  // Check and send warranty expiry notifications (enhanced)
  async checkWarrantyExpirations() {
    try {
      console.log('Starting warranty expiration check...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active users with notifications enabled
      const users = await User.findAll({
        where: {
          notification_enabled: true
        },
        include: [{
          model: NotificationPreference,
          required: false
        }]
      });

      console.log(`Found ${users.length} users with notifications enabled`);

      for (const user of users) {
        await this.checkUserWarranties(user, today);
      }

      // Process queue
      await this.processQueue();

      console.log('Warranty expiration check completed');
    } catch (error) {
      console.error('Error in checkWarrantyExpirations:', error);
    }
  }

  async checkUserWarranties(user, today) {
    try {
      const preferences = await this.getUserPreferences(user.user_id);
      
      if (!preferences.notifications_enabled) {
        return;
      }

      // Get user's active products
      const products = await Product.findAll({
        where: {
          user_id: user.user_id,
          is_active: true,
          warranty_end_date: { [Op.ne]: null }
        },
        include: [{
          model: Category,
          attributes: ['category_id', 'category_name']
        }]
      });

      for (const product of products) {
        if (!product.warranty_end_date) continue;

        const daysUntilExpiry = this.calculateDaysUntilExpiry(product.warranty_end_date);
        
        // Get reminder intervals (use custom intervals if set for product, otherwise use preferences)
        let intervals = preferences.reminder_intervals || [3, 7, 14, 30];
        
        const schedule = await NotificationSchedule.findOne({
          where: {
            user_id: user.user_id,
            product_id: product.product_id
          }
        });

        if (schedule && schedule.custom_intervals) {
          intervals = schedule.custom_intervals;
        }

        // Check if we should send notification for this day
        if (intervals.includes(Math.abs(daysUntilExpiry))) {
          // Check if notification was already sent
          const lastNotification = schedule?.last_notification_sent;
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);

          if (lastNotification && new Date(lastNotification) >= todayStart) {
            continue; // Already sent today
          }

          // Check if should send based on preferences
          const shouldSend = await this.shouldSendNotification(
            user.user_id,
            product,
            daysUntilExpiry < 0 ? 'expired' : `${Math.abs(daysUntilExpiry)}_days`
          );

          if (!shouldSend) {
            continue;
          }

          // Determine notification type
          let notificationType;
          if (daysUntilExpiry < 0) {
            notificationType = 'expired';
          } else if (daysUntilExpiry === 0) {
            notificationType = 'expiring_today';
          } else {
            notificationType = `${daysUntilExpiry}_days`;
          }

          // Determine channels
          const channels = [];
          if (preferences.push_enabled && user.fcm_token) {
            channels.push('push');
          }
          if (preferences.email_enabled && user.email) {
            channels.push('email');
          }
          if (preferences.sms_enabled && user.phone_number) {
            channels.push('sms');
          }

          if (channels.length === 0) {
            continue;
          }

          // Calculate scheduled time based on preferences
          const scheduledFor = this.calculateScheduledTime(preferences);

          // Queue notification
          await this.queueNotification(
            user.user_id,
            product.product_id,
            notificationType,
            channels,
            this.getNotificationPriority(daysUntilExpiry),
            scheduledFor
          );

          // Update schedule
          if (schedule) {
            await schedule.update({
              last_notification_type: notificationType,
              last_notification_sent: new Date(),
              next_notification_date: this.getNextNotificationDate(intervals, daysUntilExpiry),
              next_notification_type: this.getNextNotificationType(intervals, daysUntilExpiry)
            });
          } else {
            await NotificationSchedule.create({
              user_id: user.user_id,
              product_id: product.product_id,
              last_notification_type: notificationType,
              last_notification_sent: new Date(),
              next_notification_date: this.getNextNotificationDate(intervals, daysUntilExpiry),
              next_notification_type: this.getNextNotificationType(intervals, daysUntilExpiry)
            });
          }
        }
      }

      // Update last check time
      await user.update({ last_notification_check: new Date() });
      
    } catch (error) {
      console.error(`Error checking warranties for user ${user.user_id}:`, error);
    }
  }

  // Calculate scheduled time based on preferences
  calculateScheduledTime(preferences) {
    const now = new Date();
    const [hours, minutes] = preferences.notification_time.split(':').map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);

    // If scheduled time has passed today, schedule for tomorrow
    if (scheduled < now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    return scheduled;
  }

  // Get next notification date
  getNextNotificationDate(intervals, currentDaysUntilExpiry) {
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const nextInterval = sortedIntervals.find(interval => interval < Math.abs(currentDaysUntilExpiry));
    
    if (!nextInterval) {
      return null; // No more notifications
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + (Math.abs(currentDaysUntilExpiry) - nextInterval));
    
    return nextDate;
  }

  // Get next notification type
  getNextNotificationType(intervals, currentDaysUntilExpiry) {
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const nextInterval = sortedIntervals.find(interval => interval < Math.abs(currentDaysUntilExpiry));
    
    if (!nextInterval) {
      return null;
    }

    return `${nextInterval}_days`;
  }

  // Get notification content
  getNotificationContent(product, type, daysUntilExpiry = null) {
    const productName = product.product_name;
    
    if (daysUntilExpiry !== null) {
      if (daysUntilExpiry < 0) {
        return {
          title: '⏰ Warranty Expired',
          body: `The warranty for "${productName}" has expired.`
        };
      } else if (daysUntilExpiry === 0) {
        return {
          title: '⚠️ Warranty Expiring Today',
          body: `Your warranty for "${productName}" expires today!`
        };
      } else {
        return {
          title: '⚠️ Warranty Expiring Soon',
          body: `Your warranty for "${productName}" expires in ${daysUntilExpiry} days!`
        };
      }
    }

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

  // Send custom notification to user (enhanced)
  async sendCustomNotification(userId, title, body, data = {}, channels = ['push']) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences.notifications_enabled) {
        return { success: false, message: 'Notifications disabled' };
      }

      // Filter channels based on preferences
      const enabledChannels = channels.filter(channel => {
        if (channel === 'push') return preferences.push_enabled && user.fcm_token;
        if (channel === 'email') return preferences.email_enabled && user.email;
        if (channel === 'sms') return preferences.sms_enabled && user.phone_number;
        return false;
      });

      if (enabledChannels.length === 0) {
        return { success: false, message: 'No enabled channels available' };
      }

      // Queue notification
      await this.queueNotification(
        userId,
        null,
        'custom',
        enabledChannels,
        data.priority || 'normal',
        new Date()
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending custom notification:', error);
      return { success: false, message: error.message };
    }
  }

  // Snooze notification
  async snoozeNotification(userId, productId, hours) {
    const schedule = await NotificationSchedule.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });

    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);

    if (schedule) {
      await schedule.update({
        is_snoozed: true,
        snooze_until: snoozeUntil
      });
    } else {
      await NotificationSchedule.create({
        user_id: userId,
        product_id: productId,
        is_snoozed: true,
        snooze_until: snoozeUntil
      });
    }

    // Cancel pending notifications for this product
    await NotificationQueue.update(
      { status: 'cancelled' },
      {
        where: {
          user_id: userId,
          product_id: productId,
          status: 'pending'
        }
      }
    );

    return { success: true, snooze_until: snoozeUntil };
  }

  // Unsnooze notification
  async unsnoozeNotification(userId, productId) {
    const schedule = await NotificationSchedule.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });

    if (schedule) {
      await schedule.update({
        is_snoozed: false,
        snooze_until: null
      });
    }

    return { success: true };
  }
}

module.exports = new NotificationService();
