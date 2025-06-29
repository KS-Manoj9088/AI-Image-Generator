const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { dynamodb, TABLES } = require('../config/aws');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required when changing password'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    const params = {
      TableName: TABLES.USERS,
      Key: { user_id }
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Return user data without sensitive information
    const userData = {
      user_id: result.Item.user_id,
      email: result.Item.email,
      name: result.Item.name,
      created_at: result.Item.created_at,
      updated_at: result.Item.updated_at,
      image_count: result.Item.image_count || 0,
      subscription_tier: result.Item.subscription_tier || 'free',
      last_login: result.Item.last_login
    };

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res, next) => {
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

    const { user_id } = req.user;
    const { name, currentPassword, newPassword } = req.body;

    // Get current user data
    const getParams = {
      TableName: TABLES.USERS,
      Key: { user_id }
    };

    const userResult = await dynamodb.get(getParams).promise();

    if (!userResult.Item) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    const user = userResult.Item;
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    // Update name if provided
    if (name && name !== user.name) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: true,
          message: 'Current password is required to change password'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: true,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      updateExpressions.push('#password = :password');
      expressionAttributeNames['#password'] = 'password';
      expressionAttributeValues[':password'] = hashedNewPassword;
    }

    // Always update the updated_at timestamp
    updateExpressions.push('#updated_at = :updated_at');
    expressionAttributeNames['#updated_at'] = 'updated_at';
    expressionAttributeValues[':updated_at'] = new Date().toISOString();

    if (updateExpressions.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No changes to update'
      });
    }

    // Update user in DynamoDB
    const updateParams = {
      TableName: TABLES.USERS,
      Key: { user_id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };

    await dynamodb.update(updateParams).promise();

    // Get updated user data
    const updatedUserResult = await dynamodb.get(getParams).promise();
    const updatedUser = updatedUserResult.Item;

    // Return updated user data (without password)
    const userData = {
      user_id: updatedUser.user_id,
      email: updatedUser.email,
      name: updatedUser.name,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      image_count: updatedUser.image_count || 0,
      subscription_tier: updatedUser.subscription_tier || 'free',
      last_login: updatedUser.last_login
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userData
    });

  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;

    // Get user's images count and other stats
    const imagesParams = {
      TableName: TABLES.IMAGES,
      IndexName: 'user_id-created_at-index',
      KeyConditionExpression: 'user_id = :user_id',
      ExpressionAttributeValues: {
        ':user_id': user_id
      },
      Select: 'COUNT'
    };

    const imagesResult = await dynamodb.query(imagesParams).promise();

    // Get user's subscription limits
    const userParams = {
      TableName: TABLES.USERS,
      Key: { user_id }
    };

    const userResult = await dynamodb.get(userParams).promise();
    const user = userResult.Item;

    const limits = {
      free: 10,
      premium: 100,
      pro: 1000
    };

    const userLimit = limits[user.subscription_tier] || limits.free;
    const remainingImages = Math.max(0, userLimit - (user.image_count || 0));

    const stats = {
      total_images: user.image_count || 0,
      remaining_images: remainingImages,
      subscription_tier: user.subscription_tier || 'free',
      subscription_limit: userLimit,
      account_created: user.created_at,
      last_login: user.last_login
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: true,
        message: 'Password is required to delete account'
      });
    }

    // Get user data
    const userParams = {
      TableName: TABLES.USERS,
      Key: { user_id }
    };

    const userResult = await dynamodb.get(userParams).promise();

    if (!userResult.Item) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userResult.Item.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        error: true,
        message: 'Password is incorrect'
      });
    }

    // TODO: Delete all user's images from S3 and DynamoDB
    // This would require a more complex operation to delete all associated data

    // For now, just deactivate the account
    const updateParams = {
      TableName: TABLES.USERS,
      Key: { user_id },
      UpdateExpression: 'SET is_active = :is_active, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':is_active': false,
        ':updated_at': new Date().toISOString()
      }
    };

    await dynamodb.update(updateParams).promise();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 