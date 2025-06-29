const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // AWS DynamoDB errors
  if (err.code === 'ConditionalCheckFailedException') {
    error = {
      message: 'Resource already exists or condition not met',
      status: 409
    };
  }

  if (err.code === 'ResourceNotFoundException') {
    error = {
      message: 'Resource not found',
      status: 404
    };
  }

  if (err.code === 'ValidationException') {
    error = {
      message: 'Invalid data provided',
      status: 400
    };
  }

  // AWS S3 errors
  if (err.code === 'NoSuchBucket') {
    error = {
      message: 'Storage bucket not found',
      status: 500
    };
  }

  if (err.code === 'NoSuchKey') {
    error = {
      message: 'File not found',
      status: 404
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      status: 400,
      details: err.details
    };
  }

  // Send error response
  res.status(error.status).json({
    error: true,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  errorHandler
}; 