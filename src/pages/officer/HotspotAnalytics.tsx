import { useEffect, useState, useMemo } from 'react';
import { LayoutDashboard, Map, Flame, Brain, Route, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { WasteReport } from '@/types';
import { priorityColor, wasteTypeLabel } from '@/lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Treemap } from 'recharts';

const navItems = [
  { label: 'Dashboard', path: '/officer', icon: LayoutDashboard },
  { label: 'City Map', path: '/officer/map', icon: Map },
  { label: 'Hotspots', path: '/officer/hotspots', icon: Flame },
  { label: 'AI Priority', path: '/officer/priority', icon: Brain },
  { label: 'Routes', path: '/officer/routes', icon: Route },
  { label: 'Drain Monitor', path: '/officer/drains', icon: Droplets },
];

export function HotspotAnalytics() {
  const [reports, setReports] = useState<WasteReport[]>([]);

  useEffect(() => {
    supabase.from('waste_reports').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => setReports((data as WasteReport[]) || []));
  }, []);

  const zoneData = useMemo(() => {
    const zones: Record<string, { count: number; volume: number }> = {};
    reports.forEach(r => {
      const zone = r.address || 'Unknown';
      if (!zones[zone]) zones[zone] = { count: 0, volume: 0 };
      zones[zone].count++;
      zones[zone].volume += r.estimated_kg || 0;
    });
    return Object.entries(zones).map(([zone, data]) => ({ zone: zone.replace('Zone ', 'Z'), ...data })).sort((a, b) => b.count - a.count);
  }, [reports]);

  const typeData = useMemo(() => {
    const types: Record<string, number> = {};
    reports.forEach(r => { const t = r.waste_type || 'mixed'; types[t] = (types[t] || 0) + 1; });
    return Object.entries(types).map(([type, count]) => ({ type: wasteTypeLabel(type), count, size: count }));
  }, [reports]);

  return (
    <DashboardLayout navItems={navItems} title="Waste Hotspot Analytics" subtitle="Identify dumping patterns and high-volume areas" roleLabel="Officer" roleColor="bg-emerald-100 text-emerald-700">
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Reports by Zone</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zoneData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="zone" fontSize={11} tickLine={false} axisLine={false} width={60} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Waste Volume by Area (kg)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zoneData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="zone" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="volume" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Waste Type Distribution Heatmap</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <Treemap data={typeData} dataKey="size" nameKey="type" stroke="#fff" fill="hsl(var(--primary))" />
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Hotspot Zones</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {zoneData.slice(0, 8).map((z, idx) => (
                <div key={z.zone} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-red-100 text-red-700' : idx < 3 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>{idx + 1}</span>
                    <div><p className="text-sm font-semibold">{z.zone}</p><p className="text-xs text-muted-foreground">{z.count} reports · {z.volume} kg</p></div>
                  </div>
                  <Badge variant="outline" className={priorityColor(idx < 3 ? 'HIGH' : 'MEDIUM')}>{idx < 3 ? 'High Risk' : 'Moderate'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
