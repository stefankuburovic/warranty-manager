const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Suppress AWS SDK v2 maintenance mode warning
// Note: AWS SDK v2 is in maintenance mode but still fully functional
// Migration to v3 can be done later when needed
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

// File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

// Configure multer with S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'private', // Files are private
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        userId: req.user.user_id.toString()
      });
    },
    key: (req, file, cb) => {
      const userId = req.user.user_id;
      const uniqueId = uuidv4();
      const extension = path.extname(file.originalname);
      const fileName = `users/${userId}/documents/${uniqueId}${extension}`;
      cb(null, fileName);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Generate signed URL for viewing files
const getSignedUrl = (key, expiresIn = 3600) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: expiresIn // URL valid for 1 hour
  });
};

// Delete file from S3
const deleteFile = async (key) => {
  try {
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    }).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
};

// Upload file to S3 (for thumbnails)
const uploadToS3 = async (buffer, key, mimetype) => {
  try {
    await s3.putObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'private'
    }).promise();
    return true;
  } catch (error) {
    console.error('S3 upload error:', error);
    return false;
  }
};

module.exports = {
  s3,
  upload,
  getSignedUrl,
  deleteFile,
  uploadToS3
};
