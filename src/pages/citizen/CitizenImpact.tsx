import { useEffect, useState } from 'react';
import { Recycle, Camera, CheckCircle2, MapPin, Sparkles, Leaf, TrendingUp, Trash2, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { WasteReport, ImpactMetric } from '@/types';
import { formatKg } from '@/lib/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const navItems = [
  { label: 'Home', path: '/citizen', icon: Recycle },
  { label: 'Report Waste', path: '/citizen/report', icon: Camera },
  { label: 'My Reports', path: '/citizen/reports', icon: CheckCircle2 },
  { label: 'Nearby Waste', path: '/citizen/nearby', icon: MapPin },
  { label: 'Rewards', path: '/citizen/rewards', icon: Sparkles },
  { label: 'Impact', path: '/citizen/impact', icon: Recycle },
];

export function CitizenImpact() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('waste_reports')
      .select('*')
      .eq('profile_id', profile.id)
      .then(({ data }) => setReports((data as WasteReport[]) || []));

    supabase
      .from('impact_metrics')
      .select('*')
      .order('metric_date', { ascending: true })
      .limit(14)
      .then(({ data }) => setMetrics((data as ImpactMetric[]) || []));
  }, [profile]);

  const myResolved = reports.filter((r) => r.status === 'RESOLVED').length;
  const myCollectedKg = reports
    .filter((r) => r.status === 'RESOLVED' || r.status === 'COLLECTED')
    .reduce((sum, r) => sum + (r.estimated_kg || 0), 0);

  const chartData = metrics.map((m) => ({
    date: new Date(m.metric_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    collected: m.waste_collected_kg,
    recycled: m.plastic_recovered_kg + m.paper_waste_kg + m.metal_waste_kg + m.glass_waste_kg,
  }));

  const pieData = metrics.length > 0
    ? [
        { name: 'Plastic', value: metrics.reduce((s, m) => s + m.plastic_recovered_kg, 0) },
        { name: 'Organic', value: metrics.reduce((s, m) => s + m.organic_waste_kg, 0) },
        { name: 'Paper', value: metrics.reduce((s, m) => s + m.paper_waste_kg, 0) },
        { name: 'Metal', value: metrics.reduce((s, m) => s + m.metal_waste_kg, 0) },
        { name: 'Glass', value: metrics.reduce((s, m) => s + m.glass_waste_kg, 0) },
      ]
    : [];

  const pieColors = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <DashboardLayout
      navItems={navItems}
      title="My Impact"
      subtitle="Your contribution to a cleaner city"
      roleLabel="Citizen"
      roleColor="bg-blue-100 text-blue-700"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Reports Filed" value={reports.length} icon={<Camera className="h-5 w-5" />} iconBg="bg-blue-100 text-blue-600" />
          <StatCard label="Waste Collected" value={formatKg(myCollectedKg)} icon={<Trash2 className="h-5 w-5" />} iconBg="bg-emerald-100 text-emerald-600" />
          <StatCard label="Reports Resolved" value={myResolved} icon={<CheckCircle2 className="h-5 w-5" />} iconBg="bg-success/10 text-success" />
          <StatCard label="Eco Points" value={profile?.eco_points || 0} icon={<Sparkles className="h-5 w-5" />} iconBg="bg-amber-100 text-amber-600" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Waste Collected vs Recycled (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="collected" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recycled" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Material Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-success/20 bg-success/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
              <Leaf className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">
                Your Impact: {formatKg(myCollectedKg)} of waste diverted from landfills
              </p>
              <p className="text-sm text-muted-foreground">
                That's approximately {(myCollectedKg * 2.5).toFixed(1)} kg of CO₂ emissions prevented.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
