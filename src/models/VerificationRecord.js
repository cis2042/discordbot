// Verification record model for Supabase
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Check database type and mock mode
const databaseType = process.env.DATABASE_TYPE || 'supabase';
const mockMode = process.env.USE_MOCK_MODE === 'true';

let VerificationRecord;

// Create mock verification record functionality
const createMockVerificationRecord = () => ({
  findOne: async function(query) {
    logger.info('[MOCK] Using mock verification record');
    
    // Create a mock verification record
    const mockRecord = {
      userId: query.userId || 'mock-user-id',
      guildId: 'mock-guild-id',
      token: query.token || 'mock-token',
      verificationStatus: {
        reCaptcha: false,
        sms: false
      },
      attempts: 0,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      createdAt: new Date(),
      completedAt: query.completedAt,
      
      // Mock save method
      save: async function() {
        logger.info('[MOCK] Saving verification record:', this);
        return this;
      }
    };
    
    return mockRecord;
  },
  find: async function() {
    logger.info('[MOCK] Finding mock verification records');
    return [{
      userId: 'mock-user-id',
      guildId: 'mock-guild-id',
      token: 'mock-token',
      verificationStatus: {
        reCaptcha: false,
        sms: false
      }
    }];
  },
  create: async function(data) {
    logger.info('[MOCK] Creating mock verification record');
    data.save = async function() {
      logger.info('[MOCK] Saving verification record:', this);
      return this;
    };
    return data;
  }
});

if (mockMode) {
  // Use mock implementation in mock mode
  VerificationRecord = createMockVerificationRecord();
} else if (databaseType === 'supabase') {
  // Supabase implementation
  const { getSupabaseClient } = require('../utils/supabaseClient');
  
  VerificationRecord = {
    /**
     * Find a verification record by query parameters
     * @param {Object} query - Query parameters (userId, token, etc.)
     * @returns {Promise<Object>} Verification record
     */
    findOne: async function(query) {
      try {
        logger.info(`[Supabase] Finding verification record with query:`, query);
        
        const supabase = getSupabaseClient();
        
        // Build the query based on parameters
        let supabaseQuery = supabase.from('verification_records').select('*');
        
        if (query.userId) {
          supabaseQuery = supabaseQuery.eq('user_id', query.userId);
        }
        
        if (query.token) {
          supabaseQuery = supabaseQuery.eq('token', query.token);
        }
        
        if (query.guildId) {
          supabaseQuery = supabaseQuery.eq('guild_id', query.guildId);
        }
        
        if (query.completedAt === null) {
          supabaseQuery = supabaseQuery.is('completed_at', null);
        } else if (query.completedAt !== undefined) {
          supabaseQuery = supabaseQuery.not('completed_at', 'is', null);
        }
        
        // Get the first record
        logger.info(`[Supabase] Executing query: ${JSON.stringify(supabaseQuery)}`);
        const { data, error } = await supabaseQuery.order('created_at', { ascending: false }).limit(1).single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // Ignore "no rows returned" error
            logger.error('Supabase verification record fetch error:', { 
              error: error.message, 
              code: error.code,
              details: error.details,
              hint: error.hint
            });
          } else {
            logger.info(`[Supabase] No verification record found for query: ${JSON.stringify(query)}`);
            return null;
          }
          
          // For any error, try to fall back to memory mode
          logger.warn(`[Supabase] Falling back to memory mode due to error: ${error.message}`);
          
          // Create a mock record with the query parameters
          const mockRecord = {
            id: uuidv4(),
            userId: query.userId,
            guildId: query.guildId || 'unknown-guild',
            token: query.token,
            verificationStatus: {
              reCaptcha: false,
              sms: false
            },
            attempts: 0,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
            createdAt: new Date(),
            completedAt: query.completedAt,
            
            // Add save method
            save: async function() {
              logger.info('[Memory] Saving verification record:', this);
              return this;
            }
          };
          
          logger.info('[Memory] Created fallback verification record');
          return mockRecord;
        }
        
        if (!data) {
          logger.warn(`[Supabase] No verification record found for query: ${JSON.stringify(query)}`);
          return null;
        }
        
        // Transform from Supabase format to app format with save method
        const record = {
          id: data.id,
          userId: data.user_id,
          guildId: data.guild_id,
          token: data.token,
          verificationStatus: {
            reCaptcha: data.recaptcha_verified,
            sms: data.sms_verified
          },
          phoneHash: data.phone_hash,
          phoneCountry: data.phone_country,
          attempts: data.attempts,
          verificationCode: data.verification_code,
          codeExpiry: data.code_expiry ? new Date(data.code_expiry) : null,
          ipAddress: data.ip_address,
          expiresAt: new Date(data.expires_at),
          createdAt: new Date(data.created_at),
          completedAt: data.completed_at ? new Date(data.completed_at) : null,
          
          // Add save method
          save: async function() {
            return await VerificationRecord.updateRecord(this);
          }
        };
        
        return record;
      } catch (error) {
        logger.error('Error finding verification record:', { 
          error: error.toString(),
          stack: error.stack,
          query: JSON.stringify(query)
        });
        
        // Create a fallback record in memory
        logger.warn('[Supabase] Creating fallback verification record in memory due to error');
        const mockRecord = {
          id: uuidv4(),
          userId: query.userId,
          guildId: query.guildId || 'unknown-guild',
          token: query.token,
          verificationStatus: {
            reCaptcha: false,
            sms: false
          },
          attempts: 0,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          createdAt: new Date(),
          completedAt: query.completedAt,
          
          // Add save method
          save: async function() {
            logger.info('[Memory] Saving verification record:', this);
            return this;
          }
        };
        
        logger.info('[Memory] Created fallback verification record');
        return mockRecord;
      }
    },
    
    /**
     * Find verification records by query and sort
     * @param {Object} query - Query parameters
     * @param {Object} sort - Sort criteria
     * @returns {Promise<Array>} Array of verification records
     */
    find: async function(query, sort = { createdAt: -1 }) {
      try {
        logger.info(`[Supabase] Finding verification records with query:`, query);
        
        const supabase = getSupabaseClient();
        
        // Build the query based on parameters
        let supabaseQuery = supabase.from('verification_records').select('*');
        
        if (query.userId) {
          supabaseQuery = supabaseQuery.eq('user_id', query.userId);
        }
        
        if (query.guildId) {
          supabaseQuery = supabaseQuery.eq('guild_id', query.guildId);
        }
        
        if (query.completedAt === null) {
          supabaseQuery = supabaseQuery.is('completed_at', null);
        }
        
        // Determine sort order
        const sortField = Object.keys(sort)[0] || 'created_at';
        const sortDirection = sort[sortField] === -1 ? { ascending: false } : { ascending: true };
        
        // Convert from createdAt to created_at
        const supabaseSortField = sortField === 'createdAt' ? 'created_at' : sortField;
        
        // Get the records
        const { data, error } = await supabaseQuery.order(supabaseSortField, sortDirection);
        
        if (error) {
          logger.error('Supabase verification records fetch error:', { error: error.message });
          throw error;
        }
        
        if (!data || data.length === 0) {
          return [];
        }
        
        // Transform from Supabase format to app format
        return data.map(record => ({
          id: record.id,
          userId: record.user_id,
          guildId: record.guild_id,
          token: record.token,
          verificationStatus: {
            reCaptcha: record.recaptcha_verified,
            sms: record.sms_verified
          },
          phoneHash: record.phone_hash,
          phoneCountry: record.phone_country,
          attempts: record.attempts,
          verificationCode: record.verification_code,
          codeExpiry: record.code_expiry ? new Date(record.code_expiry) : null,
          ipAddress: record.ip_address,
          expiresAt: new Date(record.expires_at),
          createdAt: new Date(record.created_at),
          completedAt: record.completed_at ? new Date(record.completed_at) : null,
          
          // Add save method
          save: async function() {
            return await VerificationRecord.updateRecord(this);
          }
        }));
      } catch (error) {
        logger.error('Error finding verification records:', { error: error.toString() });
        throw error;
      }
    },
    
    /**
     * Create a new verification record
     * @param {Object} data - Verification record data
     * @returns {Promise<Object>} Created verification record
     */
    create: async function(data) {
      try {
        logger.info(`[Supabase] Creating new verification record for user: ${data.userId}`);
        
        const supabase = getSupabaseClient();
        
        // Transform from app format to Supabase format
        const recordData = {
          id: uuidv4(),
          user_id: data.userId,
          guild_id: data.guildId,
          token: data.token,
          recaptcha_verified: data.verificationStatus?.reCaptcha || false,
          sms_verified: data.verificationStatus?.sms || false,
          phone_hash: data.phoneHash || null,
          phone_country: data.phoneCountry || null,
          attempts: data.attempts || 0,
          verification_code: data.verificationCode || null,
          code_expiry: data.codeExpiry ? data.codeExpiry.toISOString() : null,
          ip_address: data.ipAddress || null,
          expires_at: data.expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          completed_at: data.completedAt ? data.completedAt.toISOString() : null
        };
        
        const { data: insertedData, error } = await supabase
          .from('verification_records')
          .insert(recordData)
          .select()
          .single();
        
        if (error) {
          logger.error('Supabase verification record insert error:', { error: error.message });
          throw error;
        }
        
        // Transform back to app format with save method
        const record = {
          id: insertedData.id,
          userId: insertedData.user_id,
          guildId: insertedData.guild_id,
          token: insertedData.token,
          verificationStatus: {
            reCaptcha: insertedData.recaptcha_verified,
            sms: insertedData.sms_verified
          },
          phoneHash: insertedData.phone_hash,
          phoneCountry: insertedData.phone_country,
          attempts: insertedData.attempts,
          verificationCode: insertedData.verification_code,
          codeExpiry: insertedData.code_expiry ? new Date(insertedData.code_expiry) : null,
          ipAddress: insertedData.ip_address,
          expiresAt: new Date(insertedData.expires_at),
          createdAt: new Date(insertedData.created_at),
          completedAt: insertedData.completed_at ? new Date(insertedData.completed_at) : null,
          
          // Add save method
          save: async function() {
            return await VerificationRecord.updateRecord(this);
          }
        };
        
        return record;
      } catch (error) {
        logger.error('Error creating verification record:', { error: error.toString() });
        throw error;
      }
    },
    
    /**
     * Update a verification record
     * @param {Object} record - Verification record to update
     * @returns {Promise<Object>} Updated verification record
     */
    updateRecord: async function(record) {
      try {
        logger.info(`[Supabase] Updating verification record for user: ${record.userId}`);
        
        if (!record.id) {
          throw new Error('Record ID is required for update');
        }
        
        const supabase = getSupabaseClient();
        
        // Transform from app format to Supabase format
        const updateData = {
          recaptcha_verified: record.verificationStatus?.reCaptcha || false,
          sms_verified: record.verificationStatus?.sms || false,
          phone_hash: record.phoneHash || null,
          phone_country: record.phoneCountry || null,
          attempts: record.attempts || 0,
          verification_code: record.verificationCode || null,
          code_expiry: record.codeExpiry ? record.codeExpiry.toISOString() : null,
          ip_address: record.ipAddress || null,
          completed_at: record.completedAt ? record.completedAt.toISOString() : null
        };
        
        const { data: updatedData, error } = await supabase
          .from('verification_records')
          .update(updateData)
          .eq('id', record.id)
          .select()
          .single();
        
        if (error) {
          logger.error('Supabase verification record update error:', { error: error.message });
          throw error;
        }
        
        // Transform back to app format with save method
        const updatedRecord = {
          id: updatedData.id,
          userId: updatedData.user_id,
          guildId: updatedData.guild_id,
          token: updatedData.token,
          verificationStatus: {
            reCaptcha: updatedData.recaptcha_verified,
            sms: updatedData.sms_verified
          },
          phoneHash: updatedData.phone_hash,
          phoneCountry: updatedData.phone_country,
          attempts: updatedData.attempts,
          verificationCode: updatedData.verification_code,
          codeExpiry: updatedData.code_expiry ? new Date(updatedData.code_expiry) : null,
          ipAddress: updatedData.ip_address,
          expiresAt: new Date(updatedData.expires_at),
          createdAt: new Date(updatedData.created_at),
          completedAt: updatedData.completed_at ? new Date(updatedData.completed_at) : null,
          
          // Add save method
          save: async function() {
            return await VerificationRecord.updateRecord(this);
          }
        };
        
        return updatedRecord;
      } catch (error) {
        logger.error('Error updating verification record:', { error: error.toString() });
        throw error;
      }
    }
  };
} else {
  // Fallback to mock implementation for unknown database types
  VerificationRecord = createMockVerificationRecord();
  logger.warn(`Unknown database type: ${databaseType}. Using mock implementation.`);
}

module.exports = VerificationRecord;