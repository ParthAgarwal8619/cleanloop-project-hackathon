import { useEffect, useState } from 'react';
import { LayoutDashboard, Map, Flame, Brain, Route, Droplets, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CityMap } from '@/components/CityMap';
import { supabase } from '@/lib/supabase';
import type { WasteReport } from '@/types';
import { statusColor, statusLabel, priorityColor, priorityLabel, wasteTypeLabel, timeAgo } from '@/lib/format';

const navItems = [
  { label: 'Dashboard', path: '/officer', icon: LayoutDashboard },
  { label: 'City Map', path: '/officer/map', icon: Map },
  { label: 'Hotspots', path: '/officer/hotspots', icon: Flame },
  { label: 'AI Priority', path: '/officer/priority', icon: Brain },
  { label: 'Routes', path: '/officer/routes', icon: Route },
  { label: 'Drain Monitor', path: '/officer/drains', icon: Droplets },
];

export function CityMapPage() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('waste_reports').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => setReports((data as WasteReport[]) || []));
  }, []);

  const filtered = reports.filter(r => !search || r.report_id.toLowerCase().includes(search.toLowerCase()) || (r.waste_type || '').toLowerCase().includes(search.toLowerCase()));
  const markers = filtered.map((r) => ({ id: r.id, latitude: r.latitude, longitude: r.longitude, priority: r.status === 'RESOLVED' ? 'LOW' : r.priority, reportId: r.report_id, wasteType: r.waste_type || undefined, status: r.status, time: timeAgo(r.created_at) }));

  return (
    <DashboardLayout navItems={navItems} title="City Map" subtitle="All waste reports across the city" roleLabel="Officer" roleColor="bg-emerald-100 text-emerald-700">
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by report ID or waste type..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Card>
          <CardContent className="p-0"><CityMap markers={markers} height="600px" /></CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filtered.slice(0, 8).map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-bold">{r.report_id}</p><Badge variant="outline" className={priorityColor(r.priority)}>{priorityLabel(r.priority)}</Badge></div>
              <p className="mt-1 text-xs text-muted-foreground">{wasteTypeLabel(r.waste_type || 'mixed')} · {r.estimated_kg} kg</p>
              <p className="text-xs text-muted-foreground truncate">{r.address}</p>
              <div className="mt-2 flex items-center justify-between"><Badge variant="outline" className={statusColor(r.status)}>{statusLabel(r.status)}</Badge><span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span></div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
