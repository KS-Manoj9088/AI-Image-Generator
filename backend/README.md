# AI Image Generator Backend

A robust Node.js backend API for the AI Image Generator application with JWT authentication, AWS DynamoDB for data storage, and S3 for image storage.

## 🚀 Features

- **JWT Authentication**: Secure user authentication and authorization
- **AWS DynamoDB Integration**: Scalable NoSQL database for users and image metadata
- **S3 Storage**: Cloud storage for generated images
- **RESTful API**: Clean and well-documented API endpoints
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet.js for security headers, CORS configuration

## 📋 Prerequisites

- Node.js (v16 or higher)
- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)

## 🛠️ Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your actual values:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

   # DynamoDB Table Names
   DYNAMODB_USERS_TABLE=ai-image-generator-users
   DYNAMODB_IMAGES_TABLE=ai-image-generator-images

   # S3 Configuration
   S3_BUCKET_NAME=ai-image-generator-bucket
   ```

## 🗄️ Database Setup

### DynamoDB Tables

Run the setup script to create the required DynamoDB tables:

```bash
npm run setup-tables
```

This will create:
- **Users Table**: Stores user information and authentication data
- **Images Table**: Stores image metadata and generation history

### S3 Bucket Setup

1. Create an S3 bucket for image storage
2. Configure CORS for the bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
        "ExposeHeaders": []
    }
]
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST `/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "created_at": "2024-01-01T00:00:00.000Z",
      "image_count": 0,
      "subscription_tier": "free"
    },
    "token": "jwt-token"
  }
}
```

#### POST `/auth/signin`
Sign in to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### GET `/auth/verify`
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### Image Generation Endpoints

#### POST `/images/generate`
Generate a new AI image.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "prompt": "a cyberpunk cat in neon city",
  "style": "cyberpunk",
  "size": "1024x1024"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image generated successfully",
  "data": {
    "image_id": "img_123abc",
    "prompt": "a cyberpunk cat in neon city",
    "style": "cyberpunk",
    "size": "1024x1024",
    "s3_url": "https://your-bucket.s3.amazonaws.com/img_123abc.png",
    "status": "completed",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/images/my-images`
Get user's generated images.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `limit` (optional): Number of images to return (default: 20)
- `lastKey` (optional): Pagination token

#### GET `/images/:image_id`
Get specific image details.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### DELETE `/images/:image_id`
Delete a specific image.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### User Management Endpoints

#### GET `/users/profile`
Get user profile information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### PUT `/users/profile`
Update user profile.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

#### GET `/users/stats`
Get user statistics.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

## 🔐 Security Features

- **JWT Tokens**: Secure authentication with 7-day expiration
- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable cross-origin requests
- **Security Headers**: Helmet.js for security headers

## 📊 Database Schema

### Users Table
```json
{
  "user_id": "string (partition key)",
  "email": "string (GSI)",
  "name": "string",
  "password": "string (hashed)",
  "created_at": "string (ISO date)",
  "updated_at": "string (ISO date)",
  "image_count": "number",
  "subscription_tier": "string (free/premium/pro)",
  "is_active": "boolean",
  "last_login": "string (ISO date)"
}
```

### Images Table
```json
{
  "image_id": "string (partition key)",
  "user_id": "string (GSI)",
  "prompt": "string",
  "style": "string",
  "size": "string",
  "s3_url": "string",
  "s3_key": "string",
  "status": "string",
  "created_at": "string (ISO date)",
  "updated_at": "string (ISO date)"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing secret | Required |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | Required |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Required |
| `DYNAMODB_USERS_TABLE` | Users table name | `ai-image-generator-users` |
| `DYNAMODB_IMAGES_TABLE` | Images table name | `ai-image-generator-images` |
| `S3_BUCKET_NAME` | S3 bucket name | `ai-image-generator-bucket` |

## 🚀 Deployment

### AWS Deployment

1. **Set up AWS credentials** with appropriate permissions for DynamoDB and S3
2. **Create DynamoDB tables** using the setup script
3. **Create S3 bucket** and configure CORS
4. **Deploy to AWS** (EC2, Lambda, or ECS)

### Environment Variables for Production

Make sure to update your production environment variables:
- Use a strong JWT secret
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use production AWS resources

## 🔄 Future Enhancements

- [ ] Integration with actual AI image generation services (OpenAI, Stability AI, etc.)
- [ ] Image processing and optimization
- [ ] User subscription management
- [ ] Image sharing and social features
- [ ] Advanced image editing capabilities
- [ ] Webhook support for async image generation
- [ ] Analytics and usage tracking

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository. 