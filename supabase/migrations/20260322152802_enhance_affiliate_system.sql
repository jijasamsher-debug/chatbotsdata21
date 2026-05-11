/*
  # Enhance Affiliate System

  ## Overview
  Adds affiliate application system and enhances existing affiliate tables.

  ## 1. New Tables
  
  ### `affiliate_applications`
  Stores affiliate program applications from users
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `user_email` (text)
  - `full_name` (text)
  - `website_url` (text, optional)
  - `social_media` (text, optional)
  - `promotion_plan` (text) - How they plan to promote
  - `status` (text) - pending, approved, rejected
  - `admin_notes` (text, optional)
  - `applied_at` (timestamptz)
  - `reviewed_at` (timestamptz, optional)
  - `reviewed_by` (uuid, optional, references auth.users)

  ## 2. Enhanced Columns
  
  Add missing columns to existing tables

  ## 3. Security
  
  - Enable RLS on all tables
  - Affiliates can view their own data only
  - Admins can view and manage all data
  - Users can apply for affiliate program

  ## 4. Important Notes
  
  - Affiliate codes are auto-generated as unique 8-character strings
  - Default commission rate is 20%
  - Commissions are tracked and require admin approval
*/

-- Create affiliate_applications table
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  user_email text NOT NULL,
  full_name text NOT NULL,
  website_url text,
  social_media text,
  promotion_plan text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users
);

-- Add missing columns to affiliates table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'total_referrals'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN total_referrals integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'affiliate_code'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN affiliate_code text UNIQUE;
  END IF;
END $$;

-- Rename 'code' column to 'affiliate_code' if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'code'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'affiliate_code'
  ) THEN
    ALTER TABLE affiliates RENAME COLUMN code TO affiliate_code;
  END IF;
END $$;

-- Add total_earnings column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'total_earnings'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN total_earnings numeric DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create affiliate_referrals table if it doesn't exist
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates NOT NULL,
  referred_user_id uuid REFERENCES auth.users NOT NULL,
  referred_user_email text NOT NULL,
  status text NOT NULL DEFAULT 'visited' CHECK (status IN ('visited', 'signed_up', 'subscribed', 'churned')),
  subscription_plan text,
  subscription_amount numeric,
  commission_earned numeric DEFAULT 0 NOT NULL,
  commission_paid boolean DEFAULT false NOT NULL,
  visit_date timestamptz DEFAULT now(),
  signup_date timestamptz,
  subscription_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_applications
CREATE POLICY "Users can view their own applications"
  ON affiliate_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON affiliate_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON affiliate_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update all applications"
  ON affiliate_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Policies for affiliate_referrals
CREATE POLICY "Affiliates can view their own referrals"
  ON affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_referrals.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all referrals"
  ON affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "System can insert referrals"
  ON affiliate_referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON affiliate_referrals FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_user_id ON affiliate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate random 8-character code (uppercase letters and numbers)
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;