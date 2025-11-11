const { User, NotificationLog, NotificationPreference, NotificationSchedule, NotificationQueue, Product } = require('../models');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const { Op } = require('sequelize');

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

    // Ensure preferences exist
    await notificationService.getUserPreferences(req.user.user_id);

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

    // Update preferences
    const preferences = await notificationService.getUserPreferences(req.user.user_id);
    await preferences.update({ notifications_enabled: enabled });

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
    const preferences = await notificationService.getUserPreferences(req.user.user_id);

    res.json({
      notification_enabled: req.user.notification_enabled,
      has_token: !!req.user.fcm_token,
      last_check: req.user.last_notification_check,
      preferences: preferences
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Get notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const preferences = await notificationService.getUserPreferences(req.user.user_id);
    res.json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const {
      notifications_enabled,
      push_enabled,
      email_enabled,
      sms_enabled,
      notification_time,
      quiet_hours_start,
      quiet_hours_end,
      timezone,
      reminder_intervals,
      category_settings,
      group_notifications,
      max_daily_notifications,
      dnd_enabled,
      dnd_start,
      dnd_end,
      priority_filter,
      notification_sound,
      vibration_enabled
    } = req.body;

    const preferences = await notificationService.getUserPreferences(req.user.user_id);

    const updateData = {};
    if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled;
    if (push_enabled !== undefined) updateData.push_enabled = push_enabled;
    if (email_enabled !== undefined) updateData.email_enabled = email_enabled;
    if (sms_enabled !== undefined) updateData.sms_enabled = sms_enabled;
    if (notification_time !== undefined) updateData.notification_time = notification_time;
    if (quiet_hours_start !== undefined) updateData.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) updateData.quiet_hours_end = quiet_hours_end;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (reminder_intervals !== undefined) updateData.reminder_intervals = reminder_intervals;
    if (category_settings !== undefined) updateData.category_settings = category_settings;
    if (group_notifications !== undefined) updateData.group_notifications = group_notifications;
    if (max_daily_notifications !== undefined) updateData.max_daily_notifications = max_daily_notifications;
    if (dnd_enabled !== undefined) updateData.dnd_enabled = dnd_enabled;
    if (dnd_start !== undefined) updateData.dnd_start = dnd_start;
    if (dnd_end !== undefined) updateData.dnd_end = dnd_end;
    if (priority_filter !== undefined) updateData.priority_filter = priority_filter;
    if (notification_sound !== undefined) updateData.notification_sound = notification_sound;
    if (vibration_enabled !== undefined) updateData.vibration_enabled = vibration_enabled;

    await preferences.update(updateData);

    res.json({
      message: 'Preferences updated successfully',
      preferences: preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Get product schedule
exports.getProductSchedule = async (req, res) => {
  try {
    const { productId } = req.params;

    const schedule = await NotificationSchedule.findOne({
      where: {
        user_id: req.user.user_id,
        product_id: productId
      },
      include: [{
        model: Product,
        attributes: ['product_id', 'product_name', 'warranty_end_date']
      }]
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Get product schedule error:', error);
    res.status(500).json({ error: 'Failed to get product schedule' });
  }
};

// Update product schedule
exports.updateProductSchedule = async (req, res) => {
  try {
    const { productId } = req.params;
    const { custom_intervals, is_active } = req.body;

    let schedule = await NotificationSchedule.findOne({
      where: {
        user_id: req.user.user_id,
        product_id: productId
      }
    });

    if (!schedule) {
      schedule = await NotificationSchedule.create({
        user_id: req.user.user_id,
        product_id: productId,
        custom_intervals: custom_intervals || null,
        is_active: is_active !== undefined ? is_active : true
      });
    } else {
      const updateData = {};
      if (custom_intervals !== undefined) updateData.custom_intervals = custom_intervals;
      if (is_active !== undefined) updateData.is_active = is_active;
      await schedule.update(updateData);
    }

    res.json({
      message: 'Product schedule updated successfully',
      schedule: schedule
    });
  } catch (error) {
    console.error('Update product schedule error:', error);
    res.status(500).json({ error: 'Failed to update product schedule' });
  }
};

// Snooze notification
exports.snoozeNotification = async (req, res) => {
  try {
    const { product_id, hours } = req.body;

    if (!product_id || !hours) {
      return res.status(400).json({ error: 'product_id and hours are required' });
    }

    const result = await notificationService.snoozeNotification(
      req.user.user_id,
      product_id,
      hours
    );

    res.json(result);
  } catch (error) {
    console.error('Snooze notification error:', error);
    res.status(500).json({ error: 'Failed to snooze notification' });
  }
};

// Unsnooze notification
exports.unsnoozeNotification = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const result = await notificationService.unsnoozeNotification(
      req.user.user_id,
      product_id
    );

    res.json(result);
  } catch (error) {
    console.error('Unsnooze notification error:', error);
    res.status(500).json({ error: 'Failed to unsnooze notification' });
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
          model: Product,
          attributes: ['product_id', 'product_name', 'brand'],
          required: false
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

// Get notification queue status
exports.getQueueStatus = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const where = { user_id: req.user.user_id };
    if (status) {
      where.status = status;
    }

    const queueItems = await NotificationQueue.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: Product,
        attributes: ['product_id', 'product_name'],
        required: false
      }]
    });

    res.json({
      queue: queueItems,
      count: queueItems.length
    });
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
};

// Test notification (for development)
exports.sendTestNotification = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    const { channel = 'all' } = req.body;

    const channels = channel === 'all' ? ['push', 'email', 'sms'] : [channel];
    
    // Filter based on what's available
    const enabledChannels = [];
    if (channels.includes('push') && req.user.fcm_token) enabledChannels.push('push');
    if (channels.includes('email') && req.user.email) enabledChannels.push('email');
    if (channels.includes('sms') && req.user.phone_number) enabledChannels.push('sms');

    if (enabledChannels.length === 0) {
      return res.status(400).json({ error: 'No enabled channels available for testing' });
    }

    const result = await notificationService.sendCustomNotification(
      req.user.user_id,
      'Test Notification',
      'This is a test notification from Warranty Manager',
      { test: true },
      enabledChannels
    );

    res.json({
      ...result,
      channels_tested: enabledChannels
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
};

// Test email
exports.testEmail = async (req, res) => {
  try {
    if (!req.user.email) {
      return res.status(400).json({ error: 'User email not available' });
    }

    await emailService.sendTestEmail(req.user.email);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
};

// Test SMS
exports.testSMS = async (req, res) => {
  try {
    if (!req.user.phone_number) {
      return res.status(400).json({ error: 'User phone number not available' });
    }

    await smsService.sendTestSMS(req.user.phone_number);
    res.json({ message: 'Test SMS sent successfully' });
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({ error: 'Failed to send test SMS', details: error.message });
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

// Process notification queue (admin/dev only)
exports.processQueue = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    await notificationService.processQueue();
    
    res.json({ message: 'Queue processed successfully' });
  } catch (error) {
    console.error('Process queue error:', error);
    res.status(500).json({ error: 'Failed to process queue' });
  }
};
