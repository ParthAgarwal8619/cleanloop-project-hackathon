import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Package, Truck, Leaf, ArrowRight, TrendingUp, IndianRupee, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import type { RecyclableMaterial, RecyclerRequest, ImpactMetric } from '@/types';
import { formatCurrency, formatKg, wasteTypeLabel } from '@/lib/format';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const navItems = [
  { label: 'Dashboard', path: '/recycler', icon: Recycle },
  { label: 'Marketplace', path: '/recycler/marketplace', icon: Package },
  { label: 'My Pickups', path: '/recycler/pickups', icon: Truck },
  { label: 'Circular Economy', path: '/recycler/circular', icon: Leaf },
];

export function RecyclerDashboard() {
  const [materials, setMaterials] = useState<RecyclableMaterial[]>([]);
  const [requests, setRequests] = useState<RecyclerRequest[]>([]);
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);

  useEffect(() => {
    supabase.from('recyclable_materials').select('*').order('created_at', { ascending: false }).then(({ data }) => setMaterials((data as RecyclableMaterial[]) || []));
    supabase.from('recycler_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setRequests((data as RecyclerRequest[]) || []));
    supabase.from('impact_metrics').select('*').order('metric_date', { ascending: true }).limit(14).then(({ data }) => setMetrics((data as ImpactMetric[]) || []));
  }, []);

  const available = materials.filter(m => m.status === 'available');
  const totalValue = materials.reduce((s, m) => s + m.estimated_value, 0);
  const totalKg = materials.reduce((s, m) => s + m.quantity_kg, 0);

  const pieData = [
    { name: 'Plastic', value: materials.filter(m => m.material_type === 'plastic').reduce((s, m) => s + m.quantity_kg, 0) },
    { name: 'Paper', value: materials.filter(m => m.material_type === 'paper').reduce((s, m) => s + m.quantity_kg, 0) },
    { name: 'Metal', value: materials.filter(m => m.material_type === 'metal').reduce((s, m) => s + m.quantity_kg, 0) },
    { name: 'Glass', value: materials.filter(m => m.material_type === 'glass').reduce((s, m) => s + m.quantity_kg, 0) },
    { name: 'E-Waste', value: materials.filter(m => m.material_type === 'e_waste').reduce((s, m) => s + m.quantity_kg, 0) },
  ].filter(d => d.value > 0);
  const pieColors = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <DashboardLayout navItems={navItems} title="Recycler Dashboard" subtitle="Manage recyclable materials and pickups" roleLabel="Recycler" roleColor="bg-cyan-100 text-cyan-700">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Available Materials" value={available.length} icon={<Package className="h-5 w-5" />} iconBg="bg-cyan-100 text-cyan-600" />
          <StatCard label="Total Volume" value={formatKg(totalKg)} icon={<Recycle className="h-5 w-5" />} iconBg="bg-emerald-100 text-emerald-600" />
          <StatCard label="Estimated Value" value={formatCurrency(totalValue)} icon={<IndianRupee className="h-5 w-5" />} iconBg="bg-amber-100 text-amber-600" />
          <StatCard label="My Pickups" value={requests.length} icon={<Truck className="h-5 w-5" />} iconBg="bg-blue-100 text-blue-600" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recently Available Materials</CardTitle>
                <Link to="/recycler/marketplace"><Button variant="ghost" size="sm" className="gap-1 text-xs">View All <ArrowRight className="h-3 w-3" /></Button></Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {available.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package className="h-5 w-5" /></div>
                        <div><p className="text-sm font-semibold">{wasteTypeLabel(m.material_type)}</p><p className="text-xs text-muted-foreground">{m.quantity_kg} kg · {m.zone}</p></div>
                      </div>
                      <div className="text-right"><p className="text-sm font-bold">{formatCurrency(m.estimated_value)}</p><Badge variant="outline" className="bg-success/10 text-success">{m.status}</Badge></div>
                    </div>
                  ))}
                  {available.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No materials available</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader><CardTitle className="text-base">Material Breakdown</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>{pieData.map((_, idx) => <Cell key={idx} fill={pieColors[idx % pieColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="py-12 text-center text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-success/20 bg-success/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10"><Leaf className="h-7 w-7 text-success" /></div>
            <div><p className="text-lg font-bold">From Waste to Value</p><p className="text-sm text-muted-foreground">You've helped recover {formatKg(totalKg)} of recyclable materials worth {formatCurrency(totalValue)}.</p></div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
