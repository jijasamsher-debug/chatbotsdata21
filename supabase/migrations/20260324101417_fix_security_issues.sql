/*
  # Fix Security Issues and Optimize Database Performance

  1. Foreign Key Indexes
    - Add indexes for all foreign key columns to improve query performance
    - Covers: affiliate_applications, affiliate_commissions, affiliate_payouts, affiliate_resources, payment_requests

  2. RLS Policy Optimization
    - Wrap all auth.uid() calls in SELECT statements to prevent re-evaluation per row
    - Improves query performance at scale for all tables

  3. Function Security
    - Fix search_path issues for security functions
    - Make functions use stable search paths

  4. RLS Policy Improvements
    - Make overly permissive policies more restrictive where appropriate
    - Keep intentionally public policies (leads, contact submissions) but document them
    - Remove overly permissive affiliate_referrals system policies

  Important Notes:
    - Unused indexes warnings are expected for new applications and can be ignored
    - Multiple permissive policies are intentional (admin OR user checks)
    - Some policies are intentionally permissive for public features (leads, contact forms)
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Affiliate Applications
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_reviewed_by 
  ON public.affiliate_applications(reviewed_by);

-- Affiliate Commissions
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id 
  ON public.affiliate_commissions(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_payment_id 
  ON public.affiliate_commissions(payment_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_user_id 
  ON public.affiliate_commissions(user_id);

-- Affiliate Payouts
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate_id 
  ON public.affiliate_payouts(affiliate_id);

-- Affiliate Resources
CREATE INDEX IF NOT EXISTS idx_affiliate_resources_landing_page_id 
  ON public.affiliate_resources(landing_page_id);

-- Payment Requests
CREATE INDEX IF NOT EXISTS idx_payment_requests_processed_by 
  ON public.payment_requests(processed_by);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - USERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - BOTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read own bots" ON public.bots;
DROP POLICY IF EXISTS "Users can create own bots" ON public.bots;
DROP POLICY IF EXISTS "Users can update own bots" ON public.bots;
DROP POLICY IF EXISTS "Users can delete own bots" ON public.bots;

CREATE POLICY "Users can read own bots"
  ON public.bots
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own bots"
  ON public.bots
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own bots"
  ON public.bots
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own bots"
  ON public.bots
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - LEADS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read own leads" ON public.leads;

CREATE POLICY "Users can read own leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - PAYMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can create payments" ON public.payments;

CREATE POLICY "Users can read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can create payments"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - AFFILIATES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Affiliates can read own data" ON public.affiliates;
DROP POLICY IF EXISTS "Users can create affiliate applications" ON public.affiliates;

CREATE POLICY "Affiliates can read own data"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create affiliate applications"
  ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - AFFILIATE_COMMISSIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Affiliates can read own commissions" ON public.affiliate_commissions;

CREATE POLICY "Affiliates can read own commissions"
  ON public.affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 8. OPTIMIZE RLS POLICIES - AFFILIATE_PAYOUTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Affiliates can read own payouts" ON public.affiliate_payouts;
DROP POLICY IF EXISTS "Affiliates can request payouts" ON public.affiliate_payouts;

CREATE POLICY "Affiliates can read own payouts"
  ON public.affiliate_payouts
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Affiliates can request payouts"
  ON public.affiliate_payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 9. OPTIMIZE RLS POLICIES - AFFILIATE_RESOURCES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Approved affiliates can read resources" ON public.affiliate_resources;

CREATE POLICY "Approved affiliates can read resources"
  ON public.affiliate_resources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE user_id = (select auth.uid())
      AND status = 'approved'
    )
  );

-- =====================================================
-- 10. OPTIMIZE RLS POLICIES - PAYMENT_REQUESTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;

CREATE POLICY "Users can view own payment requests"
  ON public.payment_requests
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own payment requests"
  ON public.payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all payment requests"
  ON public.payment_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update payment requests"
  ON public.payment_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

-- =====================================================
-- 11. OPTIMIZE RLS POLICIES - AFFILIATE_APPLICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own applications" ON public.affiliate_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.affiliate_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.affiliate_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.affiliate_applications;

CREATE POLICY "Users can view their own applications"
  ON public.affiliate_applications
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own applications"
  ON public.affiliate_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all applications"
  ON public.affiliate_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all applications"
  ON public.affiliate_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

-- =====================================================
-- 12. OPTIMIZE RLS POLICIES - AFFILIATE_REFERRALS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Affiliates can view their own referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.affiliate_referrals;

CREATE POLICY "Affiliates can view their own referrals"
  ON public.affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view all referrals"
  ON public.affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

-- System operations for referrals should use service role
-- Overly permissive policies removed - use service role for system operations

-- =====================================================
-- 13. FIX FUNCTION SECURITY
-- =====================================================

-- Recreate is_admin function with stable search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- Recreate generate_affiliate_code function with stable search path
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE affiliate_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;