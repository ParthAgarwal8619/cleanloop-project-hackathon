/*
# CleanLoop AI — Core Database Schema

## Overview
Creates the complete schema for CleanLoop AI, an AI-powered smart waste
management platform. Single-tenant demo app — all data intentionally
shared/public, policies use `TO anon, authenticated`.

## New Tables (creation order respects FK dependencies)
1. profiles — users (citizens, officers, workers, recyclers, admins)
2. vehicles — collection vehicles
3. waste_reports — core entity with embedded AI analysis results
4. waste_materials — detected materials per report
5. routes — optimized collection routes
6. route_stops — ordered stops within a route
7. collection_tasks — worker tasks linked to reports
8. drain_incidents — drain risk incidents
9. recyclable_materials — marketplace listings
10. recycler_requests — recycler pickup requests
11. notifications — user notifications
12. impact_metrics — daily aggregate impact data

## Storage
- Public `waste-images` bucket for report photos.

## Security
- RLS enabled on every table; anon+authenticated CRUD (shared demo data).
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen','officer','worker','recycler','admin')),
  phone text,
  zone text,
  eco_points integer NOT NULL DEFAULT 0,
  badges text[] NOT NULL DEFAULT '{}',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ VEHICLES ============
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text UNIQUE NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 500,
  current_load integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_route','maintenance')),
  zone text,
  driver_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ WASTE REPORTS ============
CREATE TABLE IF NOT EXISTS waste_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text UNIQUE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  image_url text,
  after_image_url text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  description text,
  status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','AI_ANALYZED','ASSIGNED','IN_PROGRESS','COLLECTED','AI_VERIFIED','RESOLVED')),
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  risk_score integer NOT NULL DEFAULT 0,
  waste_type text,
  confidence double precision DEFAULT 0,
  severity text,
  estimated_kg integer DEFAULT 0,
  near_drain boolean NOT NULL DEFAULT false,
  drain_distance integer,
  public_area boolean NOT NULL DEFAULT false,
  overflow_risk text,
  health_risk text,
  ai_recommendation text,
  ai_mode text DEFAULT 'demo',
  assigned_worker_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ WASTE MATERIALS ============
CREATE TABLE IF NOT EXISTS waste_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES waste_reports(id) ON DELETE CASCADE,
  material_type text NOT NULL,
  estimated_kg integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ ROUTES ============
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','completed','cancelled')),
  total_distance_km double precision NOT NULL DEFAULT 0,
  estimated_time_min integer NOT NULL DEFAULT 0,
  total_stops integer NOT NULL DEFAULT 0,
  waste_capacity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ ROUTE STOPS ============
CREATE TABLE IF NOT EXISTS route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES waste_reports(id) ON DELETE CASCADE,
  stop_order integer NOT NULL DEFAULT 0,
  zone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','visited','skipped')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ COLLECTION TASKS ============
CREATE TABLE IF NOT EXISTS collection_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES waste_reports(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','started','arrived','collected','verified','cancelled')),
  priority text NOT NULL DEFAULT 'MEDIUM',
  scheduled_for timestamptz,
  completed_at timestamptz,
  after_image_url text,
  ai_verification text,
  ai_verification_confidence double precision,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ DRAIN INCIDENTS ============
CREATE TABLE IF NOT EXISTS drain_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES waste_reports(id) ON DELETE SET NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  distance_to_drain integer NOT NULL DEFAULT 0,
  waste_quantity integer NOT NULL DEFAULT 0,
  risk_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'MEDIUM',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','monitored','resolved')),
  recommended_action text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ RECYCLABLE MATERIALS ============
CREATE TABLE IF NOT EXISTS recyclable_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type text NOT NULL,
  quantity_kg integer NOT NULL DEFAULT 0,
  zone text,
  estimated_value integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','collected','processed')),
  report_id uuid REFERENCES waste_reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ RECYCLER REQUESTS ============
CREATE TABLE IF NOT EXISTS recycler_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recycler_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  material_id uuid REFERENCES recyclable_materials(id) ON DELETE SET NULL,
  material_type text NOT NULL,
  quantity_kg integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','collected','processing','completed','cancelled')),
  estimated_value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ IMPACT METRICS ============
CREATE TABLE IF NOT EXISTS impact_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  waste_collected_kg integer NOT NULL DEFAULT 0,
  plastic_recovered_kg integer NOT NULL DEFAULT 0,
  organic_waste_kg integer NOT NULL DEFAULT 0,
  paper_waste_kg integer NOT NULL DEFAULT 0,
  metal_waste_kg integer NOT NULL DEFAULT 0,
  glass_waste_kg integer NOT NULL DEFAULT 0,
  e_waste_kg integer NOT NULL DEFAULT 0,
  reports_resolved integer NOT NULL DEFAULT 0,
  drain_risks_prevented integer NOT NULL DEFAULT 0,
  co2_impact_kg double precision NOT NULL DEFAULT 0,
  recycling_rate double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('waste-images', 'waste-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============ RLS — ENABLE ON ALL TABLES ============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE drain_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recyclable_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES (single-tenant: anon+authenticated CRUD) ============

-- profiles
DROP POLICY IF EXISTS "anon_crud_profiles_sel" ON profiles;
CREATE POLICY "anon_crud_profiles_sel" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_profiles_ins" ON profiles;
CREATE POLICY "anon_crud_profiles_ins" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_profiles_upd" ON profiles;
CREATE POLICY "anon_crud_profiles_upd" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_profiles_del" ON profiles;
CREATE POLICY "anon_crud_profiles_del" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- waste_reports
DROP POLICY IF EXISTS "anon_crud_waste_reports_sel" ON waste_reports;
CREATE POLICY "anon_crud_waste_reports_sel" ON waste_reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_waste_reports_ins" ON waste_reports;
CREATE POLICY "anon_crud_waste_reports_ins" ON waste_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_waste_reports_upd" ON waste_reports;
CREATE POLICY "anon_crud_waste_reports_upd" ON waste_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_waste_reports_del" ON waste_reports;
CREATE POLICY "anon_crud_waste_reports_del" ON waste_reports FOR DELETE TO anon, authenticated USING (true);

-- waste_materials
DROP POLICY IF EXISTS "anon_crud_waste_materials_sel" ON waste_materials;
CREATE POLICY "anon_crud_waste_materials_sel" ON waste_materials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_waste_materials_ins" ON waste_materials;
CREATE POLICY "anon_crud_waste_materials_ins" ON waste_materials FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_waste_materials_upd" ON waste_materials;
CREATE POLICY "anon_crud_waste_materials_upd" ON waste_materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_waste_materials_del" ON waste_materials;
CREATE POLICY "anon_crud_waste_materials_del" ON waste_materials FOR DELETE TO anon, authenticated USING (true);

-- collection_tasks
DROP POLICY IF EXISTS "anon_crud_collection_tasks_sel" ON collection_tasks;
CREATE POLICY "anon_crud_collection_tasks_sel" ON collection_tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_collection_tasks_ins" ON collection_tasks;
CREATE POLICY "anon_crud_collection_tasks_ins" ON collection_tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_collection_tasks_upd" ON collection_tasks;
CREATE POLICY "anon_crud_collection_tasks_upd" ON collection_tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_collection_tasks_del" ON collection_tasks;
CREATE POLICY "anon_crud_collection_tasks_del" ON collection_tasks FOR DELETE TO anon, authenticated USING (true);

-- vehicles
DROP POLICY IF EXISTS "anon_crud_vehicles_sel" ON vehicles;
CREATE POLICY "anon_crud_vehicles_sel" ON vehicles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_vehicles_ins" ON vehicles;
CREATE POLICY "anon_crud_vehicles_ins" ON vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_vehicles_upd" ON vehicles;
CREATE POLICY "anon_crud_vehicles_upd" ON vehicles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_vehicles_del" ON vehicles;
CREATE POLICY "anon_crud_vehicles_del" ON vehicles FOR DELETE TO anon, authenticated USING (true);

-- routes
DROP POLICY IF EXISTS "anon_crud_routes_sel" ON routes;
CREATE POLICY "anon_crud_routes_sel" ON routes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_routes_ins" ON routes;
CREATE POLICY "anon_crud_routes_ins" ON routes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_routes_upd" ON routes;
CREATE POLICY "anon_crud_routes_upd" ON routes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_routes_del" ON routes;
CREATE POLICY "anon_crud_routes_del" ON routes FOR DELETE TO anon, authenticated USING (true);

-- route_stops
DROP POLICY IF EXISTS "anon_crud_route_stops_sel" ON route_stops;
CREATE POLICY "anon_crud_route_stops_sel" ON route_stops FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_route_stops_ins" ON route_stops;
CREATE POLICY "anon_crud_route_stops_ins" ON route_stops FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_route_stops_upd" ON route_stops;
CREATE POLICY "anon_crud_route_stops_upd" ON route_stops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_route_stops_del" ON route_stops;
CREATE POLICY "anon_crud_route_stops_del" ON route_stops FOR DELETE TO anon, authenticated USING (true);

-- drain_incidents
DROP POLICY IF EXISTS "anon_crud_drain_incidents_sel" ON drain_incidents;
CREATE POLICY "anon_crud_drain_incidents_sel" ON drain_incidents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_drain_incidents_ins" ON drain_incidents;
CREATE POLICY "anon_crud_drain_incidents_ins" ON drain_incidents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_drain_incidents_upd" ON drain_incidents;
CREATE POLICY "anon_crud_drain_incidents_upd" ON drain_incidents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_drain_incidents_del" ON drain_incidents;
CREATE POLICY "anon_crud_drain_incidents_del" ON drain_incidents FOR DELETE TO anon, authenticated USING (true);

-- recyclable_materials
DROP POLICY IF EXISTS "anon_crud_recyclable_materials_sel" ON recyclable_materials;
CREATE POLICY "anon_crud_recyclable_materials_sel" ON recyclable_materials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_recyclable_materials_ins" ON recyclable_materials;
CREATE POLICY "anon_crud_recyclable_materials_ins" ON recyclable_materials FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_recyclable_materials_upd" ON recyclable_materials;
CREATE POLICY "anon_crud_recyclable_materials_upd" ON recyclable_materials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_recyclable_materials_del" ON recyclable_materials;
CREATE POLICY "anon_crud_recyclable_materials_del" ON recyclable_materials FOR DELETE TO anon, authenticated USING (true);

-- recycler_requests
DROP POLICY IF EXISTS "anon_crud_recycler_requests_sel" ON recycler_requests;
CREATE POLICY "anon_crud_recycler_requests_sel" ON recycler_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_recycler_requests_ins" ON recycler_requests;
CREATE POLICY "anon_crud_recycler_requests_ins" ON recycler_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_recycler_requests_upd" ON recycler_requests;
CREATE POLICY "anon_crud_recycler_requests_upd" ON recycler_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_recycler_requests_del" ON recycler_requests;
CREATE POLICY "anon_crud_recycler_requests_del" ON recycler_requests FOR DELETE TO anon, authenticated USING (true);

-- notifications
DROP POLICY IF EXISTS "anon_crud_notifications_sel" ON notifications;
CREATE POLICY "anon_crud_notifications_sel" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_notifications_ins" ON notifications;
CREATE POLICY "anon_crud_notifications_ins" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_notifications_upd" ON notifications;
CREATE POLICY "anon_crud_notifications_upd" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_notifications_del" ON notifications;
CREATE POLICY "anon_crud_notifications_del" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- impact_metrics
DROP POLICY IF EXISTS "anon_crud_impact_metrics_sel" ON impact_metrics;
CREATE POLICY "anon_crud_impact_metrics_sel" ON impact_metrics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_impact_metrics_ins" ON impact_metrics;
CREATE POLICY "anon_crud_impact_metrics_ins" ON impact_metrics FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_impact_metrics_upd" ON impact_metrics;
CREATE POLICY "anon_crud_impact_metrics_upd" ON impact_metrics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_impact_metrics_del" ON impact_metrics;
CREATE POLICY "anon_crud_impact_metrics_del" ON impact_metrics FOR DELETE TO anon, authenticated USING (true);

-- ============ STORAGE POLICIES ============
DROP POLICY IF EXISTS "waste_images_public_read" ON storage.objects;
CREATE POLICY "waste_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'waste-images');

DROP POLICY IF EXISTS "waste_images_public_upload" ON storage.objects;
CREATE POLICY "waste_images_public_upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'waste-images');

DROP POLICY IF EXISTS "waste_images_public_update" ON storage.objects;
CREATE POLICY "waste_images_public_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'waste-images') WITH CHECK (bucket_id = 'waste-images');

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_waste_reports_status ON waste_reports(status);
CREATE INDEX IF NOT EXISTS idx_waste_reports_priority ON waste_reports(priority);
CREATE INDEX IF NOT EXISTS idx_waste_reports_profile ON waste_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_created ON waste_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_tasks_worker ON collection_tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_collection_tasks_status ON collection_tasks(status);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_recyclable_materials_status ON recyclable_materials(status);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_date ON impact_metrics(metric_date DESC);