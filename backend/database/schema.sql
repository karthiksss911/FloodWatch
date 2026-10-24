-- ====================================================================
-- FLOODWATCH KERALA - POSTGRESQL / SUPABASE PRODUCTION SCHEMA
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: INCIDENTS
CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('waterlogging', 'road_blockage', 'river_overflow', 'landslide_risk', 'tree_fall')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high', 'severe')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'archived')),
  source_type TEXT NOT NULL DEFAULT 'community' CHECK (source_type IN ('community', 'volunteer_patrol', 'official', 'sensor')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'community_confirmed', 'verified_official', 'rejected_spam', 'demo_unverified', 'demo_reviewed', 'demo_community_confirmed', 'demo_facility_record')),
  location_label TEXT NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(10, 6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  water_depth_cm INTEGER DEFAULT 0,
  passable_for TEXT DEFAULT 'Unknown',
  description TEXT,
  rainfall_value NUMERIC(6, 2) DEFAULT 0,
  rainfall_source TEXT,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reporter_notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  review_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLE: ASSISTANCE POINTS
CREATE TABLE IF NOT EXISTS public.assistance_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('shelter', 'medical', 'rescue_hub', 'supply_depot', 'other')),
  category_label TEXT NOT NULL,
  location_label TEXT NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(10, 6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  contact_phone TEXT,
  official_helpline TEXT,
  capacity_total INTEGER DEFAULT 0,
  capacity_occupied INTEGER DEFAULT 0,
  supplies_status TEXT,
  medical_support TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified',
  wheelchair_accessible BOOLEAN NOT NULL DEFAULT false,
  operating_authority TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active_operations', 'limited_capacity', 'full', 'closed')),
  is_simulated BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE: INCIDENT REVIEWS (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.incident_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  previous_verification TEXT,
  new_verification TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_incidents_status_created ON public.incidents (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON public.incidents (category);
CREATE INDEX IF NOT EXISTS idx_incidents_verification ON public.incidents (verification_status);
CREATE INDEX IF NOT EXISTS idx_incidents_coordinates ON public.incidents (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_incidents_is_demo ON public.incidents (is_demo);

CREATE INDEX IF NOT EXISTS idx_assistance_category_status ON public.assistance_points (category, status);
CREATE INDEX IF NOT EXISTS idx_assistance_coordinates ON public.assistance_points (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reviews_incident_id ON public.incident_reviews (incident_id);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reviews ENABLE ROW LEVEL SECURITY;

-- Incident Policies
-- Anyone can view public non-archived incidents or demo records
CREATE POLICY "Public read active incidents"
  ON public.incidents
  FOR SELECT
  USING (status != 'archived' OR is_demo = true);

-- Community members can insert citizen reports, but CANNOT self-verify
CREATE POLICY "Public submit citizen incidents"
  ON public.incidents
  FOR INSERT
  WITH CHECK (
    verification_status IN ('unverified', 'demo_unverified') 
    AND source_type = 'community'
  );

-- Only authenticated authority service role can update status and verification
CREATE POLICY "Authority service role update incidents"
  ON public.incidents
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Assistance Points Policies
CREATE POLICY "Public read assistance points"
  ON public.assistance_points
  FOR SELECT
  USING (true);

CREATE POLICY "Authority manage assistance points"
  ON public.assistance_points
  FOR ALL
  USING (auth.role() = 'service_role');

-- Incident Reviews Policies
CREATE POLICY "Public read review audit trail"
  ON public.incident_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authority insert review audit log"
  ON public.incident_reviews
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 7. SEED DATA GENERATOR TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_incidents_updated_at ON public.incidents;
CREATE TRIGGER tr_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_assistance_updated_at ON public.assistance_points;
CREATE TRIGGER tr_assistance_updated_at
  BEFORE UPDATE ON public.assistance_points
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
