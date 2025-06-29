const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { dynamodb, TABLES } = require('../config/aws');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateSignin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Signup route
router.post('/signup', validateSignup, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUserParams = {
      TableName: TABLES.USERS,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    const existingUser = await dynamodb.query(existingUserParams).promise();
    
    if (existingUser.Items && existingUser.Items.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user_id = uuidv4();
    const timestamp = new Date().toISOString();

    const userParams = {
      TableName: TABLES.USERS,
      Item: {
        user_id,
        email,
        name,
        password: hashedPassword,
        created_at: timestamp,
        updated_at: timestamp,
        image_count: 0,
        subscription_tier: 'free',
        is_active: true
      },
      ConditionExpression: 'attribute_not_exists(user_id)'
    };

    await dynamodb.put(userParams).promise();

    // Generate JWT token
    const token = generateToken({ user_id, email });

    // Return user data (without password)
    const userData = {
      user_id,
      email,
      name,
      created_at: timestamp,
      image_count: 0,
      subscription_tier: 'free'
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    next(error);
  }
});

// Signin route
router.post('/signin', validateSignin, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const userParams = {
      TableName: TABLES.USERS,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    const userResult = await dynamodb.query(userParams).promise();
    
    if (!userResult.Items || userResult.Items.length === 0) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.Items[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: true,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({ user_id: user.user_id, email: user.email });

    // Update last login
    const updateParams = {
      TableName: TABLES.USERS,
      Key: { user_id: user.user_id },
      UpdateExpression: 'SET last_login = :last_login, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':last_login': new Date().toISOString(),
        ':updated_at': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();

    // Return user data (without password)
    const userData = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      image_count: user.image_count || 0,
      subscription_tier: user.subscription_tier || 'free',
      last_login: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    next(error);
  }
});

// Verify token route
router.get('/verify', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'No token provided'
      });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data
    const userParams = {
      TableName: TABLES.USERS,
      Key: { user_id: decoded.user_id }
    };

    const userResult = await dynamodb.get(userParams).promise();
    
    if (!userResult.Item) {
      return res.status(401).json({
        error: true,
        message: 'User not found'
      });
    }

    const userData = {
      user_id: userResult.Item.user_id,
      email: userResult.Item.email,
      name: userResult.Item.name,
      created_at: userResult.Item.created_at,
      image_count: userResult.Item.image_count || 0,
      subscription_tier: userResult.Item.subscription_tier || 'free'
    };

    res.json({
      success: true,
      message: 'Token is valid',
      data: { user: userData }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Invalid or expired token'
      });
    }
    next(error);
  }
});

module.exports = router; 