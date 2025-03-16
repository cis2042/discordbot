/*
  # Create Discord Verification System Tables

  1. New Tables
    - `server_configs` - Stores Discord server configuration
      - `id` (uuid, primary key) - Unique identifier
      - `guild_id` (text, unique) - Discord guild/server ID
      - `verified_role_id` (text) - Role ID for verified users
      - `human_role_id` (text) - Role ID for users who completed SMS verification
      - `require_recaptcha` (boolean) - Whether reCAPTCHA verification is required
      - `require_sms` (boolean) - Whether SMS verification is required
      - `welcome_message` (text) - Message to send after verification
      - `verification_channel_id` (text) - Channel ID for verification
      - `delete_messages_after_verification` (boolean) - Whether to delete messages after verification
      - `verification_timeout` (integer) - Verification timeout in minutes
      - `max_attempts` (integer) - Maximum verification attempts
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `verification_records` - Stores user verification records
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text) - Discord user ID
      - `guild_id` (text) - Discord guild/server ID
      - `token` (text) - Verification token
      - `recaptcha_verified` (boolean) - Whether reCAPTCHA is verified
      - `sms_verified` (boolean) - Whether SMS is verified
      - `phone_hash` (text) - Hashed phone number (for privacy)
      - `phone_country` (text) - Phone country code
      - `attempts` (integer) - Number of verification attempts
      - `verification_code` (text) - SMS verification code
      - `code_expiry` (timestamptz) - Expiration time for verification code
      - `ip_address` (text) - IP address used for verification
      - `expires_at` (timestamptz) - Expiration time for verification
      - `created_at` (timestamptz) - Creation timestamp
      - `completed_at` (timestamptz) - Completion timestamp
  
  2. Security
    - Row Level Security enabled on both tables
    - Policies set for authenticated users
*/

-- Create server_configs table
CREATE TABLE IF NOT EXISTS server_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT UNIQUE NOT NULL,
  verified_role_id TEXT NOT NULL,
  human_role_id TEXT,
  require_recaptcha BOOLEAN DEFAULT TRUE,
  require_sms BOOLEAN DEFAULT TRUE,
  welcome_message TEXT DEFAULT '歡迎加入我們的服務器！你已通過驗證。',
  verification_channel_id TEXT,
  delete_messages_after_verification BOOLEAN DEFAULT TRUE,
  verification_timeout INTEGER DEFAULT 30,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
  
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS server_configs_guild_id_idx ON server_configs(guild_id);
  
-- Enable Row Level Security
ALTER TABLE server_configs ENABLE ROW LEVEL SECURITY;
  
-- Create policy for authenticated users
DROP POLICY IF EXISTS "Server configs are accessible by authenticated users" ON server_configs;
CREATE POLICY "Server configs are accessible by authenticated users"
  ON server_configs
  FOR ALL
  TO authenticated
  USING (true);

-- Create verification_records table
CREATE TABLE IF NOT EXISTS verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  token TEXT NOT NULL,
  recaptcha_verified BOOLEAN DEFAULT FALSE,
  sms_verified BOOLEAN DEFAULT FALSE,
  phone_hash TEXT,
  phone_country TEXT,
  attempts INTEGER DEFAULT 0,
  verification_code TEXT,
  code_expiry TIMESTAMPTZ,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
  
-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS verification_records_user_id_idx ON verification_records(user_id);
CREATE INDEX IF NOT EXISTS verification_records_guild_id_idx ON verification_records(guild_id);
CREATE INDEX IF NOT EXISTS verification_records_token_idx ON verification_records(token);
CREATE INDEX IF NOT EXISTS verification_records_user_guild_idx ON verification_records(user_id, guild_id);
  
-- Enable Row Level Security
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
  
-- Create policy for authenticated users
DROP POLICY IF EXISTS "Verification records are accessible by authenticated users" ON verification_records;
CREATE POLICY "Verification records are accessible by authenticated users"
  ON verification_records
  FOR ALL
  TO authenticated
  USING (true);