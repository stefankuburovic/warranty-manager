## 🚀 Fastest Way (10 minutes)

### Step 1: Create AWS Account
👉 https://aws.amazon.com/ → **"Create an AWS Account"**
- Free tier available (5 GB S3 storage free for 12 months)

### Step 2: Create S3 Bucket
1. Go to [S3 Console](https://console.aws.amazon.com/s3/)
2. Click **"Create bucket"**
3. Bucket name: `warranty-manager-documents-yourname` (must be unique)
4. Region: `eu-central-1` (or closest to you)
5. **Uncheck** "Block all public access" (we'll use private)
6. Enable **"Default encryption"** → **SSE-S3**
7. Click **"Create bucket"**

### Step 3: Create IAM User
1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. **"Users"** → **"Create user"**
3. Name: `warranty-manager-app`
4. **"Attach policies directly"** → **"Create policy"**

### Step 4: Create Policy
1. Click **"JSON"** tab
2. Paste this (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    }
  ]
}
```

3. Name: `WarrantyManagerS3Policy`
4. Click **"Create policy"**
5. Go back, refresh, select the policy
6. Click **"Create user"**

### Step 5: Get Access Keys
1. Click the user → **"Security credentials"** tab
2. **"Access keys"** → **"Create access key"**
3. Select **"Application running outside AWS"**
4. Click **"Create access key"**
5. **⚠️ COPY THESE IMMEDIATELY:**
   - **Access key ID**: `AKIA...` → This is `AWS_ACCESS_KEY_ID`
   - **Secret access key**: `wJalr...` → This is `AWS_SECRET_ACCESS_KEY`
6. **Download CSV** or copy to `.env` file

## 📝 Update Your `.env` File

```env
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-central-1
AWS_BUCKET_NAME=warranty-manager-documents-yourname
```

## ✅ That's It!

Your credentials format:
- **Access Key ID**: Starts with `AKIA` (20 characters)
- **Secret Access Key**: Long string (40 characters)

## 🔒 Security Reminders

- ✅ Never commit `.env` to git
- ✅ Never share credentials publicly
- ✅ Use IAM user (not root account)
- ✅ Rotate keys every 90 days

## 🆘 Troubleshooting

**"Access Denied"** → Check IAM policy permissions  
**"InvalidAccessKeyId"** → Verify access key is correct  
**"Bucket does not exist"** → Check bucket name and region  

## 📚 Need More Details?

See full guide: `docs/AWS_S3_SETUP.md`

