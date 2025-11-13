const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const { s3 } = require('../config/storage');
const { getTranslations, formatDate, formatDateLong, normalizeLanguage } = require('../utils/pdfTranslations');
const fs = require('fs');
const path = require('path');

class PDFService {
  // Register Cyrillic-supporting font if available
  registerCyrillicFont(doc) {
    try {
      // Try common system font paths for Cyrillic support
      const fontPaths = [
        // Linux common paths
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        // macOS common paths
        '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
        '/Library/Fonts/Arial Unicode.ttf',
        // Windows common paths (if running on Windows)
        'C:/Windows/Fonts/arial.ttf',
        'C:/Windows/Fonts/arialuni.ttf',
        // Try project fonts directory if it exists
        path.join(__dirname, '../../fonts/DejaVuSans.ttf'),
        path.join(__dirname, '../../fonts/ArialUnicode.ttf'),
      ];

      for (const fontPath of fontPaths) {
        try {
          if (fs.existsSync(fontPath)) {
            doc.registerFont('CyrillicFont', fontPath);
            console.log('Registered Cyrillic font:', fontPath);
            return true;
          }
        } catch (err) {
          // Continue to next font path
        }
      }
      
      console.warn('No Cyrillic-supporting font found. Cyrillic characters may not display correctly.');
      console.warn('To fix this, add a font file (e.g., DejaVuSans.ttf) to the project and register it.');
      return false;
    } catch (error) {
      console.warn('Error registering Cyrillic font:', error.message);
      return false;
    }
  }

  // Get font name based on language
  getFontForLanguage(doc, language) {
    const normalizedLang = normalizeLanguage(language);
    
    // For Cyrillic, try to use registered font
    if (normalizedLang === 'sr-Cyrl') {
      // Check if Cyrillic font is registered
      if (doc._fontFamilies && doc._fontFamilies.CyrillicFont) {
        return 'CyrillicFont';
      }
      // Try to register it now
      if (this.registerCyrillicFont(doc)) {
        return 'CyrillicFont';
      }
    }
    
    // Default font for Latin and English
    return 'Helvetica';
  }

  // Ensure correct font is set for text that might contain Cyrillic
  ensureFontForText(doc, language, text) {
    const normalizedLang = normalizeLanguage(language);
    
    // Check if text contains Cyrillic characters
    const hasCyrillic = /[\u0400-\u04FF]/.test(text);
    
    if (hasCyrillic || normalizedLang === 'sr-Cyrl') {
      const font = this.getFontForLanguage(doc, language);
      doc.font(font);
    } else {
      // Use default font for Latin/English
      doc.font('Helvetica');
    }
  }
  
  // Generate PDF for single product
  async generateProductPDF(product, user, language = 'en') {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Generating PDF for product:', product.product_id, 'Language:', language);
        
        if (!product) {
          throw new Error('Product is required');
        }
        
        if (!user) {
          throw new Error('User is required');
        }

        const t = getTranslations(language);
        const normalizedLang = normalizeLanguage(language);

        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          info: {
            Title: `${t.warrantyInformation} - ${product.product_name}`,
            Author: t.appName,
            Subject: t.warrantyInformation
          }
        });

        // Register Cyrillic font if needed
        if (normalizedLang === 'sr-Cyrl') {
          this.registerCyrillicFont(doc);
        }
        
        // Set default font based on language
        const defaultFont = this.getFontForLanguage(doc, language);
        doc.font(defaultFont);

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          console.log('PDF generation completed, size:', Buffer.concat(chunks).length);
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', (error) => {
          console.error('PDF document error:', error);
          reject(error);
        });

        // Header
        await this.addHeader(doc, user, t, language);
        
        // Product Information
        await this.addProductInfo(doc, product, t, language);
        
        // Warranty Status
        await this.addWarrantyStatus(doc, product, t, language);
        
        // Store Information
        if (product.Store) {
          await this.addStoreInfo(doc, product.Store, t, language);
        }
        
        // Receipt Image (non-blocking - continues even if it fails)
        if (product.Documents && product.Documents.length > 0) {
          await this.addReceiptImage(doc, product.Documents[0], t);
        }
        
        // Footer
        this.addFooter(doc, t);
        
        doc.end();
      } catch (error) {
        console.error('PDF generation error:', error);
        console.error('Error stack:', error.stack);
        reject(error);
      }
    });
  }

  // Generate PDF for multiple products
  async generateBulkPDF(products, user, language = 'en') {
    return new Promise(async (resolve, reject) => {
      try {
        const t = getTranslations(language);
        const normalizedLang = normalizeLanguage(language);
        
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          info: {
            Title: t.warrantyReport,
            Author: t.appName,
            Subject: t.warrantyReport
          }
        });

        // Register Cyrillic font if needed
        if (normalizedLang === 'sr-Cyrl') {
          this.registerCyrillicFont(doc);
        }
        
        // Set default font based on language
        const defaultFont = this.getFontForLanguage(doc, language);
        doc.font(defaultFont);

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Cover Page
        await this.addCoverPage(doc, user, products.length, t, language);
        
        // Table of Contents
        doc.addPage();
        await this.addTableOfContents(doc, products, t);
        
        // Individual Product Pages
        for (let i = 0; i < products.length; i++) {
          doc.addPage();
          await this.addHeader(doc, user, t, language);
          await this.addProductInfo(doc, products[i], t, language);
          await this.addWarrantyStatus(doc, products[i], t, language);
          
          if (products[i].Store) {
            await this.addStoreInfo(doc, products[i].Store, t, language);
          }
          
          if (products[i].Documents && products[i].Documents.length > 0) {
            await this.addReceiptImage(doc, products[i].Documents[0], t);
          }
        }
        
        // Summary Page
        doc.addPage();
        await this.addSummaryPage(doc, products, t, language);
        
        // Add footer to all pages
        this.addFooter(doc, t);
        
        doc.end();
      } catch (error) {
        console.error('PDF generation error in generateBulkPDF:', error);
        console.error('Error stack:', error.stack);
        reject(error);
      }
    });
  }

  // Add header with logo and user info
  async addHeader(doc, user, t, language = 'en') {
    const y = 50;
    
    // App Title - ensure correct font
    this.ensureFontForText(doc, language, t.appName);
    doc.fontSize(20)
       .fillColor('#6200ee')
       .text(t.appName, 50, y, { align: 'left' });
    
    // User Info - handle missing fields gracefully
    const userName = user.full_name || user.username || user.email || 'User';
    const userEmail = user.email || '';
    
    this.ensureFontForText(doc, language, userName);
    doc.fontSize(10)
       .fillColor('#666')
       .text(userName, 400, y, { align: 'right' });
    
    if (userEmail) {
      this.ensureFontForText(doc, language, userEmail);
      doc.text(userEmail, 400, y + 15, { align: 'right' });
    }
    
    // Date
    const dateText = `${t.generated}: ${formatDate(new Date(), language)}`;
    this.ensureFontForText(doc, language, dateText);
    doc.fontSize(9)
       .text(dateText, 400, y + (userEmail ? 30 : 15), { align: 'right' });
    
    // Line separator
    doc.moveTo(50, y + 50)
       .lineTo(545, y + 50)
       .strokeColor('#e0e0e0')
       .stroke();
    
    doc.moveDown(3);
  }

  // Add product information section
  async addProductInfo(doc, product, t, language = 'en') {
    const y = doc.y + 20;
    
    // Section Title - Product Details
    this.ensureFontForText(doc, language, t.productDetails);
    doc.fontSize(14)
       .fillColor('#000')
       .text(t.productDetails, 50, y, { encoding: 'UTF-8' });
    
    doc.moveDown(1);
    
    // Product Name (Title) - ensure correct font for Cyrillic
    this.ensureFontForText(doc, language, product.product_name);
    doc.fontSize(18)
       .fillColor('#000')
       .text(product.product_name, 50, doc.y);
    
    doc.moveDown(0.5);
    
    // Brand
    if (product.brand) {
      this.ensureFontForText(doc, language, product.brand);
      doc.fontSize(14)
         .fillColor('#666')
         .text(product.brand);
    }
    
    doc.moveDown(1.5);
    
    // Details Grid
    const startY = doc.y;
    const leftCol = 50;
    const rightCol = 300;
    let currentY = startY;
    
    doc.fontSize(10).fillColor('#666');
    
    // Purchase Date
    doc.text(`${t.purchaseDate}:`, leftCol, currentY, { encoding: 'UTF-8' });
    doc.fillColor('#000')
       .text(formatDate(product.purchase_date, language), leftCol + 120, currentY, { encoding: 'UTF-8' });
    currentY += 20;
    
    // Purchase Price
    if (product.purchase_price) {
      doc.fillColor('#666')
         .text(`${t.purchasePrice}:`, leftCol, currentY, { encoding: 'UTF-8' });
      doc.fillColor('#000')
         .text(`${product.purchase_price} ${product.currency || 'RSD'}`, leftCol + 120, currentY, { encoding: 'UTF-8' });
      currentY += 20;
    }
    
    // Category
    if (product.Category) {
      this.ensureFontForText(doc, language, t.category);
      doc.fillColor('#666')
         .text(`${t.category}:`, leftCol, currentY);
      this.ensureFontForText(doc, language, product.Category.category_name);
      doc.fillColor('#000')
         .text(product.Category.category_name, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Model Number
    if (product.model_number) {
      this.ensureFontForText(doc, language, t.modelNumber);
      doc.fillColor('#666')
         .text(`${t.modelNumber}:`, leftCol, currentY);
      this.ensureFontForText(doc, language, product.model_number);
      doc.fillColor('#000')
         .text(product.model_number, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Serial Number
    if (product.serial_number) {
      this.ensureFontForText(doc, language, t.serialNumber);
      doc.fillColor('#666')
         .text(`${t.serialNumber}:`, leftCol, currentY);
      this.ensureFontForText(doc, language, product.serial_number);
      doc.fillColor('#000')
         .text(product.serial_number, leftCol + 120, currentY);
      currentY += 20;
    }
    
    doc.y = currentY + 10;
  }

  // Add warranty status section
  async addWarrantyStatus(doc, product, t, language = 'en') {
    const y = doc.y + 10;
    
    // Section Title
    this.ensureFontForText(doc, language, t.warrantyStatus);
    doc.fontSize(14)
       .fillColor('#000')
       .text(t.warrantyStatus, 50, y, { encoding: 'UTF-8' });
    
    doc.moveDown(1);
    
    const startY = doc.y;
    const today = new Date();
    
    // Calculate warranty end date if not present
    let warrantyEnd;
    if (product.warranty_end_date) {
      warrantyEnd = new Date(product.warranty_end_date);
    } else if (product.purchase_date && product.warranty_duration_months) {
      warrantyEnd = new Date(product.purchase_date);
      warrantyEnd.setMonth(warrantyEnd.getMonth() + product.warranty_duration_months);
    } else {
      warrantyEnd = new Date();
      warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1); // Default to 1 year if no data
    }
    
    const daysRemaining = Math.ceil((warrantyEnd - today) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining < 0;
    
    // Warranty Duration
    doc.fontSize(10)
       .fillColor('#666')
       .text(`${t.warrantyDuration}:`, 50, startY, { encoding: 'UTF-8' });
    const durationText = product.warranty_duration_months 
      ? `${product.warranty_duration_months} ${t.months}` 
      : t.notSpecified;
    doc.fillColor('#000')
       .text(durationText, 170, startY, { encoding: 'UTF-8' });
    
    // Warranty End Date
    doc.fillColor('#666')
       .text(`${t.warrantyExpires}:`, 50, startY + 20, { encoding: 'UTF-8' });
    doc.fillColor('#000')
       .text(formatDate(warrantyEnd, language), 170, startY + 20, { encoding: 'UTF-8' });
    
    // Status Badge
    const statusY = startY + 45;
    const statusColor = isExpired ? '#f44336' : daysRemaining <= 30 ? '#ff9800' : '#4caf50';
    const statusText = isExpired ? t.expired : daysRemaining <= 30 ? t.expiringSoon : t.active;
    
    doc.roundedRect(50, statusY, 120, 30, 5)
       .fillAndStroke(statusColor, statusColor);
    
    doc.fontSize(12)
       .fillColor('#fff')
       .text(statusText, 50, statusY + 8, { width: 120, align: 'center', encoding: 'UTF-8' });
    
    if (!isExpired) {
      doc.fontSize(10)
         .fillColor('#666')
         .text(`${daysRemaining} ${t.daysRemaining}`, 180, statusY + 10, { encoding: 'UTF-8' });
    }
    
    doc.y = statusY + 50;
  }

  // Add store information section
  async addStoreInfo(doc, store, t, language = 'en') {
    const y = doc.y + 10;
    
    // Section Title
    this.ensureFontForText(doc, language, t.storeInformation);
    doc.fontSize(14)
       .fillColor('#000')
       .text(t.storeInformation, 50, y, { encoding: 'UTF-8' });
    
    doc.moveDown(1);
    
    const startY = doc.y;
    
    doc.fontSize(10);
    
    // Store Name
    this.ensureFontForText(doc, language, t.store);
    doc.fillColor('#666').text(`${t.store}:`, 50, startY);
    this.ensureFontForText(doc, language, store.store_name);
    doc.fillColor('#000').text(store.store_name, 170, startY);
    
    // Store Chain
    if (store.store_chain) {
      this.ensureFontForText(doc, language, t.chain);
      doc.fillColor('#666').text(`${t.chain}:`, 50, startY + 20);
      this.ensureFontForText(doc, language, store.store_chain);
      doc.fillColor('#000').text(store.store_chain, 170, startY + 20);
    }
    
    // City
    if (store.city) {
      this.ensureFontForText(doc, language, t.city);
      doc.fillColor('#666').text(`${t.city}:`, 50, startY + 40);
      this.ensureFontForText(doc, language, store.city);
      doc.fillColor('#000').text(store.city, 170, startY + 40);
    }
    
    // Address
    if (store.address) {
      this.ensureFontForText(doc, language, t.address);
      doc.fillColor('#666').text(`${t.address}:`, 50, startY + 60);
      this.ensureFontForText(doc, language, store.address);
      doc.fillColor('#000').text(store.address, 170, startY + 60, { width: 300 });
    }
    
    doc.y = startY + 90;
  }

  // Add receipt image
  async addReceiptImage(doc, document, t) {
    try {
      // Validate document and cloud_storage_url
      if (!document || !document.cloud_storage_url) {
        console.warn('Document or cloud_storage_url is missing, skipping image');
        return;
      }

      // Validate AWS configuration
      if (!process.env.AWS_BUCKET_NAME) {
        console.warn('AWS_BUCKET_NAME not configured, skipping image');
        return;
      }

      const y = doc.y + 20;
      
      // Check if we have enough space, otherwise add new page
      if (y > 650) {
        doc.addPage();
        doc.y = 50;
      }
      
      // Section Title
      doc.fontSize(14)
         .fillColor('#000')
         .text(t.receiptImage, 50, doc.y, { encoding: 'UTF-8' });
      
      doc.moveDown(1);
      
      // Extract S3 key from cloud_storage_url
      // If it's a signed URL, extract the key; otherwise use it as-is
      let s3Key = document.cloud_storage_url;
      if (s3Key.includes('amazonaws.com') || s3Key.includes('?')) {
        // It's a signed URL, extract the key
        try {
          const urlParts = s3Key.split('/');
          const keyStartIndex = urlParts.findIndex(part => part.includes('users/'));
          if (keyStartIndex !== -1) {
            s3Key = urlParts.slice(keyStartIndex).join('/').split('?')[0];
          }
        } catch (e) {
          console.warn('Could not parse S3 URL, using as-is:', e.message);
        }
      }
      
      console.log('Downloading image from S3:', {
        bucket: process.env.AWS_BUCKET_NAME,
        key: s3Key,
        originalUrl: document.cloud_storage_url?.substring(0, 100)
      });
      
      // Download image from S3
      const s3Object = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key
      }).promise();
      
      // Validate S3 object has body
      if (!s3Object || !s3Object.Body) {
        throw new Error('S3 object body is empty');
      }
      
      console.log('Processing image with sharp, size:', s3Object.Body.length);
      
      // Process image - resize to fit page
      // Handle both images and PDFs
      let processedImage;
      const contentType = s3Object.ContentType || document.mime_type || 'image/jpeg';
      
      if (contentType === 'application/pdf') {
        // Skip PDF files - can't embed in PDF easily
        throw new Error('PDF documents cannot be embedded in PDF export');
      }
      
      processedImage = await sharp(s3Object.Body)
        .resize(495, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Add image to PDF
      const imageY = doc.y;
      doc.image(processedImage, 50, imageY, { 
        fit: [495, 400],
        align: 'center'
      });
      
      // Update y position
      doc.y = imageY + 410;
      
      console.log('Image added to PDF successfully');
      
    } catch (error) {
      console.error('Error adding receipt image:', error.message);
      console.error('Error details:', {
        document: document ? {
          id: document.document_id,
          hasUrl: !!document.cloud_storage_url,
          url: document.cloud_storage_url?.substring(0, 50)
        } : 'null',
        awsBucket: process.env.AWS_BUCKET_NAME ? 'configured' : 'missing'
      });
      
      // Continue without image if error
      const y = doc.y + 20;
      if (y > 650) {
        doc.addPage();
        doc.y = 50;
      }
      doc.fontSize(10)
         .fillColor('#999')
         .text(t.receiptImageNotAvailable, 50, doc.y, { encoding: 'UTF-8' });
      doc.moveDown(2);
    }
  }

  // Add cover page
  async addCoverPage(doc, user, productCount, t, language = 'en') {
    // Title
    doc.fontSize(30)
       .fillColor('#6200ee')
       .text(t.warrantyReport, 50, 200, { width: 495, align: 'center', encoding: 'UTF-8' });
    
    doc.moveDown(2);
    
    // User Info
    const userName = user.full_name || user.username || user.email || 'User';
    doc.fontSize(16)
       .fillColor('#000')
       .text(userName, 50, doc.y, { width: 495, align: 'center', encoding: 'UTF-8' });
    
    if (user.email) {
      doc.fontSize(12)
         .fillColor('#666')
         .text(user.email, 50, doc.y + 20, { width: 495, align: 'center', encoding: 'UTF-8' });
      doc.y += 20;
    }
    
    doc.moveDown(3);
    
    // Summary Box
    const boxY = doc.y;
    doc.roundedRect(150, boxY, 295, 100, 10)
       .fillAndStroke('#f5f5f5', '#e0e0e0');
    
    doc.fontSize(14)
       .fillColor('#000')
       .text(`${t.totalProducts}: ${productCount}`, 150, boxY + 20, { width: 295, align: 'center', encoding: 'UTF-8' });
    
    doc.fontSize(12)
       .fillColor('#666')
       .text(`${t.generated}: ${formatDateLong(new Date(), language)}`, 150, boxY + 50, { width: 295, align: 'center', encoding: 'UTF-8' });
    
    // Footer
    doc.fontSize(10)
       .fillColor('#999')
       .text(t.appName, 50, 750, { align: 'center', encoding: 'UTF-8' })
       .text(t.keepTrack, { align: 'center', encoding: 'UTF-8' });
  }

  // Add table of contents
  async addTableOfContents(doc, products, t) {
    doc.fontSize(20)
       .fillColor('#000')
       .text(t.tableOfContents, 50, 100, { encoding: 'UTF-8' });
    
    doc.moveDown(2);
    
    doc.fontSize(10);
    
    products.forEach((product, index) => {
      const y = doc.y;
      const pageNum = index + 4; // Adjust based on cover + TOC pages
      
      doc.fillColor('#000')
         .text(`${index + 1}. ${product.product_name}`, 50, y, { encoding: 'UTF-8' });
      
      doc.fillColor('#666')
         .text(`${t.page} ${pageNum}`, 500, y, { align: 'right', encoding: 'UTF-8' });
      
      if (product.brand) {
        doc.fontSize(9)
           .fillColor('#999')
           .text(product.brand, 70, y + 12, { encoding: 'UTF-8' });
      }
      
      doc.moveDown(1.5);
      doc.fontSize(10);
    });
  }

  // Add summary page
  async addSummaryPage(doc, products, t, language = 'en') {
    doc.fontSize(20)
       .fillColor('#000')
       .text(t.summary, 50, 100, { encoding: 'UTF-8' });
    
    doc.moveDown(2);
    
    // Calculate statistics
    const totalProducts = products.length;
    const today = new Date();
    const activeWarranties = products.filter(p => {
      if (!p.warranty_end_date) return false;
      try {
        return new Date(p.warranty_end_date) >= today;
      } catch (e) {
        return false;
      }
    }).length;
    const expiredWarranties = totalProducts - activeWarranties;
    const totalSpent = products.reduce((sum, p) => sum + (parseFloat(p.purchase_price) || 0), 0);
    
    // Statistics Grid
    doc.fontSize(12);
    let y = doc.y;
    
    doc.fillColor('#666').text(`${t.totalProducts}:`, 50, y, { encoding: 'UTF-8' });
    doc.fillColor('#000').text(totalProducts.toString(), 200, y, { encoding: 'UTF-8' });
    y += 30;
    
    doc.fillColor('#666').text(`${t.activeWarranties}:`, 50, y, { encoding: 'UTF-8' });
    doc.fillColor('#4caf50').text(activeWarranties.toString(), 200, y, { encoding: 'UTF-8' });
    y += 30;
    
    doc.fillColor('#666').text(`${t.expiredWarranties}:`, 50, y, { encoding: 'UTF-8' });
    doc.fillColor('#f44336').text(expiredWarranties.toString(), 200, y, { encoding: 'UTF-8' });
    y += 30;
    
    doc.fillColor('#666').text(`${t.totalSpent}:`, 50, y, { encoding: 'UTF-8' });
    doc.fillColor('#000').text(`${totalSpent.toLocaleString(language === 'sr-Latn' ? 'sr-RS' : 'en-US')} RSD`, 200, y, { encoding: 'UTF-8' });
    
    doc.moveDown(4);
    
    // Products by Category
    doc.fontSize(14)
       .fillColor('#000')
       .text(t.productsByCategory, 50, doc.y, { encoding: 'UTF-8' });
    
    doc.moveDown(1);
    
    const categoryCount = {};
    products.forEach(p => {
      if (p.Category) {
        const name = p.Category.category_name;
        categoryCount[name] = (categoryCount[name] || 0) + 1;
      }
    });
    
    doc.fontSize(10);
    Object.entries(categoryCount).forEach(([category, count]) => {
      doc.fillColor('#666').text(`${category}:`, 50, doc.y, { encoding: 'UTF-8' });
      const itemText = count > 1 ? `${count} ${t.items}` : `1 ${t.item}`;
      doc.fillColor('#000').text(itemText, 200, doc.y, { encoding: 'UTF-8' });
      doc.moveDown(0.8);
    });
  }

  // Add footer to each page
  addFooter(doc, t) {
    try {
      const pages = doc.bufferedPageRange();
      
      if (!pages || typeof pages.count !== 'number' || pages.count === 0) {
        console.warn('No pages found for footer, skipping');
        return;
      }
      
      // bufferedPageRange() returns {start: number, count: number}
      // start is the first buffered page index, count is the number of buffered pages
      const startPage = pages.start !== undefined ? pages.start : 0;
      const totalPages = pages.count;
      
      // Iterate through all buffered pages
      for (let i = 0; i < totalPages; i++) {
        const pageIndex = startPage + i;
        try {
          // Switch to the page (0-indexed)
          doc.switchToPage(pageIndex);
          
          // Page number (1-indexed for display)
          const pageNumber = pageIndex + 1;
          const totalPageCount = startPage + totalPages;
          
          doc.fontSize(9)
             .fillColor('#999')
             .text(
               `${t.page} ${pageNumber} of ${totalPageCount}`,
               50,
               doc.page.height - 50,
               { align: 'center', encoding: 'UTF-8' }
             );
          
          // App name
          doc.text(
            t.generatedBy,
            50,
            doc.page.height - 35,
            { align: 'center', encoding: 'UTF-8' }
          );
        } catch (pageError) {
          console.error(`Error adding footer to page ${pageIndex}:`, pageError.message);
          // Continue with next page - don't let one page failure stop the process
        }
      }
    } catch (error) {
      console.error('Error adding footer:', error.message);
      // Don't throw - footer is not critical, PDF will still be generated
    }
  }
}

module.exports = new PDFService();

