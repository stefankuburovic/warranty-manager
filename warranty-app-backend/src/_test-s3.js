// Load environment variables from .env file in project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const AWS = require('aws-sdk');

// Validate required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Make sure you have a .env file in warranty-app-backend/ with these variables set.');
  console.error('   Example .env file:');
  console.error('   AWS_ACCESS_KEY_ID=your_access_key_id');
  console.error('   AWS_SECRET_ACCESS_KEY=your_secret_access_key');
  console.error('   AWS_REGION=eu-central-1');
  console.error('   AWS_BUCKET_NAME=your-bucket-name');
  process.exit(1);
}

// Validate and clean environment variables
const accessKeyId = process.env.AWS_ACCESS_KEY_ID.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY.trim();
const region = process.env.AWS_REGION.trim();
const bucketName = process.env.AWS_BUCKET_NAME.trim();

// Check for common issues
if (accessKeyId.startsWith('"') || accessKeyId.startsWith("'")) {
  console.error('⚠️  Warning: AWS_ACCESS_KEY_ID appears to have quotes. Remove quotes from .env file.');
}
if (secretAccessKey.startsWith('"') || secretAccessKey.startsWith("'")) {
  console.error('⚠️  Warning: AWS_SECRET_ACCESS_KEY appears to have quotes. Remove quotes from .env file.');
}

// Validate format
if (!accessKeyId.startsWith('AKIA') || accessKeyId.length !== 20) {
  console.error('⚠️  Warning: AWS_ACCESS_KEY_ID format looks incorrect.');
  console.error(`      Expected: Starts with "AKIA" and is 20 characters`);
  console.error(`      Got: "${accessKeyId.substring(0, 8)}..." (${accessKeyId.length} chars)`);
}
if (secretAccessKey.length < 40) {
  console.error('⚠️  Warning: AWS_SECRET_ACCESS_KEY length looks incorrect.');
  console.error(`      Expected: 40+ characters`);
  console.error(`      Got: ${secretAccessKey.length} characters`);
}

// Validate bucket name format (S3 bucket naming rules)
const bucketNameRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
if (!bucketNameRegex.test(bucketName)) {
  console.error('⚠️  Warning: AWS_BUCKET_NAME format looks incorrect.');
  console.error('      Bucket names must:');
  console.error('      - Be 3-63 characters long');
  console.error('      - Contain only lowercase letters, numbers, and hyphens');
  console.error('      - Start and end with a letter or number');
  console.error(`      Current: "${bucketName}"`);
}

// Validate region format
const validRegions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1',
  'sa-east-1', 'ca-central-1'
];
if (!validRegions.includes(region)) {
  console.warn(`⚠️  Warning: Region "${region}" is not in the common regions list.`);
  console.warn('      Make sure this matches your bucket\'s actual region.');
}

AWS.config.update({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region
});

const s3 = new AWS.S3();

// Test upload
const testUpload = async () => {
  try {
    console.log('🔍 Testing S3 connection...');
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Region: ${region}`);
    console.log(`   Access Key ID: ${accessKeyId.substring(0, 8)}...`);
    console.log(`   Access Key Length: ${accessKeyId.length} chars`);
    console.log(`   Secret Key Length: ${secretAccessKey.length} chars`);
    console.log('');

    const params = {
      Bucket: bucketName,
      Key: 'test/test.txt',
      Body: 'Hello from Warranty Manager!',
      ContentType: 'text/plain'
    };

    console.log('📤 Uploading test file...');
    const result = await s3.putObject(params).promise();
    console.log('✅ Upload successful:', result.ETag);

    // Test download
    console.log('📥 Downloading test file...');
    const getParams = {
      Bucket: bucketName,
      Key: 'test/test.txt'
    };
    const data = await s3.getObject(getParams).promise();
    console.log('✅ Download successful:', data.Body.toString());

    // Cleanup
    console.log('🗑️  Cleaning up test file...');
    await s3.deleteObject({
      Bucket: bucketName,
      Key: 'test/test.txt'
    }).promise();
    console.log('✅ Test file deleted');
    console.log('');
    console.log('🎉 All S3 tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.statusCode) {
      console.error(`   Status Code: ${error.statusCode}`);
    }
    console.error('');
    
    if (error.code === 'InvalidARN') {
      console.error('🔍 InvalidARN Error - Common causes:');
      console.error('');
      console.error('   1. ❌ Bucket name format issue');
      console.error(`      → Current bucket: "${bucketName}"`);
      console.error('      → Bucket names must be lowercase, 3-63 chars, no underscores');
      console.error('      → Example: "my-bucket-name" (correct)');
      console.error('      → Example: "My_Bucket_Name" (wrong - has uppercase/underscore)');
      console.error('');
      console.error('   2. ❌ Bucket name contains invalid characters');
      console.error('      → Remove any special characters except hyphens');
      console.error('      → Ensure no spaces or quotes');
      console.error('');
      console.error('   3. ❌ Region mismatch');
      console.error(`      → Current region: ${region}`);
      console.error('      → Verify this matches your bucket\'s actual region in AWS Console');
      console.error('');
      console.error('   4. ❌ Bucket doesn\'t exist in this region');
      console.error('      → Check AWS Console to verify bucket exists');
      console.error('      → Verify bucket name spelling');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('🔍 SignatureDoesNotMatch Error - Common causes:');
      console.error('');
      console.error('   1. ❌ Wrong AWS_SECRET_ACCESS_KEY');
      console.error('      → Double-check the secret key in your .env file');
      console.error('      → Make sure there are NO quotes around the value');
      console.error('      → Ensure there are NO spaces before/after the value');
      console.error('');
      console.error('   2. ❌ Access Key and Secret Key don\'t match');
      console.error('      → Verify both keys are from the same IAM user');
      console.error('      → Check if you copied the keys correctly');
      console.error('');
      console.error('   3. ❌ Extra characters in .env file');
      console.error('      → Check for hidden characters, quotes, or spaces');
      console.error('      → Make sure each line ends properly (no trailing spaces)');
      console.error('');
      console.error('   4. ❌ Wrong region');
      console.error(`      → Current region: ${region}`);
      console.error('      → Verify this matches your bucket\'s region');
      console.error('');
      console.error('   📝 Example of CORRECT .env format:');
      console.error('   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE');
      console.error('   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
      console.error('   AWS_REGION=eu-central-1');
      console.error('   AWS_BUCKET_NAME=my-bucket-name');
      console.error('');
      console.error('   ❌ WRONG (with quotes):');
      console.error('   AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"');
      console.error('');
      console.error('   ❌ WRONG (with spaces):');
      console.error('   AWS_SECRET_ACCESS_KEY= wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY ');
    } else {
      console.error('💡 Troubleshooting tips:');
      console.error('   1. Check your AWS credentials in .env file');
      console.error('   2. Verify the bucket name exists in your AWS account');
      console.error('   3. Ensure your AWS user has S3 permissions');
      console.error('   4. Check that the region is correct');
    }
    process.exit(1);
  }
};

testUpload();