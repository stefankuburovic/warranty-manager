# AWS S3 Setup Guide

This guide will help you set up AWS S3 for storing receipts and warranty documents.

## Step 1: Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Click **"Create an AWS Account"** (if you don't have one)
3. Follow the registration process
4. Complete payment information (you'll need a credit card, but free tier is available)

**Note:** AWS Free Tier includes:
- 5 GB of S3 storage
- 20,000 GET requests
- 2,000 PUT requests per month
- Free for 12 months

## Step 2: Create S3 Bucket

1. Sign in to [AWS Console](https://console.aws.amazon.com/)
2. Search for **"S3"** in the services search bar
3. Click **"S3"** → **"Create bucket"**

### Bucket Configuration:

- **Bucket name**: `warranty-manager-documents` (must be globally unique)
  - Try: `warranty-manager-documents-yourname` or `warranty-app-2024`
  - Bucket names must be lowercase, no spaces, globally unique
- **AWS Region**: Choose closest to you (e.g., `eu-central-1` for Europe)
- **Object Ownership**: **ACLs disabled** (recommended)
- **Block Public Access**: **Keep all settings enabled** (we'll use private access)
- **Bucket Versioning**: Disable (unless you need versioning)
- **Default encryption**: Enable
  - Encryption type: **SSE-S3** (Amazon S3 managed keys)
- **Object Lock**: Disable

4. Click **"Create bucket"**

## Step 3: Create IAM User for Application

**Important:** Never use your root AWS account credentials. Create a dedicated IAM user.

1. Search for **"IAM"** in AWS Console
2. Click **"IAM"** → **"Users"** → **"Create user"**

### User Details:
- **User name**: `warranty-manager-app`
- **Provide user access**: Select **"Attach policies directly"**

### Permissions:
Click **"Create policy"** → **"JSON"** tab, paste this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    }
  ]
}
```

**Replace `YOUR_BUCKET_NAME`** with your actual bucket name (e.g., `warranty-manager-documents`)

1. Click **"Next"** → Name: `WarrantyManagerS3Policy`
2. Click **"Create policy"**
3. Go back to user creation
4. Refresh policies list
5. Search for `WarrantyManagerS3Policy` → Select it
6. Click **"Next"** → **"Create user"**

## Step 4: Create Access Keys

1. Click on the user you just created (`warranty-manager-app`)
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"**
4. Click **"Create access key"**

### Use Case:
- Select **"Application running outside AWS"**
- Click **"Next"**
- Description (optional): `Warranty Manager Backend`
- Click **"Create access key"**

### ⚠️ IMPORTANT: Save These Credentials!

You'll see:
- **Access key ID**: `AKIA...` (this is your `AWS_ACCESS_KEY_ID`)
- **Secret access key**: `wJalr...` (this is your `AWS_SECRET_ACCESS_KEY`)

**⚠️ Download the CSV file or copy these immediately!**
**⚠️ You won't be able to see the secret key again!**

5. Click **"Done"**

## Step 5: Configure Bucket CORS (Optional but Recommended)

If you need direct browser uploads:

1. Go to your S3 bucket
2. Click **"Permissions"** tab
3. Scroll to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"** → Paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:19000",
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **"Save changes"**

## Step 6: Update Environment Variables

### Backend `.env`:

```env
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-central-1
AWS_BUCKET_NAME=warranty-manager-documents
```

**Replace with your actual values!**

## Step 7: Test S3 Connection

Create a test script `test-s3.js`:

```javascript
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Test upload
const testUpload = async () => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: 'test/test.txt',
      Body: 'Hello from Warranty Manager!',
      ContentType: 'text/plain'
    };

    const result = await s3.putObject(params).promise();
    console.log('✅ Upload successful:', result.ETag);

    // Test download
    const getParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: 'test/test.txt'
    };
    const data = await s3.getObject(getParams).promise();
    console.log('✅ Download successful:', data.Body.toString());

    // Cleanup
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: 'test/test.txt'
    }).promise();
    console.log('✅ Test file deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testUpload();
```

Run:
```bash
cd warranty-app-backend
node test-s3.js
```

## Security Best Practices

### ✅ DO:
- Use IAM users with minimal permissions
- Rotate access keys regularly (every 90 days)
- Use environment variables (never commit to git)
- Enable bucket encryption
- Use bucket policies to restrict access
- Enable CloudTrail for audit logging

### ❌ DON'T:
- Use root AWS account credentials
- Commit access keys to version control
- Share access keys publicly
- Give more permissions than needed
- Use same credentials for multiple environments

## Cost Optimization

### Free Tier (First 12 Months):
- 5 GB storage
- 20,000 GET requests/month
- 2,000 PUT requests/month

### After Free Tier:
- Storage: ~$0.023 per GB/month
- GET requests: $0.0004 per 1,000 requests
- PUT requests: $0.005 per 1,000 requests

**Estimated cost for small app**: $1-5/month

### Cost Saving Tips:
1. Delete old/unused files regularly
2. Use S3 Lifecycle policies to archive old files
3. Compress images before upload
4. Use CloudFront CDN for frequently accessed files

## Troubleshooting

### "Access Denied" Error
- Check IAM user has correct permissions
- Verify bucket name is correct
- Check access key ID and secret are correct
- Ensure bucket policy allows your user

### "InvalidAccessKeyId" Error
- Verify `AWS_ACCESS_KEY_ID` is correct
- Check for extra spaces or quotes in `.env`
- Ensure access key is active (not disabled)

### "SignatureDoesNotMatch" Error
- Verify `AWS_SECRET_ACCESS_KEY` is correct
- Check for typos or encoding issues
- Ensure secret key matches the access key

### "Bucket does not exist"
- Verify bucket name is correct
- Check region matches bucket region
- Ensure bucket wasn't deleted

### "CORS policy" Error
- Configure CORS on bucket
- Check allowed origins include your domain
- Verify allowed methods include what you need

## Production Checklist

- [ ] S3 bucket created with unique name
- [ ] IAM user created (not root account)
- [ ] IAM policy attached with minimal permissions
- [ ] Access keys created and saved securely
- [ ] Bucket encryption enabled
- [ ] CORS configured (if needed)
- [ ] Environment variables set
- [ ] Test upload/download successful
- [ ] Backup strategy in place
- [ ] Monitoring/alerts configured
- [ ] Cost alerts set up

## Alternative: Use Cloudinary (Easier Setup)

If AWS seems complex, consider Cloudinary:
- Easier setup (no IAM needed)
- Built-in image transformations
- Free tier: 25 GB storage, 25 GB bandwidth/month
- Better for images/videos

See: https://cloudinary.com/

## Quick Reference

### Your AWS Credentials:
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_REGION=eu-central-1
AWS_BUCKET_NAME=warranty-manager-documents
```

### Bucket URL Format:
```
https://YOUR_BUCKET_NAME.s3.AWS_REGION.amazonaws.com/path/to/file
```

### S3 Console:
https://console.aws.amazon.com/s3/

### IAM Console:
https://console.aws.amazon.com/iam/

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Pricing Calculator](https://calculator.aws/#/createCalculator/S3)
- [AWS Free Tier](https://aws.amazon.com/free/)

