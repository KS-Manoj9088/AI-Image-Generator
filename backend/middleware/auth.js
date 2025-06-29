const jwt = require('jsonwebtoken');
const { dynamodb, TABLES } = require('../config/aws');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists in database
    const userParams = {
      TableName: TABLES.USERS,
      Key: {
        user_id: decoded.user_id
      }
    };

    const userResult = await dynamodb.get(userParams).promise();
    
    if (!userResult.Item) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found or token is invalid' 
      });
    }

    // Add user info to request object
    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      ...userResult.Item
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again' 
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication' 
    });
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userParams = {
        TableName: TABLES.USERS,
        Key: {
          user_id: decoded.user_id
        }
      };

      const userResult = await dynamodb.get(userParams).promise();
      
      if (userResult.Item) {
        req.user = {
          user_id: decoded.user_id,
          email: decoded.email,
          ...userResult.Item
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  optionalAuth
}; 