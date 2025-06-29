const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Initialize DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Initialize S3
const s3 = new AWS.S3();

// DynamoDB table names
const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'ai-image-generator-users',
  IMAGES: process.env.DYNAMODB_IMAGES_TABLE || 'ai-image-generator-images'
};

// S3 bucket configuration
const S3_CONFIG = {
  BUCKET_NAME: process.env.S3_BUCKET_NAME || 'ai-image-generator-bucket',
  REGION: process.env.AWS_REGION || 'us-east-1'
};

module.exports = {
  dynamodb,
  s3,
  TABLES,
  S3_CONFIG
}; 