/*
# Create RCA investigation tables (single-tenant, no auth)

1. Plain-English summary
   This migration creates the storage for the AI-powered Root Cause Analysis
   module used by API pharmaceutical quality teams. Each investigation captures
   a quality deviation, the evidence gathered, the AI-assisted 5 Whys and
   fishbone analysis, confirmed root causes, missing information, and the CAPA
   plan.

2. New Tables
   - `rca_investigations`
     - `id` (uuid, primary key) - investigation identifier
     - `investigation_ref` (text) - human-readable reference like RCA-2026-001
     - `title` (text) - short title of the investigation
     - `status` (text) - draft | in_review | approved | closed
     - `product_name`, `batch_number`, `batch_size` (text) - batch context
     - `stage` (text) - manufacturing stage where the deviation occurred
     - `equipment_id` (text) - equipment involved
     - `deviation_type` (text) - e.g. OOS, OOT, Process Deviation
     - `severity` (text) - low | medium | high | critical
     - `deviation_date` (date), `deviation_detected_by` (text)
     - `description` (text) - detailed deviation description
     - `immediate_action` (text) - containment already taken
     - `regulatory_impact` (text) - GMP/regulatory impact assessment
     - `impact_assessment` (jsonb) - product quality / patient safety / data integrity impact notes
     - `five_whys` (jsonb) - array of {why, answer} steps plus defined problem
     - `fishbone` (jsonb) - array of {category, causes[]} 6M categories
     - `root_causes` (jsonb) - array of {id, description, category, evidence[], confidence, status, contributing_factors[], rationale}
     - `missing_info` (jsonb) - array of {id, item, area, priority, rationale, requested_from}
     - `capa` (jsonb) - array of {id, type (corrective/preventive), title, description, rationale, owner, due_date, priority, status, linked_root_cause_id}
     - `source_documents` (jsonb) - array of {name, type, submitted_at, excerpt} AI intake history
     - `ai_processed` (boolean) - whether AI intake has run at least once
     - `created_at`, `updated_at` (timestamptz)

3. Security
   - Enable RLS on `rca_investigations`.
   - This is a single-tenant demo application with no sign-in screen: grant
     SELECT, INSERT, UPDATE, DELETE to anon + authenticated and allow full
     access via policies (intentionally shared demo data).
   - Grants give the Data API reach; RLS policies are permissive for this
     single-tenant deployment by design.
*/

CREATE TABLE IF NOT EXISTS rca_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_ref text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT 'Untitled Investigation',
  status text NOT NULL DEFAULT 'draft',
  product_name text NOT NULL DEFAULT '',
  batch_number text NOT NULL DEFAULT '',
  batch_size text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT '',
  equipment_id text NOT NULL DEFAULT '',
  deviation_type text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  deviation_date date,
  deviation_detected_by text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  immediate_action text NOT NULL DEFAULT '',
  regulatory_impact text NOT NULL DEFAULT '',
  impact_assessment jsonb NOT NULL DEFAULT '[]'::jsonb,
  five_whys jsonb NOT NULL DEFAULT '[]'::jsonb,
  fishbone jsonb NOT NULL DEFAULT '[]'::jsonb,
  root_causes jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_info jsonb NOT NULL DEFAULT '[]'::jsonb,
  capa jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rca_investigations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON rca_investigations TO anon, authenticated;

DROP POLICY IF EXISTS "rca_select_all" ON rca_investigations;
CREATE POLICY "rca_select_all" ON rca_investigations
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "rca_insert_all" ON rca_investigations;
CREATE POLICY "rca_insert_all" ON rca_investigations
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "rca_update_all" ON rca_investigations;
CREATE POLICY "rca_update_all" ON rca_investigations
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rca_delete_all" ON rca_investigations;
CREATE POLICY "rca_delete_all" ON rca_investigations
FOR DELETE TO anon, authenticated USING (true);
