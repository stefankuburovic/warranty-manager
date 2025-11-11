class SMSService {
  constructor() {
    this.client = null;
    this.phoneNumber = null;
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !this.phoneNumber) {
        console.warn('⚠ SMS service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env');
        return;
      }

      // Only require twilio if credentials are provided
      const twilio = require('twilio');
      this.client = twilio(accountSid, authToken);
      this.initialized = true;
      console.log('✓ SMS service initialized');
    } catch (error) {
      console.warn('⚠ SMS service initialization failed:', error.message);
      console.warn('⚠ Install twilio package: npm install twilio');
    }
  }

  async sendSMS({ to, body }) {
    if (!this.initialized || !this.client) {
      throw new Error('SMS service not configured');
    }

    if (!to || !body) {
      throw new Error('Phone number and message body are required');
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.phoneNumber,
        to
      });

      console.log('SMS sent successfully:', message.sid);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendWarrantyNotification(user, product, notificationType, daysUntilExpiry = null) {
    if (!user.phone_number) {
      throw new Error('User phone number not available');
    }

    const productName = product.product_name || 'Product';
    const brand = product.brand || '';
    const warrantyEndDate = product.warranty_end_date 
      ? new Date(product.warranty_end_date).toLocaleDateString()
      : 'N/A';

    let body;

    switch (notificationType) {
      case 'expired':
        body = `⚠️ Warranty Expired: ${productName}${brand ? ` (${brand})` : ''} expired on ${warrantyEndDate}. Contact manufacturer/store for claims.`;
        break;
      
      case '7_days':
        body = `⚠️ Warranty Expiring: ${productName}${brand ? ` (${brand})` : ''} expires in 7 days (${warrantyEndDate}). Check warranty claims!`;
        break;
      
      case '30_days':
        body = `📅 Warranty Reminder: ${productName}${brand ? ` (${brand})` : ''} expires in 30 days (${warrantyEndDate}).`;
        break;
      
      default:
        if (daysUntilExpiry !== null) {
          body = `📅 Warranty Reminder: ${productName}${brand ? ` (${brand})` : ''} expires in ${daysUntilExpiry} days (${warrantyEndDate}).`;
        } else {
          body = `Warranty Notification: Update about ${productName}${brand ? ` (${brand})` : ''}.`;
        }
    }

    return await this.sendSMS({
      to: user.phone_number,
      body
    });
  }

  async sendTestSMS(phoneNumber) {
    return await this.sendSMS({
      to: phoneNumber,
      body: 'Test SMS from Warranty Manager. Your SMS notifications are working correctly!'
    });
  }
}

module.exports = new SMSService();

