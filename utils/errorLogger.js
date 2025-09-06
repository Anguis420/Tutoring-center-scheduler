const crypto = require('crypto');

/**
 * Sanitizes request body by removing or masking sensitive fields
 * @param {Object} body - The request body to sanitize
 * @returns {Object} - Sanitized body with only safe fields
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'auth',
    'ssn', 'socialSecurityNumber', 'social_security',
    'creditCard', 'credit_card', 'cardNumber', 'card_number',
    'cvv', 'cvc', 'expiry', 'expiration',
    'bankAccount', 'bank_account', 'routingNumber', 'routing_number',
    'pin', 'pincode', 'pin_code',
    'email', 'phone', 'telephone', 'mobile',
    'address', 'street', 'city', 'zip', 'postalCode',
    'firstName', 'first_name', 'lastName', 'last_name',
    'dateOfBirth', 'date_of_birth', 'dob'
  ];

  const sanitized = {};
  
  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field is sensitive
    const isSensitive = sensitiveFields.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      // Mask sensitive fields
      if (typeof value === 'string' && value.length > 0) {
        sanitized[key] = '*'.repeat(Math.min(value.length, 8));
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else {
      // Keep non-sensitive fields as-is
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Creates a safe user identifier for logging
 * @param {Object} user - The user object
 * @returns {string} - Safe user identifier
 */
function getSafeUserIdentifier(user) {
  if (!user || !user._id) {
    return '[NO_USER]';
  }
  
  // In development, show partial ID for debugging
  if (process.env.NODE_ENV === 'development') {
    const idStr = user._id.toString();
    return idStr.length > 8 ? `${idStr.substring(0, 4)}...${idStr.substring(idStr.length - 4)}` : idStr;
  }
  
  // In production, use a hash of the user ID
  return crypto.createHash('sha256').update(user._id.toString()).digest('hex').substring(0, 8);
}

/**
 * Creates safe error details for logging
 * @param {Error} error - The error object
 * @param {Object} req - The request object
 * @returns {Object} - Safe error details
 */
function createSafeErrorDetails(error, req) {
  const safeDetails = {
    message: error.message,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent') || '[UNKNOWN]',
    ip: req.ip || req.connection?.remoteAddress || '[UNKNOWN]'
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    safeDetails.stack = error.stack;
  }

  // Add sanitized request body if present
  if (req.body && Object.keys(req.body).length > 0) {
    safeDetails.body = sanitizeRequestBody(req.body);
  }

  // Add safe user identifier
  safeDetails.user = getSafeUserIdentifier(req.user);

  return safeDetails;
}

/**
 * Logs error with sanitized data
 * @param {string} context - Error context/operation name
 * @param {Error} error - The error object
 * @param {Object} req - The request object
 */
function logError(context, error, req) {
  const safeDetails = createSafeErrorDetails(error, req);
  
  console.error(`${context}:`, error.message);
  console.error('Error details:', safeDetails);
}

/**
 * Creates a safe error response for the client
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default error message
 * @returns {Object} - Safe error response
 */
function createSafeErrorResponse(error, defaultMessage = 'Internal server error') {
  if (process.env.NODE_ENV === 'development') {
    return {
      message: error.message,
      stack: error.stack
    };
  }
  
  return {
    message: defaultMessage
  };
}

module.exports = {
  sanitizeRequestBody,
  getSafeUserIdentifier,
  createSafeErrorDetails,
  logError,
  createSafeErrorResponse
};
