const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'ai-image-generator-users',
  IMAGES: process.env.DYNAMODB_IMAGES_TABLE || 'ai-image-generator-images'
};

// Users table schema
const usersTableParams = {
  TableName: TABLES.USERS,
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'email-index',
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// Images table schema
const imagesTableParams = {
  TableName: TABLES.IMAGES,
  KeySchema: [
    { AttributeName: 'image_id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'image_id', AttributeType: 'S' },
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'user_id-created_at-index',
      KeySchema: [
        { AttributeName: 'user_id', KeyType: 'HASH' },
        { AttributeName: 'created_at', KeyType: 'RANGE' }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

async function createTable(tableParams, tableName) {
  try {
    console.log(`Creating table: ${tableName}`);
    await dynamodb.createTable(tableParams).promise();
    console.log(`✅ Table ${tableName} created successfully`);
    
    // Wait for table to be active
    console.log(`Waiting for table ${tableName} to be active...`);
    await dynamodb.waitFor('tableExists', { TableName: tableName }).promise();
    console.log(`✅ Table ${tableName} is now active`);
    
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log(`⚠️  Table ${tableName} already exists`);
    } else {
      console.error(`❌ Error creating table ${tableName}:`, error.message);
      throw error;
    }
  }
}

async function setupTables() {
  console.log('🚀 Setting up DynamoDB tables...\n');
  
  try {
    // Create Users table
    await createTable(usersTableParams, TABLES.USERS);
    console.log('');
    
    // Create Images table
    await createTable(imagesTableParams, TABLES.IMAGES);
    console.log('');
    
    console.log('🎉 All tables setup completed successfully!');
    console.log('\n📋 Table Summary:');
    console.log(`   - Users Table: ${TABLES.USERS}`);
    console.log(`   - Images Table: ${TABLES.IMAGES}`);
    console.log('\n🔧 Next steps:');
    console.log('   1. Create an S3 bucket for image storage');
    console.log('   2. Configure CORS for your S3 bucket');
    console.log('   3. Set up proper IAM permissions');
    console.log('   4. Update your .env file with actual AWS credentials');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupTables();
}

module.exports = { setupTables }; 