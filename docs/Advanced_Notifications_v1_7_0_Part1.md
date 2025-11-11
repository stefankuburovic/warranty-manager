# Advanced Notifications v1.7.0 - Part 1: Backend Implementation

## 📱 Overview

This is Part 1 of the Advanced Notifications implementation, focusing on the backend enhancements. Part 2 will cover the complete mobile implementation.

**New Features in v1.7.0:**
- ⏰ Customizable notification schedules (3, 7, 14, 30, 60, 90 days)
- 📧 Multiple channels: Push, Email, SMS
- 🎨 Rich notifications with images and action buttons
- 🧠 Smart grouping and priority levels
- ⚡ Snooze functionality
- 🔕 Quiet hours and Do Not Disturb
- 📊 Per-category and per-product preferences
- 🚀 Notification queue system with retry logic

---

## 🗄️ Database Migrations

Run these migrations to add the new tables:

### Migration 1: notification_preferences table

```sql
CREATE TABLE notification_preferences (
  preference_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Global settings
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Channels
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timing
  notification_time TIME DEFAULT '09:00:00',
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  timezone VARCHAR(50) DEFAULT 'Europe/Belgrade',
  
  -- Reminder intervals (JSON array of days)
  reminder_intervals JSONB DEFAULT '[3, 7, 14, 30]',
  
  -- Category-specific settings (JSON object)
  category_settings JSONB DEFAULT '{}',
  
  -- Grouping
  group_notifications BOOLEAN DEFAULT TRUE,
  max_daily_notifications INTEGER DEFAULT 10,
  
  -- Do Not Disturb
  dnd_enabled BOOLEAN DEFAULT FALSE,
  dnd_start TIME,
  dnd_end TIME,
  
  -- Advanced
  priority_filter VARCHAR(20) DEFAULT 'all' CHECK (priority_filter IN ('all', 'high_only', 'critical_only')),
  notification_sound VARCHAR(50) DEFAULT 'default',
  vibration_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
```

### Migration 2: notification_schedules table

```sql
CREATE TABLE notification_schedules (
  schedule_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  
  -- Custom settings for this product
  custom_intervals JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_snoozed BOOLEAN DEFAULT FALSE,
  snooze_until TIMESTAMP,
  
  -- Last notification
  last_notification_type VARCHAR(20),
  last_notification_sent TIMESTAMP,
  
  -- Next scheduled
  next_notification_date TIMESTAMP,
  next_notification_type VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_notification_schedules_user_product ON notification_schedules(user_id, product_id);
CREATE INDEX idx_notification_schedules_snooze ON notification_schedules(is_snoozed, snooze_until);
```

### Migration 3: notification_queue table

```sql
CREATE TABLE notification_queue (
  queue_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(10) NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'in_app')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  
  -- Content
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  action_data JSONB,
  
  -- Scheduling
  scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_queue_user ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON notification_queue(status, scheduled_for);
CREATE INDEX idx_notification_queue_product ON notification_queue(product_id);
```

---

## 📦 Backend Dependencies

Add to `backend/package.json`:

```json
{
  "dependencies": {
    "nodemailer": "^6.9.7",
    "twilio": "^4.20.0",
    "bull": "^4.12.0",
    "ioredis": "^5.3.2"
  }
}
```

Install:
```bash
cd backend
npm install nodemailer twilio bull ioredis
```

---

## 🔐 Environment Variables

Add to `backend/.env`:

```bash
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SMS (Twilio - Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Redis (for queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# App URL (for email links)
APP_URL=https://warrantymanager.app
```

---

## 📝 Implementation Files

All implementation code is provided in the main document above. Here's a quick reference:

### Backend Models (4 new files):
1. `backend/src/models/NotificationPreference.js` - User notification preferences
2. `backend/src/models/NotificationSchedule.js` - Per-product schedules
3. `backend/src/models/NotificationQueue.js` - Notification queue
4. Update `backend/src/models/index.js` to include new models

### Backend Services (3 files):
1. `backend/src/services/emailService.js` - Email notification handling
2. `backend/src/services/smsService.js` - SMS notification handling (optional)
3. **Enhanced** `backend/src/services/notificationService.js` - Core notification logic

### Backend Controllers (1 enhanced file):
- **Enhanced** `backend/src/controllers/notificationController.js` - New endpoints

### Backend Routes (1 enhanced file):
- **Enhanced** `backend/src/routes/notifications.js` - New routes

---

## 🧪 Testing Backend

### Test Notification Preferences

```bash
# Get preferences
curl -X GET http://localhost:3000/api/v1/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update preferences
curl -X PUT http://localhost:3000/api/v1/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "push_enabled": true,
    "email_enabled": true,
    "sms_enabled": false,
    "reminder_intervals": [3, 7, 14, 30],
    "group_notifications": true,
    "notification_time": "09:00:00",
    "quiet_hours_start": "22:00:00",
    "quiet_hours_end": "08:00:00"
  }'
```

### Test Product Schedule

```bash
# Get product schedule
curl -X GET http://localhost:3000/api/v1/notifications/schedule/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Snooze notification
curl -X POST http://localhost:3000/api/v1/notifications/snooze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "hours": 24
  }'
```

### Test All Channels

```bash
# Test all notification channels
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "all"
  }'

# Test specific channel
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email"
  }'
```

---

## 📧 Email Setup Guide

### Option 1: Gmail

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password

3. Update `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### Option 2: SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Option 3: AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

---

## 📱 SMS Setup Guide (Optional)

### Twilio Setup

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get a phone number (free trial available)
3. Copy credentials from Console Dashboard
4. Update `.env`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** Twilio free trial has limitations (verified numbers only)

---

## ✅ Backend Checklist

- [ ] Run database migrations
- [ ] Install dependencies (`npm install`)
- [ ] Update environment variables
- [ ] Configure email service (Gmail/SendGrid/SES)
- [ ] (Optional) Configure SMS service (Twilio)
- [ ] Update models/index.js
- [ ] Test preferences API
- [ ] Test notification queue
- [ ] Test email sending
- [ ] Test SMS sending (if enabled)
- [ ] Verify scheduler is running

---

## 🚀 What's Next

**Part 2** (Mobile Implementation) will cover:
- Enhanced notification service with action buttons
- Rich notifications with images
- Notification preferences screen
- Per-product notification settings
- Snooze/unsnooze functionality
- Notification history enhancements
- Testing and integration

---

## 📊 Feature Comparison

| Feature | v1.0.0 Basic | v1.7.0 Advanced |
|---------|-------------|-----------------|
| Push Notifications | ✅ | ✅ |
| Email Notifications | ❌ | ✅ |
| SMS Notifications | ❌ | ✅ (optional) |
| Custom Schedules | ❌ (fixed 7, 30 days) | ✅ (3, 7, 14, 30, 60, 90 days) |
| Notification Grouping | ❌ | ✅ |
| Snooze Function | ❌ | ✅ |
| Quiet Hours | ❌ | ✅ |
| Do Not Disturb | ❌ | ✅ |
| Per-Category Settings | ❌ | ✅ |
| Priority Levels | ❌ | ✅ |
| Rich Notifications | ❌ | ✅ |
| Action Buttons | ❌ | ✅ |
| Notification Queue | ❌ | ✅ |
| Retry Logic | ❌ | ✅ |

---

This completes Part 1. Part 2 will be provided separately with full mobile implementation!
