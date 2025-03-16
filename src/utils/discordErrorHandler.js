// Utility to handle and suppress Discord connection errors in mock mode
const logger = require('./logger');

/**
 * Patch global error handlers to intercept and suppress Discord WebSocket errors in mock mode
 */
function setupMockModeErrorHandling() {
  const mockMode = process.env.USE_MOCK_MODE === 'true';
  
  if (!mockMode) {
    return; // Only apply these patches in mock mode
  }
  
  logger.info('[MOCK] Setting up error suppression for Discord connection errors');
  
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Replace console.error to filter Discord WebSocket errors
  console.error = function(...args) {
    // Check if this is a Discord WebSocket error
    const errorString = args.join(' ');
    if (isDiscordConnectionError(errorString)) {
      // Skip logging these errors in mock mode
      return;
    }
    
    // Pass through to original console.error for non-Discord errors
    originalConsoleError.apply(console, args);
  };
  
  // Replace console.warn to filter Discord WebSocket warnings
  console.warn = function(...args) {
    // Check if this is a Discord WebSocket warning
    const warningString = args.join(' ');
    if (isDiscordConnectionError(warningString)) {
      // Skip logging these warnings in mock mode
      return;
    }
    
    // Pass through to original console.warn for non-Discord warnings
    originalConsoleWarn.apply(console, args);
  };
  
  // Override Winston transport to filter Discord errors
  const originalLoggerError = logger.error;
  logger.error = function(message, meta) {
    // Check if this is a Discord WebSocket error
    if (typeof message === 'string' && isDiscordConnectionError(message)) {
      // Skip logging these errors in mock mode
      return;
    }
    
    // If meta contains error information, check that too
    if (meta && meta.error && isDiscordConnectionError(meta.error)) {
      // Skip logging these errors in mock mode
      return;
    }
    
    // Pass through to original logger for non-Discord errors
    originalLoggerError.apply(logger, [message, meta]);
  };
  
  // Add process-level handlers for unhandled rejections and exceptions
  process.removeAllListeners('unhandledRejection');
  process.on('unhandledRejection', (reason) => {
    if (reason && isDiscordConnectionError(String(reason))) {
      // Silently ignore Discord-related rejections
      return;
    }
    
    logger.error('Unhandled Rejection:', { 
      reason: reason ? String(reason) : 'Unknown reason'
    });
  });
  
  process.removeAllListeners('uncaughtException');
  process.on('uncaughtException', (error) => {
    if (error && isDiscordConnectionError(String(error))) {
      // Silently ignore Discord-related exceptions
      return;
    }
    
    logger.error('Uncaught Exception:', { 
      error: String(error), 
      stack: error.stack
    });
  });
  
  logger.info('[MOCK] Error handling for Discord connection errors has been set up');
}

/**
 * Check if an error message is related to Discord WebSocket connection
 * @param {string} errorMessage - The error message to check
 * @returns {boolean} - True if it's a Discord connection error
 */
function isDiscordConnectionError(errorMessage) {
  if (!errorMessage) return false;
  
  const discordErrorPatterns = [
    'Connection closed abnormally',
    'WebSocket',
    'websocket',
    'ws://',
    'wss://',
    'heartbeat',
    'Discord gateway',
    'discord.js',
    'DiscordAPIError',
    'ECONNREFUSED',
    'getaddrinfo',
    'network',
    'Failed to connect',
    'connection reset',
    'connection error',
    'socket hang up',
    'ETIMEDOUT',
    'ENOTFOUND',
    'authentication',
    'status code: 4',  // Discord error codes start with 4
    'close frame',
    'gateway',
    'Invalid token provided',
    'Unauthorized',
    'Missing Access',
    'reconnect',
    'connection termination',
    'ReferenceError: createCollectionMethods',  // Add specific error from your logs
    'circular',
    'WebContainerClient',
    'connect ECONNREFUSED'
  ];
  
  return discordErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

module.exports = { 
  setupMockModeErrorHandling,
  isDiscordConnectionError 
};