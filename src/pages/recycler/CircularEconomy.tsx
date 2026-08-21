import { useEffect, useState } from 'react';
import { Recycle, Package, Truck, Leaf, ArrowDown, TrendingUp, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import type { ImpactMetric } from '@/types';
import { formatKg, formatCurrency } from '@/lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const navItems = [
  { label: 'Dashboard', path: '/recycler', icon: Recycle },
  { label: 'Marketplace', path: '/recycler/marketplace', icon: Package },
  { label: 'My Pickups', path: '/recycler/pickups', icon: Truck },
  { label: 'Circular Economy', path: '/recycler/circular', icon: Leaf },
];

export function CircularEconomy() {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);

  useEffect(() => {
    supabase.from('impact_metrics').select('*').order('metric_date', { ascending: true }).limit(30).then(({ data }) => setMetrics((data as ImpactMetric[]) || []));
  }, []);

  const totalCollected = metrics.reduce((s, m) => s + m.waste_collected_kg, 0);
  const totalRecovered = metrics.reduce((s, m) => s + m.plastic_recovered_kg + m.paper_waste_kg + m.metal_waste_kg + m.glass_waste_kg + m.e_waste_kg, 0);
  const totalCo2 = metrics.reduce((s, m) => s + m.co2_impact_kg, 0);
  const avgRecyclingRate = metrics.length > 0 ? metrics.reduce((s, m) => s + m.recycling_rate, 0) / metrics.length : 0;

  const chartData = metrics.map(m => ({
    date: new Date(m.metric_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    collected: m.waste_collected_kg,
    recovered: m.plastic_recovered_kg + m.paper_waste_kg + m.metal_waste_kg + m.glass_waste_kg + m.e_waste_kg,
  }));

  const flowSteps = [
    { label: 'Collected', value: formatKg(totalCollected), icon: Truck, color: 'bg-blue-100 text-blue-600' },
    { label: 'Sorted', value: formatKg(totalCollected), icon: Package, color: 'bg-amber-100 text-amber-600' },
    { label: 'Recyclable', value: formatKg(totalRecovered), icon: Recycle, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Recycler', value: formatKg(totalRecovered), icon: Leaf, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'Recovered', value: formatKg(totalRecovered), icon: TrendingUp, color: 'bg-success/10 text-success' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="From Waste to Value" subtitle="Circular economy dashboard" roleLabel="Recycler" roleColor="bg-cyan-100 text-cyan-700">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Waste Collected" value={formatKg(totalCollected)} icon={<Truck className="h-5 w-5" />} iconBg="bg-blue-100 text-blue-600" />
          <StatCard label="Material Recovered" value={formatKg(totalRecovered)} icon={<Recycle className="h-5 w-5" />} iconBg="bg-emerald-100 text-emerald-600" />
          <StatCard label="Recycling Rate" value={`${Math.round(avgRecyclingRate * 100)}%`} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-purple-100 text-purple-600" />
          <StatCard label="CO₂ Impact" value={formatKg(Math.round(totalCo2))} icon={<Leaf className="h-5 w-5" />} iconBg="bg-success/10 text-success" />
        </div>

        {/* Flow visualization */}
        <Card>
          <CardHeader><CardTitle className="text-base">Waste Flow: From Collection to Recovery</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
              {flowSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
                    <div className="flex flex-col items-center text-center">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.color}`}><Icon className="h-7 w-7" /></div>
                      <p className="mt-2 text-sm font-semibold">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.value}</p>
                    </div>
                    {idx < flowSteps.length - 1 && <ArrowDown className="h-5 w-5 text-muted-foreground/40 md:rotate-[-90deg]" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Collected vs Recovered (30 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="collected" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recovered" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
