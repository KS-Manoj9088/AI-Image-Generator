const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { dynamodb, s3, TABLES, S3_CONFIG } = require('../config/aws');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateImageGeneration = [
  body('prompt')
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Prompt must be between 3 and 1000 characters'),
  body('style')
    .optional()
    .isIn(['realistic', 'artistic', 'cartoon', 'anime', 'cyberpunk', 'vintage'])
    .withMessage('Invalid style selected'),
  body('size')
    .optional()
    .isIn(['512x512', '1024x1024', '1024x768', '768x1024'])
    .withMessage('Invalid size selected')
];

// Generate image route
router.post('/generate', authenticateToken, validateImageGeneration, async (req, res, next) => {
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

    const { prompt, style = 'realistic', size = '1024x1024' } = req.body;
    const { user_id } = req.user;

    // Check user's image generation limits
    const userParams = {
      TableName: TABLES.USERS,
      Key: { user_id }
    };

    const userResult = await dynamodb.get(userParams).promise();
    const user = userResult.Item;

    // Check subscription limits
    const limits = {
      free: 10,
      premium: 100,
      pro: 1000
    };

    const userLimit = limits[user.subscription_tier] || limits.free;
    
    if (user.image_count >= userLimit) {
      return res.status(403).json({
        error: true,
        message: `You've reached your ${user.subscription_tier} tier limit of ${userLimit} images. Please upgrade your subscription.`
      });
    }

    // Generate unique image ID
    const image_id = `img_${uuidv4().replace(/-/g, '')}`;
    const timestamp = new Date().toISOString();

    // TODO: Integrate with actual AI image generation service
    // For now, we'll simulate the process
    const mockImageUrl = `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${image_id}.png`;

    // Store image metadata in DynamoDB
    const imageParams = {
      TableName: TABLES.IMAGES,
      Item: {
        image_id,
        user_id,
        prompt,
        style,
        size,
        s3_url: mockImageUrl,
        s3_key: `${image_id}.png`,
        status: 'completed',
        created_at: timestamp,
        updated_at: timestamp
      }
    };

    await dynamodb.put(imageParams).promise();

    // Update user's image count
    const updateUserParams = {
      TableName: TABLES.USERS,
      Key: { user_id },
      UpdateExpression: 'SET image_count = image_count + :inc, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updated_at': timestamp
      }
    };

    await dynamodb.update(updateUserParams).promise();

    // Return the generated image data
    const imageData = {
      image_id,
      prompt,
      style,
      size,
      s3_url: mockImageUrl,
      status: 'completed',
      created_at: timestamp
    };

    res.status(201).json({
      success: true,
      message: 'Image generated successfully',
      data: imageData
    });

  } catch (error) {
    next(error);
  }
});

// Get user's images
router.get('/my-images', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { limit = 20, lastKey } = req.query;

    const params = {
      TableName: TABLES.IMAGES,
      IndexName: 'user_id-created_at-index',
      KeyConditionExpression: 'user_id = :user_id',
      ExpressionAttributeValues: {
        ':user_id': user_id
      },
      ScanIndexForward: false, // Most recent first
      Limit: parseInt(limit)
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(lastKey);
    }

    const result = await dynamodb.query(params).promise();

    const images = result.Items.map(item => ({
      image_id: item.image_id,
      prompt: item.prompt,
      style: item.style,
      size: item.size,
      s3_url: item.s3_url,
      status: item.status,
      created_at: item.created_at
    }));

    res.json({
      success: true,
      data: {
        images,
        lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : null,
        count: images.length
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get specific image
router.get('/:image_id', authenticateToken, async (req, res, next) => {
  try {
    const { image_id } = req.params;
    const { user_id } = req.user;

    const params = {
      TableName: TABLES.IMAGES,
      Key: { image_id }
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({
        error: true,
        message: 'Image not found'
      });
    }

    // Check if user owns this image
    if (result.Item.user_id !== user_id) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. You can only view your own images.'
      });
    }

    const imageData = {
      image_id: result.Item.image_id,
      prompt: result.Item.prompt,
      style: result.Item.style,
      size: result.Item.size,
      s3_url: result.Item.s3_url,
      status: result.Item.status,
      created_at: result.Item.created_at
    };

    res.json({
      success: true,
      data: imageData
    });

  } catch (error) {
    next(error);
  }
});

// Delete image
router.delete('/:image_id', authenticateToken, async (req, res, next) => {
  try {
    const { image_id } = req.params;
    const { user_id } = req.user;

    // Get image details first
    const getParams = {
      TableName: TABLES.IMAGES,
      Key: { image_id }
    };

    const imageResult = await dynamodb.get(getParams).promise();

    if (!imageResult.Item) {
      return res.status(404).json({
        error: true,
        message: 'Image not found'
      });
    }

    // Check if user owns this image
    if (imageResult.Item.user_id !== user_id) {
      return res.status(403).json({
        error: true,
        message: 'Access denied. You can only delete your own images.'
      });
    }

    // Delete from S3
    const s3Params = {
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: imageResult.Item.s3_key
    };

    try {
      await s3.deleteObject(s3Params).promise();
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      // Continue with DynamoDB deletion even if S3 fails
    }

    // Delete from DynamoDB
    const deleteParams = {
      TableName: TABLES.IMAGES,
      Key: { image_id }
    };

    await dynamodb.delete(deleteParams).promise();

    // Update user's image count
    const updateUserParams = {
      TableName: TABLES.USERS,
      Key: { user_id },
      UpdateExpression: 'SET image_count = image_count - :dec, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':updated_at': new Date().toISOString()
      }
    };

    await dynamodb.update(updateUserParams).promise();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get image generation status
router.get('/:image_id/status', authenticateToken, async (req, res, next) => {
  try {
    const { image_id } = req.params;
    const { user_id } = req.user;

    const params = {
      TableName: TABLES.IMAGES,
      Key: { image_id }
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({
        error: true,
        message: 'Image not found'
      });
    }

    // Check if user owns this image
    if (result.Item.user_id !== user_id) {
      return res.status(403).json({
        error: true,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        image_id: result.Item.image_id,
        status: result.Item.status,
        progress: result.Item.progress || 0,
        created_at: result.Item.created_at
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 