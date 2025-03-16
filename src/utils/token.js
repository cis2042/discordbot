// Utility functions for token generation and verification
const crypto = require('crypto');

/**
 * Generate a secure verification token
 * @returns {string} Verification token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a SMS verification code
 * @returns {string} 6-digit verification code
 */
function generateSMSCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash a phone number for storage
 * @param {string} phoneNumber - The phone number to hash
 * @returns {string} Hashed phone number
 */
function hashPhoneNumber(phoneNumber) {
  return crypto
    .createHash('sha256')
    .update(phoneNumber + process.env.CLIENT_SECRET) // Salt with client secret
    .digest('hex');
}

module.exports = {
  generateVerificationToken,
  generateSMSCode,
  hashPhoneNumber
};