-- ============================================================
-- FULL FROM-SCRATCH SUPABASE PATCH
-- Project: iuyasnhjevxzidpsolfz.supabase.co
-- Run this ENTIRE block in the Supabase SQL Editor.
--
-- ROOT CAUSE OF PREVIOUS 500 ERRORS:
--   Policies on public.profiles queried public.profiles internally
--   → infinite recursion → 500 on every API call.
--
-- FIX: A SECURITY DEFINER function reads the role with elevated
--   privileges (bypasses RLS), breaking the recursion entirely.
--   Every admin check now calls public.get_my_role() instead of
--   querying profiles directly.
-- ============================================================


-- ============================================================
-- STEP 1: DROP ALL EXISTING BROKEN POLICIES
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- properties
DROP POLICY IF EXISTS "Admins have full access to properties" ON public.properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.properties;

-- property_images
DROP POLICY IF EXISTS "Admins have full access to property_images" ON public.property_images;
DROP POLICY IF EXISTS "Property images are viewable by everyone" ON public.property_images;

-- property_amenities
DROP POLICY IF EXISTS "Admins have full access to property_amenities" ON public.property_amenities;
DROP POLICY IF EXISTS "Property amenities are viewable by everyone" ON public.property_amenities;

-- projects
DROP POLICY IF EXISTS "Admins have full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;

-- leads / inquiries
DROP POLICY IF EXISTS "Admins have full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Admins have full access to inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON public.inquiries;

-- messages
DROP POLICY IF EXISTS "Admins have full access to messages" ON public.messages;

-- storage
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete property images" ON storage.objects;


-- ============================================================
-- STEP 2: CREATE SECURITY DEFINER ROLE HELPER
-- This function reads the caller's role from profiles WITHOUT
-- triggering RLS (SECURITY DEFINER runs as postgres superuser).
-- This is the only safe way to check roles inside RLS policies
-- on the profiles table itself.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


-- ============================================================
-- STEP 3: RECREATE ALL RLS POLICIES (using get_my_role)
-- ============================================================

-- ---- profiles ----
-- Users can always read their own row (needed so AuthContext can fetch role)
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own row
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can do everything (uses SECURITY DEFINER fn — no recursion)
CREATE POLICY "Admins full access to profiles" ON public.profiles
  FOR ALL
  USING      (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ---- properties ----
CREATE POLICY "Public can read properties" ON public.properties
  FOR SELECT USING (true);

CREATE POLICY "Admins full access to properties" ON public.properties
  FOR ALL
  USING      (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ---- property_images ----
CREATE POLICY "Public can read property images" ON public.property_images
  FOR SELECT USING (true);

CREATE POLICY "Admins full access to property_images" ON public.property_images
  FOR ALL
  USING      (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ---- property_amenities ----
CREATE POLICY "Public can read property amenities" ON public.property_amenities
  FOR SELECT USING (true);

CREATE POLICY "Admins full access to property_amenities" ON public.property_amenities
  FOR ALL
  USING      (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ---- projects ----
CREATE POLICY "Public can read projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Admins full access to projects" ON public.projects
  FOR ALL
  USING      (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ---- leads (inquiries from the website) ----
-- Anyone (including anonymous visitors) can INSERT a lead
CREATE POLICY "Anyone can submit a lead" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Only admins can read / update / delete leads
CREATE POLICY "Admins full access to leads" ON public.leads
  FOR ALL
  USING      (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ---- messages (AI chat log) ----
CREATE POLICY "Admins full access to messages" ON public.messages
  FOR ALL
  USING      (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');


-- ============================================================
-- STEP 4: STORAGE BUCKET + POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('property-images', 'property-images', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Admins can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images'
    AND public.get_my_role() = 'admin'
  );

CREATE POLICY "Admins can update property images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images'
    AND public.get_my_role() = 'admin'
  );

CREATE POLICY "Admins can delete property images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images'
    AND public.get_my_role() = 'admin'
  );


-- ============================================================
-- STEP 5: AUTO-CREATE PROFILE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- STEP 6: BACKFILL PROFILES FOR EXISTING AUTH USERS
-- ============================================================

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- STEP 7: GRANT ADMIN ROLE
-- !! Replace the email with your actual admin email !!
-- ============================================================

-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';


-- ============================================================
-- VERIFICATION — Run each line separately to confirm success
-- ============================================================

-- 1. Should return your admin user with role = 'admin'
--    SELECT u.email, p.role FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id;

-- 2. Should return 'on_auth_user_created'
--    SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- 3. Should return the property-images bucket
--    SELECT id, name, public FROM storage.buckets WHERE id = 'property-images';

-- 4. Should return 'get_my_role' (confirms the function exists)
--    SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_my_role';
