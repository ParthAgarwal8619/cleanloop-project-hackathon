export type Role = 'citizen' | 'officer' | 'worker' | 'recycler' | 'admin';

export type ReportStatus =
  | 'SUBMITTED'
  | 'AI_ANALYZED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COLLECTED'
  | 'AI_VERIFIED'
  | 'RESOLVED';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type WasteType =
  | 'plastic'
  | 'organic'
  | 'paper'
  | 'metal'
  | 'glass'
  | 'e_waste'
  | 'mixed';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  phone: string | null;
  zone: string | null;
  eco_points: number;
  badges: string[];
  avatar_url: string | null;
  created_at: string;
}

export interface WasteReport {
  id: string;
  report_id: string;
  profile_id: string | null;
  image_url: string | null;
  after_image_url: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  status: ReportStatus;
  priority: Priority;
  risk_score: number;
  waste_type: string | null;
  confidence: number;
  severity: string | null;
  estimated_kg: number;
  near_drain: boolean;
  drain_distance: number | null;
  public_area: boolean;
  overflow_risk: string | null;
  health_risk: string | null;
  ai_recommendation: string | null;
  ai_mode: string | null;
  assigned_worker_id: string | null;
  assigned_vehicle_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WasteMaterial {
  id: string;
  report_id: string;
  material_type: string;
  estimated_kg: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_id: string;
  name: string;
  capacity: number;
  current_load: number;
  status: 'available' | 'on_route' | 'maintenance';
  zone: string | null;
  driver_name: string | null;
  created_at: string;
}

export interface Route {
  id: string;
  vehicle_id: string | null;
  worker_id: string | null;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  total_distance_km: number;
  estimated_time_min: number;
  total_stops: number;
  waste_capacity: number;
  created_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  report_id: string;
  stop_order: number;
  zone: string | null;
  status: 'pending' | 'visited' | 'skipped';
  created_at: string;
}

export interface CollectionTask {
  id: string;
  report_id: string;
  worker_id: string | null;
  vehicle_id: string | null;
  route_id: string | null;
  status: 'assigned' | 'started' | 'arrived' | 'collected' | 'verified' | 'cancelled';
  priority: Priority;
  scheduled_for: string | null;
  completed_at: string | null;
  after_image_url: string | null;
  ai_verification: string | null;
  ai_verification_confidence: number | null;
  notes: string | null;
  created_at: string;
}

export interface DrainIncident {
  id: string;
  report_id: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  distance_to_drain: number;
  waste_quantity: number;
  risk_score: number;
  risk_level: string;
  status: 'active' | 'monitored' | 'resolved';
  recommended_action: string | null;
  created_at: string;
}

export interface RecyclableMaterial {
  id: string;
  material_type: string;
  quantity_kg: number;
  zone: string | null;
  estimated_value: number;
  status: 'available' | 'reserved' | 'collected' | 'processed';
  report_id: string | null;
  created_at: string;
}

export interface RecyclerRequest {
  id: string;
  recycler_id: string | null;
  material_id: string | null;
  material_type: string;
  quantity_kg: number;
  status: 'pending' | 'accepted' | 'collected' | 'processing' | 'completed' | 'cancelled';
  estimated_value: number;
  created_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ImpactMetric {
  id: string;
  metric_date: string;
  waste_collected_kg: number;
  plastic_recovered_kg: number;
  organic_waste_kg: number;
  paper_waste_kg: number;
  metal_waste_kg: number;
  glass_waste_kg: number;
  e_waste_kg: number;
  reports_resolved: number;
  drain_risks_prevented: number;
  co2_impact_kg: number;
  recycling_rate: number;
  created_at: string;
}

export interface AIAnalysisResult {
  waste_type: string;
  materials: { type: string; estimated_kg: number }[];
  confidence: number;
  severity: Severity;
  risk_score: number;
  near_drain: boolean;
  drain_distance: number;
  public_area: boolean;
  overflow_risk: string;
  health_risk: string;
  estimated_kg: number;
  recommendation: string;
}
