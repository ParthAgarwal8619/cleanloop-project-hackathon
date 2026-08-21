import { useEffect, useState } from 'react';
import { LayoutDashboard, Map, Flame, Brain, Route, Droplets, AlertTriangle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { CityMap } from '@/components/CityMap';
import { supabase } from '@/lib/supabase';
import type { DrainIncident } from '@/types';

const navItems = [
  { label: 'Dashboard', path: '/officer', icon: LayoutDashboard },
  { label: 'City Map', path: '/officer/map', icon: Map },
  { label: 'Hotspots', path: '/officer/hotspots', icon: Flame },
  { label: 'AI Priority', path: '/officer/priority', icon: Brain },
  { label: 'Routes', path: '/officer/routes', icon: Route },
  { label: 'Drain Monitor', path: '/officer/drains', icon: Droplets },
];

export function DrainMonitor() {
  const [incidents, setIncidents] = useState<DrainIncident[]>([]);

  useEffect(() => {
    supabase.from('drain_incidents').select('*').order('risk_score', { ascending: false }).then(({ data }) => setIncidents((data as DrainIncident[]) || []));
  }, []);

  const highRisk = incidents.filter(i => i.risk_level === 'HIGH');
  const active = incidents.filter(i => i.status === 'active');
  const resolved = incidents.filter(i => i.status === 'resolved');
  const floodRisk = incidents.filter(i => i.risk_score > 75);

  const markers = incidents.map(i => ({ id: i.id, latitude: i.latitude, longitude: i.longitude, priority: i.risk_level === 'HIGH' ? 'CRITICAL' : i.risk_level === 'MEDIUM' ? 'HIGH' : 'MEDIUM', reportId: `Drain ${i.id.slice(0, 4)}`, wasteType: `${i.waste_quantity} kg waste` }));

  return (
    <DashboardLayout navItems={navItems} title="Drain Risk Monitor" subtitle="Monitor waste near drainage systems" roleLabel="Officer" roleColor="bg-emerald-100 text-emerald-700">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="High Risk Drains" value={highRisk.length} icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-red-100 text-red-600" />
          <StatCard label="Active Incidents" value={active.length} icon={<Droplets className="h-5 w-5" />} iconBg="bg-cyan-100 text-cyan-600" />
          <StatCard label="Waste Near Drains" value={incidents.length} icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-amber-100 text-amber-600" />
          <StatCard label="Flood Risk Areas" value={floodRisk.length} icon={<Shield className="h-5 w-5" />} iconBg="bg-purple-100 text-purple-600" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card><CardHeader><CardTitle className="text-base">Drain Risk Map</CardTitle></CardHeader><CardContent><CityMap markers={markers} height="400px" /></CardContent></Card>
          </div>
          <div>
            <Card><CardHeader><CardTitle className="text-base">Status Summary</CardTitle></CardHeader><CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"><span className="text-sm font-medium text-red-700">High Risk</span><span className="text-2xl font-bold text-red-700">{highRisk.length}</span></div>
                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"><span className="text-sm font-medium text-amber-700">Active</span><span className="text-2xl font-bold text-amber-700">{active.length}</span></div>
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3"><span className="text-sm font-medium text-emerald-700">Resolved</span><span className="text-2xl font-bold text-emerald-700">{resolved.length}</span></div>
              </div>
            </CardContent></Card>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Drain Incidents</CardTitle></CardHeader>
          <CardContent>
            {incidents.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No drain incidents</p> : (
              <div className="space-y-3">
                {incidents.map(inc => (
                  <div key={inc.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${inc.risk_level === 'HIGH' ? 'bg-red-100 text-red-600' : inc.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}><Droplets className="h-5 w-5" /></div>
                      <div><p className="text-sm font-semibold">{inc.address}</p><p className="text-xs text-muted-foreground">Distance to drain: {inc.distance_to_drain}m · Waste: {inc.waste_quantity} kg</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><p className="text-sm font-bold">{inc.risk_score}/100</p><p className="text-xs text-muted-foreground">Risk Score</p></div>
                      <Badge variant="outline" className={inc.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' : inc.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>{inc.risk_level}</Badge>
                      <Badge variant="outline" className={inc.status === 'active' ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700'}>{inc.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
