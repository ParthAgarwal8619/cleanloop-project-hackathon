import { useEffect, useState } from 'react';
import { Shield, Users, Truck, Recycle, Settings, BarChart3, Trash2, Brain, Cog, Building2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import type { Profile, Vehicle, WasteReport, RecyclableMaterial, ImpactMetric } from '@/types';
import { formatDate, formatKg, wasteTypeLabel } from '@/lib/format';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

const navItems = [
  { label: 'Admin', path: '/admin', icon: Shield },
];

const WASTE_CATEGORIES = [
  { name: 'Plastic', rate: 25, color: 'bg-blue-100 text-blue-600' },
  { name: 'Organic', rate: 15, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Paper', rate: 12, color: 'bg-amber-100 text-amber-600' },
  { name: 'Metal', rate: 80, color: 'bg-purple-100 text-purple-600' },
  { name: 'Glass', rate: 8, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'E-Waste', rate: 350, color: 'bg-red-100 text-red-600' },
];

export function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [materials, setMaterials] = useState<RecyclableMaterial[]>([]);
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => setProfiles((data as Profile[]) || []));
    supabase.from('vehicles').select('*').then(({ data }) => setVehicles((data as Vehicle[]) || []));
    supabase.from('waste_reports').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => setReports((data as WasteReport[]) || []));
    supabase.from('recyclable_materials').select('*').then(({ data }) => setMaterials((data as RecyclableMaterial[]) || []));
    supabase.from('impact_metrics').select('*').order('metric_date', { ascending: true }).limit(14).then(({ data }) => setMetrics((data as ImpactMetric[]) || []));
  }, []);

  const roleCount = (role: string) => profiles.filter(p => p.role === role).length;

  const chartData = metrics.map(m => ({
    date: new Date(m.metric_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    waste: m.waste_collected_kg, co2: Math.round(m.co2_impact_kg), resolved: m.reports_resolved,
  }));

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard" subtitle="System administration and analytics" roleLabel="Admin" roleColor="bg-purple-100 text-purple-700">
      <div className="space-y-6">
        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'teams', label: 'Teams', icon: Building2 },
            { id: 'vehicles', label: 'Vehicles', icon: Truck },
            { id: 'categories', label: 'Categories', icon: Package },
            { id: 'ai', label: 'AI Settings', icon: Brain },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'reports', label: 'Reports', icon: Trash2 },
          ].map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}><Icon className="h-4 w-4" /> {tab.label}</button>;
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <StatCard label="Total Users" value={profiles.length} icon={<Users className="h-5 w-5" />} iconBg="bg-blue-100 text-blue-600" />
              <StatCard label="Citizens" value={roleCount('citizen')} icon={<Users className="h-5 w-5" />} iconBg="bg-cyan-100 text-cyan-600" />
              <StatCard label="Officers" value={roleCount('officer')} icon={<Shield className="h-5 w-5" />} iconBg="bg-emerald-100 text-emerald-600" />
              <StatCard label="Workers" value={roleCount('worker')} icon={<Truck className="h-5 w-5" />} iconBg="bg-amber-100 text-amber-600" />
              <StatCard label="Recyclers" value={roleCount('recycler')} icon={<Recycle className="h-5 w-5" />} iconBg="bg-purple-100 text-purple-600" />
              <StatCard label="Vehicles" value={vehicles.length} icon={<Truck className="h-5 w-5" />} iconBg="bg-indigo-100 text-indigo-600" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-base">Waste Collection (14 Days)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><AreaChart data={chartData}><defs><linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Area type="monotone" dataKey="waste" stroke="hsl(var(--chart-1))" fill="url(#colorWaste)" strokeWidth={2} /></AreaChart></ResponsiveContainer></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Reports Resolved & CO₂ Impact</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Legend /><Bar dataKey="resolved" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} /><Bar dataKey="co2" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <Card><CardHeader><CardTitle className="text-base">All Users ({profiles.length})</CardTitle></CardHeader><CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{p.name.charAt(0)}</div><div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.email}</p></div></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{p.zone}</span><Badge variant="outline" className="capitalize">{p.role}</Badge></div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}

        {activeTab === 'teams' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {['officer', 'worker', 'recycler'].map(role => (
              <Card key={role}><CardHeader><CardTitle className="flex items-center gap-2 text-base capitalize"><Building2 className="h-4 w-4 text-primary" /> {role}s</CardTitle></CardHeader><CardContent>
                <p className="text-2xl font-bold">{roleCount(role)}</p>
                <div className="mt-3 space-y-2">{profiles.filter(p => p.role === role).slice(0, 5).map(p => <div key={p.id} className="flex items-center gap-2 text-xs"><div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center font-semibold">{p.name.charAt(0)}</div><span>{p.name}</span></div>)}</div>
              </CardContent></Card>
            ))}
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(v => (
              <Card key={v.id}><CardContent className="p-5">
                <div className="flex items-center justify-between"><p className="text-sm font-bold">{v.vehicle_id}</p><Badge variant="outline" className={v.status === 'available' ? 'bg-success/10 text-success' : v.status === 'on_route' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}>{v.status}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{v.name} · {v.zone}</p>
                <div className="mt-3"><div className="flex justify-between text-xs"><span>Load</span><span>{v.current_load}/{v.capacity} kg</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(v.current_load / v.capacity) * 100}%` }} /></div></div>
              </CardContent></Card>
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {WASTE_CATEGORIES.map(cat => (
              <Card key={cat.name}><CardContent className="p-5">
                <div className="flex items-center gap-3"><div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.color}`}><Package className="h-6 w-6" /></div><div><p className="text-sm font-bold">{cat.name}</p><p className="text-xs text-muted-foreground">₹{cat.rate}/kg recovery rate</p></div></div>
              </CardContent></Card>
            ))}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5"><CardContent className="p-6"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Brain className="h-6 w-6 text-primary" /></div><div><p className="text-sm font-bold">Demo AI Mode</p><p className="text-xs text-muted-foreground">AI analysis runs in demo mode with deterministic results. No external API required.</p></div></div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">AI Configuration</CardTitle></CardHeader><CardContent><div className="space-y-3">{[{ label: 'Waste Detection Model', value: 'Demo (Deterministic)' }, { label: 'Confidence Threshold', value: '85%' }, { label: 'Risk Score Algorithm', value: 'Weighted Multi-Factor' }, { label: 'Route Optimization', value: 'Nearest Neighbor Heuristic' }].map(s => <div key={s.label} className="flex items-center justify-between rounded-lg border border-border p-3"><span className="text-sm font-medium">{s.label}</span><Badge variant="outline">{s.value}</Badge></div>)}</div></CardContent></Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="text-base">System Performance</CardTitle></CardHeader><CardContent>
              <div className="space-y-3">
                {[{ label: 'Total Reports', value: reports.length }, { label: 'Resolved Reports', value: reports.filter(r => r.status === 'RESOLVED').length }, { label: 'Avg Risk Score', value: Math.round(reports.reduce((s, r) => s + r.risk_score, 0) / (reports.length || 1)) }, { label: 'Materials Listed', value: materials.length }, { label: 'Recycling Rate', value: `${Math.round((metrics.reduce((s, m) => s + m.recycling_rate, 0) / (metrics.length || 1)) * 100)}%` }].map(s => <div key={s.label} className="flex items-center justify-between rounded-lg border border-border p-3"><span className="text-sm font-medium">{s.label}</span><span className="text-lg font-bold">{s.value}</span></div>)}
              </div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">CO₂ Impact (14 Days)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} /><YAxis fontSize={11} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="co2" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <Card><CardHeader><CardTitle className="text-base">Recent Reports ({reports.length})</CardTitle></CardHeader><CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
              {reports.slice(0, 20).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div><p className="text-sm font-semibold">{r.report_id}</p><p className="text-xs text-muted-foreground">{wasteTypeLabel(r.waste_type || 'mixed')} · {r.estimated_kg} kg · {formatDate(r.created_at)}</p></div>
                  <div className="flex gap-1"><Badge variant="outline" className="text-[10px]">{r.priority}</Badge><Badge variant="outline" className="text-[10px]">{r.status}</Badge></div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
