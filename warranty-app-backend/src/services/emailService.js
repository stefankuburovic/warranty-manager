const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
        console.warn('⚠ Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      this.initialized = true;
      console.log('✓ Email service initialized');
    } catch (error) {
      console.warn('⚠ Email service initialization failed:', error.message);
    }
  }

  async sendEmail({ to, subject, text, html, attachments = [] }) {
    if (!this.initialized || !this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      const mailOptions = {
        from: `"Warranty Manager" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendWarrantyNotification(user, product, notificationType, daysUntilExpiry = null) {
    const appUrl = process.env.APP_URL || 'https://warrantymanager.app';
    const productName = product.product_name || 'Product';
    const brand = product.brand || '';
    const warrantyEndDate = product.warranty_end_date 
      ? new Date(product.warranty_end_date).toLocaleDateString()
      : 'N/A';

    let subject, text, html;

    switch (notificationType) {
      case 'expired':
        subject = `⚠️ Warranty Expired: ${productName}`;
        text = `Your warranty for "${productName}"${brand ? ` (${brand})` : ''} has expired on ${warrantyEndDate}.`;
        html = this.getExpiredEmailTemplate(productName, brand, warrantyEndDate, appUrl, product.product_id);
        break;
      
      case '7_days':
        subject = `⚠️ Warranty Expiring Soon: ${productName}`;
        text = `Your warranty for "${productName}"${brand ? ` (${brand})` : ''} expires in 7 days (${warrantyEndDate}).`;
        html = this.getExpiringEmailTemplate(productName, brand, warrantyEndDate, 7, appUrl, product.product_id);
        break;
      
      case '30_days':
        subject = `📅 Warranty Reminder: ${productName}`;
        text = `Your warranty for "${productName}"${brand ? ` (${brand})` : ''} expires in 30 days (${warrantyEndDate}).`;
        html = this.getExpiringEmailTemplate(productName, brand, warrantyEndDate, 30, appUrl, product.product_id);
        break;
      
      default:
        if (daysUntilExpiry !== null) {
          subject = `📅 Warranty Reminder: ${productName}`;
          text = `Your warranty for "${productName}"${brand ? ` (${brand})` : ''} expires in ${daysUntilExpiry} days (${warrantyEndDate}).`;
          html = this.getExpiringEmailTemplate(productName, brand, warrantyEndDate, daysUntilExpiry, appUrl, product.product_id);
        } else {
          subject = `Warranty Notification: ${productName}`;
          text = `Update about your warranty for "${productName}"${brand ? ` (${brand})` : ''}.`;
          html = this.getGenericEmailTemplate(productName, brand, appUrl, product.product_id);
        }
    }

    return await this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  getExpiredEmailTemplate(productName, brand, warrantyEndDate, appUrl, productId) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Warranty Expired</h1>
          </div>
          <div class="content">
            <h2>${productName}${brand ? ` (${brand})` : ''}</h2>
            <p>Your warranty has expired on <strong>${warrantyEndDate}</strong>.</p>
            <p>If you need to make a warranty claim, please contact the manufacturer or store as soon as possible.</p>
            <a href="${appUrl}/products/${productId}" class="button">View Product Details</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from Warranty Manager.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getExpiringEmailTemplate(productName, brand, warrantyEndDate, daysLeft, appUrl, productId) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Warranty Expiring Soon</h1>
          </div>
          <div class="content">
            <h2>${productName}${brand ? ` (${brand})` : ''}</h2>
            <p>Your warranty expires in <strong>${daysLeft} days</strong> on <strong>${warrantyEndDate}</strong>.</p>
            <p>Don't forget to check if you need to make any warranty claims before it expires!</p>
            <a href="${appUrl}/products/${productId}" class="button">View Product Details</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from Warranty Manager.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getGenericEmailTemplate(productName, brand, appUrl, productId) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Warranty Manager</h1>
          </div>
          <div class="content">
            <h2>${productName}${brand ? ` (${brand})` : ''}</h2>
            <p>You have a new notification about your warranty.</p>
            <a href="${appUrl}/products/${productId}" class="button">View Product Details</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from Warranty Manager.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendTestEmail(userEmail) {
    return await this.sendEmail({
      to: userEmail,
      subject: 'Test Email from Warranty Manager',
      text: 'This is a test email to verify your email notification settings.',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify your email notification settings.</p>
        <p>If you received this email, your email notifications are working correctly!</p>
      `
    });
  }
}

module.exports = new EmailService();

