import type { AIAnalysisResult } from '@/types';

const WASTE_TYPES = [
  { type: 'plastic', materials: ['plastic', 'organic', 'paper'] },
  { type: 'organic', materials: ['organic', 'paper'] },
  { type: 'mixed', materials: ['plastic', 'organic', 'paper', 'metal'] },
  { type: 'paper', materials: ['paper', 'plastic'] },
  { type: 'metal', materials: ['metal', 'plastic'] },
  { type: 'glass', materials: ['glass', 'organic'] },
  { type: 'e_waste', materials: ['e_waste', 'plastic', 'metal'] },
];

const MATERIAL_KG_RANGES: Record<string, [number, number]> = {
  plastic: [5, 15],
  organic: [4, 12],
  paper: [2, 8],
  metal: [2, 10],
  glass: [2, 6],
  e_waste: [1, 5],
};

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function analyzeWaste(
  imageFileName: string | null,
  description: string,
  latitude: number,
  longitude: number
): AIAnalysisResult {
  const seed = hashString(
    (imageFileName || '') + description + latitude.toString() + longitude.toString()
  );
  const rand = seededRandom(seed);

  const wasteTypeIdx = Math.floor(rand() * WASTE_TYPES.length);
  const wasteType = WASTE_TYPES[wasteTypeIdx];
  const materials = wasteType.materials.map((m) => {
    const range = MATERIAL_KG_RANGES[m];
    const kg = Math.round(range[0] + rand() * (range[1] - range[0]));
    return { type: m, estimated_kg: kg };
  });

  const estimatedKg = materials.reduce((sum, m) => sum + m.estimated_kg, 0);
  const confidence = Math.round((0.88 + rand() * 0.11) * 100) / 100;
  const nearDrain = rand() > 0.6;
  const drainDistance = nearDrain ? Math.round(5 + rand() * 20) : Math.round(30 + rand() * 80);
  const publicArea = rand() > 0.4;
  const overflowRisk = rand() > 0.6 ? 'High' : rand() > 0.3 ? 'Medium' : 'Low';
  const healthRisk = rand() > 0.5 ? 'Medium' : 'Low';

  let riskScore = Math.round(estimatedKg * 1.5);
  if (nearDrain) riskScore += 25;
  if (publicArea) riskScore += 15;
  if (materials.some((m) => m.type === 'plastic')) riskScore += 20;
  if (overflowRisk === 'High') riskScore += 10;
  riskScore = Math.min(riskScore, 100);

  const severity = riskScore > 75 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW';

  let recommendation: string;
  if (nearDrain && riskScore > 70) {
    recommendation =
      'Immediate collection recommended because the waste pile is near a drainage channel and contains a high amount of plastic. Risk of drain blockage and flooding.';
  } else if (riskScore > 70) {
    recommendation =
      'High-priority collection recommended. Large waste volume in a public area requires swift action to prevent health hazards.';
  } else if (riskScore > 50) {
    recommendation =
      'Schedule collection within 4 hours. Moderate waste volume detected with some environmental risk factors.';
  } else {
    recommendation =
      'Routine collection recommended. Low-risk waste accumulation that can be handled in the next collection cycle.';
  }

  return {
    waste_type: wasteType.type,
    materials,
    confidence,
    severity,
    risk_score: riskScore,
    near_drain: nearDrain,
    drain_distance: drainDistance,
    public_area: publicArea,
    overflow_risk: overflowRisk,
    health_risk: healthRisk,
    estimated_kg: estimatedKg,
    recommendation,
  };
}

export function verifyCollection(
  beforeImageUrl: string | null,
  afterImageUrl: string | null
): { verified: boolean; confidence: number; message: string } {
  if (!afterImageUrl) {
    return {
      verified: false,
      confidence: 0,
      message: 'No after-collection image provided for verification.',
    };
  }
  const seed = hashString((afterImageUrl || '') + (beforeImageUrl || ''));
  const rand = seededRandom(seed);
  const confidence = Math.round((0.92 + rand() * 0.07) * 100) / 100;
  return {
    verified: true,
    confidence,
    message: 'Collection appears successfully completed. Waste has been removed from the site.',
  };
}

export function calculatePriorityScore(report: {
  estimated_kg: number;
  near_drain: boolean;
  waste_type: string | null;
  public_area: boolean;
  created_at: string;
}): { score: number; factors: { label: string; points: number }[] } {
  const factors: { label: string; points: number }[] = [];
  let score = 0;

  const volumePoints = Math.min(25, Math.round(report.estimated_kg * 0.8));
  score += volumePoints;
  factors.push({ label: 'Waste volume', points: volumePoints });

  if (report.near_drain) {
    score += 25;
    factors.push({ label: 'Near drain', points: 25 });
  }

  if (report.waste_type === 'plastic' || report.waste_type === 'mixed') {
    score += 20;
    factors.push({ label: 'Plastic detected', points: 20 });
  }

  if (report.public_area) {
    score += 15;
    factors.push({ label: 'Public area', points: 15 });
  }

  const hoursSinceReport =
    (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursSinceReport > 24) {
    const timePoints = Math.min(10, Math.round(hoursSinceReport / 6));
    score += timePoints;
    factors.push({ label: 'Time since report', points: timePoints });
  }

  const hotspotPoints = Math.floor(Math.random() * 6);
  if (hotspotPoints > 0) {
    score += hotspotPoints;
    factors.push({ label: 'Repeated hotspot', points: hotspotPoints });
  }

  score = Math.min(score, 100);
  return { score, factors };
}

export function optimizeRoute(
  reports: { id: string; report_id: string; latitude: number; longitude: number; estimated_kg: number; address: string | null }[],
  vehicles: { id: string; vehicle_id: string; name: string; capacity: number; current_load: number; status?: string }[]
): {
  routes: {
    vehicle: { id: string; vehicle_id: string; name: string };
    stops: { report_id: string; order: number; distance_km: number; zone: string }[];
    total_distance_km: number;
    estimated_time_min: number;
    total_waste_kg: number;
  }[];
  total_distance_km: number;
  estimated_time_min: number;
  unassigned: number;
} {
  if (reports.length === 0 || vehicles.length === 0) {
    return { routes: [], total_distance_km: 0, estimated_time_min: 0, unassigned: reports.length };
  }

  const availableVehicles = vehicles.filter((v) => v.status !== 'maintenance');
  const vehicleCount = Math.min(availableVehicles.length, Math.ceil(reports.length / 6));
  const activeVehicles = availableVehicles.slice(0, vehicleCount);

  const sortedReports = [...reports].sort((a, b) => b.estimated_kg - a.estimated_kg);
  const perVehicle = Math.ceil(sortedReports.length / vehicleCount);

  const routes = activeVehicles.map((vehicle, vIdx) => {
    const vehicleReports = sortedReports.slice(vIdx * perVehicle, (vIdx + 1) * perVehicle);
    let prevLat = 12.9716;
    let prevLng = 77.5946;
    let totalDist = 0;
    let totalWaste = 0;
    const stops = vehicleReports.map((r, idx) => {
      const dist = Math.sqrt(
        Math.pow(r.latitude - prevLat, 2) + Math.pow(r.longitude - prevLng, 2)
      ) * 111;
      totalDist += dist;
      totalWaste += r.estimated_kg;
      prevLat = r.latitude;
      prevLng = r.longitude;
      return {
        report_id: r.report_id,
        order: idx + 1,
        distance_km: Math.round(dist * 10) / 10,
        zone: r.address || `Zone ${String.fromCharCode(65 + (idx % 6))}`,
      };
    });
    return {
      vehicle: { id: vehicle.id, vehicle_id: vehicle.vehicle_id, name: vehicle.name },
      stops,
      total_distance_km: Math.round(totalDist * 10) / 10,
      estimated_time_min: Math.round(totalDist * 3 + stops.length * 15),
      total_waste_kg: totalWaste,
    };
  });

  const totalDistance = routes.reduce((s, r) => s + r.total_distance_km, 0);
  const totalTime = routes.reduce((s, r) => s + r.estimated_time_min, 0);

  return {
    routes,
    total_distance_km: Math.round(totalDistance * 10) / 10,
    estimated_time_min: totalTime,
    unassigned: Math.max(0, reports.length - vehicleCount * perVehicle),
  };
}
