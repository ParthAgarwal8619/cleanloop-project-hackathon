import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Map, Flame, Brain, Route, Droplets,
  TrendingUp, Trash2, AlertTriangle, CheckCircle2, Recycle, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { CityMap } from '@/components/CityMap';
import { supabase } from '@/lib/supabase';
import type { WasteReport, ImpactMetric, Vehicle, DrainIncident } from '@/types';
import { statusColor, statusLabel, priorityColor, priorityLabel, wasteTypeLabel, timeAgo, formatKg } from '@/lib/format';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from 'recharts';

const navItems = [
  { label: 'Dashboard', path: '/officer', icon: LayoutDashboard },
  { label: 'City Map', path: '/officer/map', icon: Map },
  { label: 'Hotspots', path: '/officer/hotspots', icon: Flame },
  { label: 'AI Priority', path: '/officer/priority', icon: Brain },
  { label: 'Routes', path: '/officer/routes', icon: Route },
  { label: 'Drain Monitor', path: '/officer/drains', icon: Droplets },
];

export function OfficerDashboard() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drains, setDrains] = useState<DrainIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('waste_reports').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => setReports((data as WasteReport[]) || []));
    supabase.from('impact_metrics').select('*').order('metric_date', { ascending: true }).limit(14).then(({ data }) => setMetrics((data as ImpactMetric[]) || []));
    supabase.from('vehicles').select('*').then(({ data }) => setVehicles((data as Vehicle[]) || []));
    supabase.from('drain_incidents').select('*').eq('status', 'active').then(({ data }) => { setDrains((data as DrainIncident[]) || []); setLoading(false); });
  }, []);

  const pending = reports.filter((r) => ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED'].includes(r.status)).length;
  const highPriority = reports.filter((r) => r.priority === 'CRITICAL' || r.priority === 'HIGH').length;
  const collectedToday = reports.filter((r) => r.status === 'COLLECTED' || r.status === 'AI_VERIFIED' || r.status === 'RESOLVED').length;
  const todayMetric = metrics[metrics.length - 1];

  const markers = reports.slice(0, 50).map((r) => ({
    id: r.id, latitude: r.latitude, longitude: r.longitude,
    priority: r.status === 'RESOLVED' ? 'LOW' : r.priority,
    reportId: r.report_id, wasteType: r.waste_type || undefined, status: r.status, time: timeAgo(r.created_at),
  }));

  const chartData = metrics.map((m) => ({
    date: new Date(m.metric_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    collected: m.waste_collected_kg, resolved: m.reports_resolved,
  }));

  return (
    <DashboardLayout navItems={navItems} title="City Waste Intelligence" subtitle="Municipal waste management overview" roleLabel="Officer" roleColor="bg-emerald-100 text-emerald-700">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Reports" value={reports.length} icon={<Trash2 className="h-5 w-5" />} iconBg="bg-blue-100 text-blue-600" />
          <StatCard label="Pending Collection" value={pending} icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-amber-100 text-amber-600" />
          <StatCard label="High Priority" value={highPriority} icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-red-100 text-red-600" />
          <StatCard label="Collected Today" value={collectedToday} icon={<CheckCircle2 className="h-5 w-5" />} iconBg="bg-success/10 text-success" />
          <StatCard label="Recycled Today" value={todayMetric ? formatKg(todayMetric.plastic_recovered_kg + todayMetric.paper_waste_kg + todayMetric.metal_waste_kg) : '0 kg'} icon={<Recycle className="h-5 w-5" />} iconBg="bg-emerald-100 text-emerald-600" />
          <StatCard label="Drain Risks" value={drains.length} icon={<Droplets className="h-5 w-5" />} iconBg="bg-cyan-100 text-cyan-600" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Live City Map</CardTitle>
                <Link to="/officer/map"><Button variant="ghost" size="sm" className="gap-1 text-xs">Full Map <ArrowRight className="h-3 w-3" /></Button></Link>
              </CardHeader>
              <CardContent><CityMap markers={markers} height="350px" /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Waste Collection Trend (14 Days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="collected" stroke="hsl(var(--chart-1))" fill="url(#colorCollected)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Reports</CardTitle></CardHeader>
              <CardContent>
                {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div> : (
                  <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                    {reports.slice(0, 10).map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <div>
                          <p className="text-xs font-semibold">{r.report_id}</p>
                          <p className="text-xs text-muted-foreground">{wasteTypeLabel(r.waste_type || 'mixed')} · {timeAgo(r.created_at)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className={`text-[10px] ${priorityColor(r.priority)}`}>{r.priority}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusColor(r.status)}`}>{statusLabel(r.status)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Vehicles</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vehicles.slice(0, 5).map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div>
                        <p className="text-xs font-semibold">{v.vehicle_id}</p>
                        <p className="text-xs text-muted-foreground">{v.current_load}/{v.capacity} kg</p>
                      </div>
                      <Badge variant="outline" className={v.status === 'available' ? 'bg-success/10 text-success' : v.status === 'on_route' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
