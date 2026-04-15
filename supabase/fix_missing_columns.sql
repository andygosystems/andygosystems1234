-- ============================================================
-- FIX MISSING COLUMNS + VIDEO SUPPORT
-- Run this in Supabase SQL Editor (iuyasnhjevxzidpsolfz)
-- ============================================================

-- 1. Add missing columns to leads table
--    (message, property_id, subject were missing from original schema)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS subject TEXT;
-- property_id as TEXT to avoid UUID cast errors from frontend
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS property_id TEXT;

-- source column is missing from the live DB in some deployments
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website'
  CHECK (source IN ('whatsapp', 'facebook', 'website', 'referral', 'other'));

-- 2. Add video_url, video_urls array, and price_on_request to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_urls JSONB DEFAULT '[]';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN DEFAULT FALSE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS flags JSONB DEFAULT '[]';

-- 3. Add video_url to projects (for uploaded/linked project videos)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 4. Allow anonymous visitors to INSERT AI chat messages
--    (removed in patch_live_db.sql but needed for AI chat logging)
DROP POLICY IF EXISTS "Public can insert messages" ON public.messages;
CREATE POLICY "Public can insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- 5. Allow anonymous visitors to INSERT leads (contact form + property inquiries)
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
CREATE POLICY "Public can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- 6. Storage: allow any authenticated user (admin) to upload videos
--    They share the same property-images bucket under a videos/ prefix
DROP POLICY IF EXISTS "Admins can upload videos" ON storage.objects;
CREATE POLICY "Admins can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images'
    AND public.get_my_role() = 'admin'
  );

-- 7. Fix leads status constraint to allow all frontend statuses
--    Default DB only allows: new, contacted, qualified, closed
--    We also want to store 'archived' directly
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'archived'));

-- 8. Property visit tracking table (timestamped, persisted to Supabase)
CREATE TABLE IF NOT EXISTS public.property_visits (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT        NOT NULL,
  visitor_id  TEXT,
  visited_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert property visit" ON public.property_visits;
CREATE POLICY "Anyone can insert property visit" ON public.property_visits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read property visits" ON public.property_visits;
CREATE POLICY "Admins can read property visits" ON public.property_visits
  FOR SELECT USING (public.get_my_role() = 'admin');

-- Ensure visits counter column exists on properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS visits INTEGER DEFAULT 0;

-- ============================================================
-- VERIFICATION
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'leads' AND column_name IN ('message','property_id','subject');
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'properties' AND column_name IN ('video_url','visits');
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'projects' AND column_name = 'video_url';
-- SELECT count(*) FROM public.property_visits;
-- ============================================================
