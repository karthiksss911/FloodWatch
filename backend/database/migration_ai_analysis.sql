-- ====================================================================
-- NAADUSYNC / FLOODWATCH KERALA - AI INCIDENT INTELLIGENCE MIGRATION
-- Table: public.incident_ai_analyses
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.incident_ai_analyses (
  id BIGSERIAL PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL DEFAULT 'other' CHECK (
    incident_type IN ('waterlogging', 'road_blockage', 'flooding', 'infrastructure_damage', 'rescue_request', 'other')
  ),
  ai_severity TEXT NOT NULL DEFAULT 'unknown' CHECK (
    ai_severity IN ('low', 'moderate', 'high', 'critical', 'unknown')
  ),
  urgency TEXT NOT NULL DEFAULT 'unknown' CHECK (
    urgency IN ('routine', 'elevated', 'urgent', 'emergency', 'unknown')
  ),
  road_status TEXT NOT NULL DEFAULT 'unknown' CHECK (
    road_status IN ('open', 'partially_blocked', 'blocked', 'unknown')
  ),
  summary TEXT NOT NULL DEFAULT '',
  reasoning JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_action TEXT NOT NULL DEFAULT '',
  confidence NUMERIC(3, 2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  needs_human_review BOOLEAN NOT NULL DEFAULT false,
  model_name TEXT NOT NULL,
  analysis_status TEXT NOT NULL DEFAULT 'completed' CHECK (
    analysis_status IN ('pending', 'completed', 'failed')
  ),
  error_message TEXT,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_incident_ai_analyses_incident_id UNIQUE (incident_id)
);

-- Indexes for rapid lookup and foreign key integrity
CREATE INDEX IF NOT EXISTS idx_incident_ai_analyses_incident_id 
  ON public.incident_ai_analyses (incident_id);

CREATE INDEX IF NOT EXISTS idx_incident_ai_analyses_status 
  ON public.incident_ai_analyses (analysis_status);

CREATE INDEX IF NOT EXISTS idx_incident_ai_analyses_urgency 
  ON public.incident_ai_analyses (urgency);

-- Row Level Security (RLS)
ALTER TABLE public.incident_ai_analyses ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Citizens and responders can read saved AI analyses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'incident_ai_analyses' AND policyname = 'Public read AI analyses'
  ) THEN
    CREATE POLICY "Public read AI analyses"
      ON public.incident_ai_analyses
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- 2. Authority / Service Role Management Policy: Only authorized service role can insert/update analyses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'incident_ai_analyses' AND policyname = 'Authority service role manage AI analyses'
  ) THEN
    CREATE POLICY "Authority service role manage AI analyses"
      ON public.incident_ai_analyses
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Auto-update updated_at timestamp trigger
DROP TRIGGER IF EXISTS tr_incident_ai_analyses_updated_at ON public.incident_ai_analyses;
CREATE TRIGGER tr_incident_ai_analyses_updated_at
  BEFORE UPDATE ON public.incident_ai_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
