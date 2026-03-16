-- Full Migration to Supabase (PostgreSQL)

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Profiles (Admin & User management)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Properties (The core real estate data)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  location TEXT NOT NULL,
  type TEXT CHECK (type IN ('Sale', 'Rent')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'rented')),
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  sqm NUMERIC DEFAULT 0,
  lat NUMERIC,
  lng NUMERIC,
  property_type TEXT,
  virtual_tour_url TEXT,
  
  -- Kenyan Land Fields
  land_category TEXT CHECK (land_category IN ('Residential', 'Commercial', 'Agricultural', 'Industrial')),
  tenure_type TEXT CHECK (tenure_type IN ('Freehold', 'Leasehold_99', 'Leasehold_999')),
  plot_size TEXT CHECK (plot_size IN ('50x100', '1_8_acre', '1_4_acre', '1_2_acre', 'full_acre')),
  doc_ready_title BOOLEAN DEFAULT FALSE,
  doc_allotment_letter BOOLEAN DEFAULT FALSE,
  doc_search_conducted BOOLEAN DEFAULT FALSE,
  invest_fenced BOOLEAN DEFAULT FALSE,
  invest_beacons BOOLEAN DEFAULT FALSE,
  invest_borehole BOOLEAN DEFAULT FALSE,
  invest_electricity BOOLEAN DEFAULT FALSE,
  proximity_near_main_road BOOLEAN DEFAULT FALSE,
  proximity_distance_cbd NUMERIC,
  proximity_future_infra BOOLEAN DEFAULT FALSE,
  topography TEXT CHECK (topography IN ('Flat', 'Sloped', 'RedSoil')),
  payment_plan TEXT CHECK (payment_plan IN ('Cash', 'Installments', 'BankFinancing')),
  verified_listing BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Property Images & Amenities (Relational)
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_amenities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRM: Leads & Messages
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  stage TEXT DEFAULT 'inquiry' CHECK (stage IN ('inquiry', 'viewing', 'negotiation', 'closed')),
  source TEXT DEFAULT 'website' CHECK (source IN ('whatsapp', 'facebook', 'website', 'referral', 'other')),
  notes TEXT,
  speed_to_lead_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Knowledge Base (AI Vectors)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Leases & Maintenance (Financials)
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_costs ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies

-- Public Read access to properties/images/amenities
CREATE POLICY "Public can view properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Public can view images" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Public can view amenities" ON public.property_amenities FOR SELECT USING (true);

-- Admin Full access to everything (using auth.uid and profiles check)
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (role = 'admin');
CREATE POLICY "Admins have full access to properties" ON public.properties FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to property_images" ON public.property_images FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to property_amenities" ON public.property_amenities FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to leads" ON public.leads FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to messages" ON public.messages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to KB" ON public.knowledge_base FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to leases" ON public.leases FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins have full access to maintenance" ON public.maintenance_costs FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Public can insert leads/messages
CREATE POLICY "Public can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert messages" ON public.messages FOR INSERT WITH CHECK (true);

-- 10. Helper function for Vector Search
CREATE OR REPLACE FUNCTION match_kb (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
