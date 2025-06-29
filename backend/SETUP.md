# Quick Setup Guide

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your AWS credentials
   ```

3. **Create DynamoDB tables:**
   ```bash
   npm run setup-tables
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Test the API:**
   ```bash
   node test-api.js
   ```

## 🔧 Required AWS Setup

### 1. AWS Credentials
- Create an IAM user with DynamoDB and S3 permissions
- Add credentials to `.env` file

### 2. DynamoDB Tables
- Run `npm run setup-tables` to create tables automatically
- Or create manually in AWS Console

### 3. S3 Bucket
- Create bucket: `ai-image-generator-bucket` (or update name in `.env`)
- Configure CORS:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:5173"],
        "ExposeHeaders": []
    }
]
```

## 📋 Environment Variables

Required variables in `.env`:
```env
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

## 🧪 Testing

The backend includes a comprehensive test suite:
- Health check
- User authentication
- Image generation
- User management

Run tests with: `node test-api.js`

## 📚 API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/images/generate` - Generate image
- `GET /api/images/my-images` - Get user images
- `GET /api/users/profile` - Get user profile

## 🔐 Security Features

- JWT authentication (7-day tokens)
- Password hashing (bcrypt)
- Rate limiting (100 req/15min)
- Input validation
- CORS protection
- Security headers

## 📊 Database Schema

### Users Table
- `user_id` (partition key)
- `email` (GSI)
- `name`, `password`, `created_at`, etc.

### Images Table
- `image_id` (partition key)
- `user_id` (GSI)
- `prompt`, `s3_url`, `created_at`, etc.

## 🚀 Next Steps

1. Integrate with actual AI image generation service
2. Add image processing capabilities
3. Implement subscription management
4. Add analytics and monitoring
5. Deploy to production

## 📞 Support

Check the main README.md for detailed documentation. 