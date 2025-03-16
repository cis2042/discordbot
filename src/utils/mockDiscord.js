// Mock implementation of Discord.js client for testing
const { Collection, Events } = require('discord.js');
const logger = require('./logger');

/**
 * Creates a mock Discord client for testing without real Discord connection
 * @returns {Object} Mock Discord client
 */
function createMockDiscordClient() {
  logger.info('[MOCK] Creating mock Discord client');
  
  // Mock event handlers storage
  const eventHandlers = {
    once: new Map(),
    on: new Map()
  };
  
  // Helper function to create collection methods
  const createCollectionMethods = (collection) => {
    collection.filter = () => collection;
    collection.map = (fn) => Array.from(collection.values()).map(fn);
    collection.forEach = (fn) => {
      Array.from(collection.values()).forEach(fn);
      return collection;
    };
    collection.get = (id) => {
      // Create mock entities on demand for more flexible testing
      if (id === 'mock-guild-id' || (typeof id === 'string' && id.startsWith('mock-guild-'))) {
        const mockGuild = createMockGuild(id);
        return mockGuild;
      }
      return null;
    };
    collection.find = () => null;
    collection.size = 1;
    collection.set = (id, value) => {
      // Safely handle set operations without actually modifying the collection
      logger.info(`[MOCK] Simulating setting ${id} in collection`);
      return collection;
    };
    return collection;
  };
  
  const mockClient = {
    // Collections for commands and cooldowns
    commands: new Collection(),
    cooldowns: new Collection(),
    
    // Mock user data
    user: {
      tag: 'MockBot#0000',
      id: '000000000000000000',
      setActivity: (activity) => {
        logger.info(`[MOCK] Bot activity set to: ${activity}`);
        return Promise.resolve();
      }
    },
    
    // Mock users collection
    users: {
      cache: new Collection(),
      fetch: async (userId) => {
        logger.info(`[MOCK] Fetching user with ID: ${userId}`);
        return {
          id: userId,
          tag: `MockUser#${userId.substring(0, 4)}`,
          send: async (content) => {
            logger.info(`[MOCK] Sent DM to user ${userId}: ${typeof content === 'object' ? JSON.stringify(content).substring(0, 100) : String(content).substring(0, 100)}...`);
            return { id: 'mock-message-id' };
          }
        };
      }
    },
    
    // Mock guilds collection
    guilds: {
      cache: new Collection(),
      fetch: async (guildId) => {
        logger.info(`[MOCK] Fetching guild with ID: ${guildId}`);
        return createMockGuild(guildId);
      }
    },
    
    // Mock channels collection
    channels: {
      cache: new Collection(),
      fetch: async (channelId) => {
        logger.info(`[MOCK] Fetching channel with ID: ${channelId}`);
        return {
          id: channelId,
          name: `mock-channel-${channelId.substring(0, 4)}`,
          send: async (content) => {
            logger.info(`[MOCK] Sent message to channel ${channelId}`);
            return { id: 'mock-message-id' };
          }
        };
      }
    },
    
    // Mock event handlers
    on: (event, handler) => {
      logger.info(`[MOCK] Registered handler for Discord event: ${event}`);
      
      // Store event handler
      if (!eventHandlers.on.has(event)) {
        eventHandlers.on.set(event, []);
      }
      eventHandlers.on.get(event).push(handler);
      
      return mockClient;
    },
    
    once: (event, handler) => {
      logger.info(`[MOCK] Registered one-time handler for Discord event: ${event}`);
      
      // Store event handler
      if (!eventHandlers.once.has(event)) {
        eventHandlers.once.set(event, []);
      }
      eventHandlers.once.get(event).push(handler);
      
      // If it's the ready event, execute the handler immediately with the mock client
      if (event === 'ready' || event === Events.ClientReady) {
        setTimeout(() => {
          try {
            logger.info('[MOCK] Simulating Discord ready event');
            handler(mockClient);
            // Remove the once handler after execution
            eventHandlers.once.set(event, []);
          } catch (error) {
            logger.error('[MOCK] Error handling ready event:', { error: error.toString() });
          }
        }, 100);
      }
      
      return mockClient;
    },
    
    // Mock emit method to trigger events
    emit: (event, ...args) => {
      logger.info(`[MOCK] Emitted Discord event: ${event}`);
      
      try {
        // Execute any 'once' handlers
        if (eventHandlers.once.has(event)) {
          const handlers = eventHandlers.once.get(event);
          eventHandlers.once.set(event, []); // Clear after executing
          for (const handler of handlers) {
            try {
              handler(...args, mockClient);
            } catch (error) {
              logger.error(`[MOCK] Error in 'once' event handler for ${event}:`, { 
                error: error.toString() 
              });
            }
          }
        }
        
        // Execute any 'on' handlers
        if (eventHandlers.on.has(event)) {
          const handlers = eventHandlers.on.get(event);
          for (const handler of handlers) {
            try {
              handler(...args, mockClient);
            } catch (error) {
              logger.error(`[MOCK] Error in 'on' event handler for ${event}:`, { 
                error: error.toString() 
              });
            }
          }
        }
      } catch (error) {
        logger.error(`[MOCK] Error emitting event ${event}:`, { error: error.toString() });
      }
      
      return true;
    },
    
    // Mock destroy method
    destroy: () => {
      logger.info('[MOCK] Destroying Discord client');
      return Promise.resolve();
    },
    
    // Mock login method - Very important to return Promise that won't trigger websocket errors
    login: (token) => {
      logger.info('[MOCK] Simulating Discord login with token');
      
      // Store the token but don't actually use it
      mockClient.token = 'mock-token';
      
      // Trigger ready event after very short delay to ensure handlers are registered
      setTimeout(() => {
        try {
          logger.info('[MOCK] Emitting ready event');
          mockClient.emit('ready', mockClient);
          
          // Simulate interactions for testing
          setTimeout(() => {
            try {
              simulateInteractions(mockClient, eventHandlers);
            } catch (error) {
              logger.error('[MOCK] Error simulating interactions:', { error: error.toString() });
            }
          }, 500);
        } catch (error) {
          logger.error('[MOCK] Error during login process:', { error: error.toString() });
        }
      }, 50);
      
      // Return resolved promise to prevent any waiting
      return Promise.resolve('mock-token');
    },
    
    // Mock application command handling
    application: {
      commands: {
        fetch: () => Promise.resolve(new Collection()),
        create: (data) => {
          logger.info(`[MOCK] Created application command: ${data.name}`);
          return Promise.resolve(data);
        },
      }
    },
    
    // Mock REST properties
    rest: {
      get: () => Promise.resolve({}),
      post: () => Promise.resolve({}),
      put: () => Promise.resolve({}),
      patch: () => Promise.resolve({}),
      delete: () => Promise.resolve({})
    },
    
    // Other mock properties
    ws: {
      ping: 42
    },
    token: null,
    readyAt: new Date(),
    options: {
      intents: []
    }
  };
  
  // Create properly initialized collections
  mockClient.commands = createCollectionMethods(mockClient.commands);
  mockClient.cooldowns = createCollectionMethods(mockClient.cooldowns);
  
  // Add mock methods to collections to ensure they're chainable
  const guildsCache = new Collection();
  const usersCache = new Collection();
  const channelsCache = new Collection();
  
  mockClient.guilds.cache = createCollectionMethods(guildsCache);
  mockClient.users.cache = createCollectionMethods(usersCache);
  mockClient.channels.cache = createCollectionMethods(channelsCache);
  
  // Helper function to create a mock guild with all necessary properties
  function createMockGuild(guildId) {
    const mockGuild = {
      name: `Mock Discord Server ${guildId.substring(0, 4)}`,
      id: guildId,
      members: {
        cache: new Collection(),
        fetch: async (id) => {
          logger.info(`[MOCK] Fetching member with ID: ${id}`);
          return {
            user: { 
              tag: `MockUser#${id.substring(0, 4)}`,
              id: id,
              send: async (msg) => {
                logger.info(`[MOCK] Sent DM to user ${id}: ${typeof msg === 'object' ? JSON.stringify(msg).substring(0, 100) : String(msg).substring(0, 100)}...`);
                return { id: 'mock-message-id' };
              }
            },
            roles: {
              add: async (roleId) => {
                logger.info(`[MOCK] Added role ${roleId} to user ${id}`);
                return true;
              },
              remove: async (roleId) => {
                logger.info(`[MOCK] Removed role ${roleId} from user ${id}`);
                return true;
              },
              cache: { 
                has: (roleId) => {
                  logger.info(`[MOCK] Checking if user ${id} has role ${roleId}`);
                  return false;
                },
                size: 1,
                forEach: () => {}
              }
            },
            send: async (msg) => {
              logger.info(`[MOCK] Sent message to user ${id}: ${typeof msg === 'object' ? JSON.stringify(msg).substring(0, 100) : String(msg).substring(0, 100)}...`);
              return { id: 'mock-message-id' };
            },
            displayName: `MockUser_${id.substring(0, 4)}`,
            id: id,
            guild: { id: guildId, name: `Mock Discord Server ${guildId.substring(0, 4)}` },
            joinedAt: new Date(),
            permissions: {
              has: (permission) => true
            }
          };
        },
        me: {
          id: '000000000000000000',
          displayName: 'MockBot',
          permissions: {
            has: () => true
          },
          roles: {
            highest: {
              position: 100
            }
          }
        }
      },
      channels: {
        cache: new Collection(),
        create: async (name, options) => {
          logger.info(`[MOCK] Created channel ${name} with options:`, options);
          return {
            id: 'mock-channel-id',
            name: name,
            send: async (msg) => {
              logger.info(`[MOCK] Sent message to channel ${name}`);
              return { id: 'mock-message-id' };
            }
          };
        }
      },
      roles: {
        cache: new Collection(),
        create: async (options) => {
          logger.info(`[MOCK] Created role with options:`, options);
          return {
            id: 'mock-role-id',
            name: options.name || 'Mock Role'
          };
        },
        everyone: {
          id: 'everyone-role-id',
          position: 0
        }
      }
    };
    
    // Setup roles
    const roles = new Collection();
    roles.set('verified-role', {
      id: 'verified-role',
      name: '已驗證用戶',
      position: 1
    });
    
    roles.set('human-role', {
      id: 'human-role',
      name: 'Human',
      position: 2
    });
    
    // Set up collections with createCollectionMethods
    mockGuild.members.cache = createCollectionMethods(new Collection());
    mockGuild.channels.cache = createCollectionMethods(new Collection());
    mockGuild.roles.cache = createCollectionMethods(roles);
    
    return mockGuild;
  }
  
  return mockClient;
}

// Simulate Discord interactions for testing
function simulateInteractions(mockClient, eventHandlers) {
  logger.info('[MOCK] Setting up simulated Discord interactions');
  
  // Add mock commands if not already present
  if (mockClient.commands) {
    // Only add if not already present
    if (!mockClient.commands.get('verify')) {
      // Mock verify command
      mockClient.commands.set('verify', {
        data: { name: 'verify' },
        execute: async (interaction) => {
          logger.info('[MOCK] Executing /verify command');
          
          return {
            reply: async (options) => {
              logger.info('[MOCK] Command reply:', options);
              return { id: 'mock-reply-id' };
            },
            deferReply: async () => {
              logger.info('[MOCK] Command defer reply');
              return { id: 'mock-defer-id' };
            },
            editReply: async (options) => {
              logger.info('[MOCK] Command edit reply:', options);
              return { id: 'mock-edit-id' };
            }
          };
        }
      });
    }
    
    if (!mockClient.commands.get('setup')) {
      // Mock setup command
      mockClient.commands.set('setup', {
        data: { name: 'setup' },
        execute: async (interaction) => {
          logger.info('[MOCK] Executing /setup command');
          
          return {
            reply: async (options) => {
              logger.info('[MOCK] Command reply:', options);
              return { id: 'mock-reply-id' };
            },
            deferReply: async () => {
              logger.info('[MOCK] Command defer reply');
              return { id: 'mock-defer-id' };
            },
            editReply: async (options) => {
              logger.info('[MOCK] Command edit reply:', options);
              return { id: 'mock-edit-id' };
            }
          };
        }
      });
    }
  }
}

module.exports = { createMockDiscordClient };