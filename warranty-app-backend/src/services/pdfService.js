const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const { s3 } = require('../config/storage');

class PDFService {
  
  // Generate PDF for single product
  async generateProductPDF(product, user) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Generating PDF for product:', product.product_id);
        
        if (!product) {
          throw new Error('Product is required');
        }
        
        if (!user) {
          throw new Error('User is required');
        }

        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          info: {
            Title: `Warranty - ${product.product_name}`,
            Author: 'Warranty Manager',
            Subject: 'Product Warranty Information'
          }
        });

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
        await this.addHeader(doc, user);
        
        // Product Information
        await this.addProductInfo(doc, product);
        
        // Warranty Status
        await this.addWarrantyStatus(doc, product);
        
        // Store Information
        if (product.Store) {
          await this.addStoreInfo(doc, product.Store);
        }
        
        // Receipt Image (non-blocking - continues even if it fails)
        if (product.Documents && product.Documents.length > 0) {
          await this.addReceiptImage(doc, product.Documents[0]);
        }
        
        // Footer
        this.addFooter(doc);
        
        doc.end();
      } catch (error) {
        console.error('PDF generation error:', error);
        console.error('Error stack:', error.stack);
        reject(error);
      }
    });
  }

  // Generate PDF for multiple products
  async generateBulkPDF(products, user) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 50,
          info: {
            Title: 'Warranty Report',
            Author: 'Warranty Manager',
            Subject: 'All Warranties'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Cover Page
        await this.addCoverPage(doc, user, products.length);
        
        // Table of Contents
        doc.addPage();
        await this.addTableOfContents(doc, products);
        
        // Individual Product Pages
        for (let i = 0; i < products.length; i++) {
          doc.addPage();
          await this.addHeader(doc, user);
          await this.addProductInfo(doc, products[i]);
          await this.addWarrantyStatus(doc, products[i]);
          
          if (products[i].Store) {
            await this.addStoreInfo(doc, products[i].Store);
          }
          
          if (products[i].Documents && products[i].Documents.length > 0) {
            await this.addReceiptImage(doc, products[i].Documents[0]);
          }
        }
        
        // Summary Page
        doc.addPage();
        await this.addSummaryPage(doc, products);
        
        // Add footer to all pages
        this.addFooter(doc);
        
        doc.end();
      } catch (error) {
        console.error('PDF generation error in generateBulkPDF:', error);
        console.error('Error stack:', error.stack);
        reject(error);
      }
    });
  }

  // Add header with logo and user info
  async addHeader(doc, user) {
    const y = 50;
    
    // App Title
    doc.fontSize(20)
       .fillColor('#6200ee')
       .text('Warranty Manager', 50, y, { align: 'left' });
    
    // User Info - handle missing fields gracefully
    const userName = user.full_name || user.username || user.email || 'User';
    const userEmail = user.email || '';
    
    doc.fontSize(10)
       .fillColor('#666')
       .text(userName, 400, y, { align: 'right' });
    
    if (userEmail) {
      doc.text(userEmail, 400, y + 15, { align: 'right' });
    }
    
    // Date
    doc.fontSize(9)
       .text(`Generated: ${new Date().toLocaleDateString('en-US')}`, 400, y + (userEmail ? 30 : 15), { align: 'right' });
    
    // Line separator
    doc.moveTo(50, y + 50)
       .lineTo(545, y + 50)
       .strokeColor('#e0e0e0')
       .stroke();
    
    doc.moveDown(3);
  }

  // Add product information section
  async addProductInfo(doc, product) {
    const y = doc.y + 20;
    
    // Product Name (Title)
    doc.fontSize(18)
       .fillColor('#000')
       .text(product.product_name, 50, y);
    
    doc.moveDown(0.5);
    
    // Brand
    if (product.brand) {
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
    doc.text('Purchase Date:', leftCol, currentY);
    doc.fillColor('#000')
       .text(new Date(product.purchase_date).toLocaleDateString('en-US'), leftCol + 120, currentY);
    currentY += 20;
    
    // Purchase Price
    if (product.purchase_price) {
      doc.fillColor('#666')
         .text('Purchase Price:', leftCol, currentY);
      doc.fillColor('#000')
         .text(`${product.purchase_price} ${product.currency || 'RSD'}`, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Category
    if (product.Category) {
      doc.fillColor('#666')
         .text('Category:', leftCol, currentY);
      doc.fillColor('#000')
         .text(product.Category.category_name, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Model Number
    if (product.model_number) {
      doc.fillColor('#666')
         .text('Model Number:', leftCol, currentY);
      doc.fillColor('#000')
         .text(product.model_number, leftCol + 120, currentY);
      currentY += 20;
    }
    
    // Serial Number
    if (product.serial_number) {
      doc.fillColor('#666')
         .text('Serial Number:', leftCol, currentY);
      doc.fillColor('#000')
         .text(product.serial_number, leftCol + 120, currentY);
      currentY += 20;
    }
    
    doc.y = currentY + 10;
  }

  // Add warranty status section
  async addWarrantyStatus(doc, product) {
    const y = doc.y + 10;
    
    // Section Title
    doc.fontSize(14)
       .fillColor('#000')
       .text('Warranty Information', 50, y);
    
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
       .text('Warranty Duration:', 50, startY);
    const durationText = product.warranty_duration_months 
      ? `${product.warranty_duration_months} months` 
      : 'Not specified';
    doc.fillColor('#000')
       .text(durationText, 170, startY);
    
    // Warranty End Date
    doc.fillColor('#666')
       .text('Warranty Expires:', 50, startY + 20);
    doc.fillColor('#000')
       .text(warrantyEnd.toLocaleDateString('en-US'), 170, startY + 20);
    
    // Status Badge
    const statusY = startY + 45;
    const statusColor = isExpired ? '#f44336' : daysRemaining <= 30 ? '#ff9800' : '#4caf50';
    const statusText = isExpired ? 'EXPIRED' : daysRemaining <= 30 ? 'EXPIRING SOON' : 'ACTIVE';
    
    doc.roundedRect(50, statusY, 120, 30, 5)
       .fillAndStroke(statusColor, statusColor);
    
    doc.fontSize(12)
       .fillColor('#fff')
       .text(statusText, 50, statusY + 8, { width: 120, align: 'center' });
    
    if (!isExpired) {
      doc.fontSize(10)
         .fillColor('#666')
         .text(`${daysRemaining} days remaining`, 180, statusY + 10);
    }
    
    doc.y = statusY + 50;
  }

  // Add store information section
  async addStoreInfo(doc, store) {
    const y = doc.y + 10;
    
    // Section Title
    doc.fontSize(14)
       .fillColor('#000')
       .text('Store Information', 50, y);
    
    doc.moveDown(1);
    
    const startY = doc.y;
    
    doc.fontSize(10);
    
    // Store Name
    doc.fillColor('#666').text('Store:', 50, startY);
    doc.fillColor('#000').text(store.store_name, 170, startY);
    
    // Store Chain
    if (store.store_chain) {
      doc.fillColor('#666').text('Chain:', 50, startY + 20);
      doc.fillColor('#000').text(store.store_chain, 170, startY + 20);
    }
    
    // City
    if (store.city) {
      doc.fillColor('#666').text('City:', 50, startY + 40);
      doc.fillColor('#000').text(store.city, 170, startY + 40);
    }
    
    // Address
    if (store.address) {
      doc.fillColor('#666').text('Address:', 50, startY + 60);
      doc.fillColor('#000').text(store.address, 170, startY + 60, { width: 300 });
    }
    
    doc.y = startY + 90;
  }

  // Add receipt image
  async addReceiptImage(doc, document) {
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
         .text('Receipt Image', 50, doc.y);
      
      doc.moveDown(1);
      
      console.log('Downloading image from S3:', {
        bucket: process.env.AWS_BUCKET_NAME,
        key: document.cloud_storage_url
      });
      
      // Download image from S3
      const s3Object = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: document.cloud_storage_url
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
         .text('Receipt image not available', 50, doc.y);
      doc.moveDown(2);
    }
  }

  // Add cover page
  async addCoverPage(doc, user, productCount) {
    // Title
    doc.fontSize(30)
       .fillColor('#6200ee')
       .text('Warranty Report', 50, 200, { width: 495, align: 'center' });
    
    doc.moveDown(2);
    
    // User Info
    const userName = user.full_name || user.username || user.email || 'User';
    doc.fontSize(16)
       .fillColor('#000')
       .text(userName, 50, doc.y, { width: 495, align: 'center' });
    
    if (user.email) {
      doc.fontSize(12)
         .fillColor('#666')
         .text(user.email, 50, doc.y + 20, { width: 495, align: 'center' });
      doc.y += 20;
    }
    
    doc.moveDown(3);
    
    // Summary Box
    const boxY = doc.y;
    doc.roundedRect(150, boxY, 295, 100, 10)
       .fillAndStroke('#f5f5f5', '#e0e0e0');
    
    doc.fontSize(14)
       .fillColor('#000')
       .text(`Total Products: ${productCount}`, 150, boxY + 20, { width: 295, align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#666')
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, 150, boxY + 50, { width: 295, align: 'center' });
    
    // Footer
    doc.fontSize(10)
       .fillColor('#999')
       .text('Warranty Manager', 50, 750, { align: 'center' })
       .text('Keep track of all your warranties', { align: 'center' });
  }

  // Add table of contents
  async addTableOfContents(doc, products) {
    doc.fontSize(20)
       .fillColor('#000')
       .text('Table of Contents', 50, 100);
    
    doc.moveDown(2);
    
    doc.fontSize(10);
    
    products.forEach((product, index) => {
      const y = doc.y;
      const pageNum = index + 4; // Adjust based on cover + TOC pages
      
      doc.fillColor('#000')
         .text(`${index + 1}. ${product.product_name}`, 50, y);
      
      doc.fillColor('#666')
         .text(`Page ${pageNum}`, 500, y, { align: 'right' });
      
      if (product.brand) {
        doc.fontSize(9)
           .fillColor('#999')
           .text(product.brand, 70, y + 12);
      }
      
      doc.moveDown(1.5);
      doc.fontSize(10);
    });
  }

  // Add summary page
  async addSummaryPage(doc, products) {
    doc.fontSize(20)
       .fillColor('#000')
       .text('Summary', 50, 100);
    
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
    
    doc.fillColor('#666').text('Total Products:', 50, y);
    doc.fillColor('#000').text(totalProducts.toString(), 200, y);
    y += 30;
    
    doc.fillColor('#666').text('Active Warranties:', 50, y);
    doc.fillColor('#4caf50').text(activeWarranties.toString(), 200, y);
    y += 30;
    
    doc.fillColor('#666').text('Expired Warranties:', 50, y);
    doc.fillColor('#f44336').text(expiredWarranties.toString(), 200, y);
    y += 30;
    
    doc.fillColor('#666').text('Total Spent:', 50, y);
    doc.fillColor('#000').text(`${totalSpent.toLocaleString()} RSD`, 200, y);
    
    doc.moveDown(4);
    
    // Products by Category
    doc.fontSize(14)
       .fillColor('#000')
       .text('Products by Category', 50, doc.y);
    
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
      doc.fillColor('#666').text(`${category}:`, 50, doc.y);
      doc.fillColor('#000').text(`${count} item${count > 1 ? 's' : ''}`, 200, doc.y);
      doc.moveDown(0.8);
    });
  }

  // Add footer to each page
  addFooter(doc) {
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
               `Page ${pageNumber} of ${totalPageCount}`,
               50,
               doc.page.height - 50,
               { align: 'center' }
             );
          
          // App name
          doc.text(
            'Generated by Warranty Manager',
            50,
            doc.page.height - 35,
            { align: 'center' }
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

