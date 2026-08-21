import { useEffect, useState } from 'react';
import { LayoutDashboard, Map, Flame, Brain, Route, Droplets, Truck, Navigation, Clock, MapPin, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { optimizeRoute } from '@/lib/ai';
import type { WasteReport, Vehicle, Route as RouteType, RouteStop, Profile } from '@/types';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', path: '/officer', icon: LayoutDashboard },
  { label: 'City Map', path: '/officer/map', icon: Map },
  { label: 'Hotspots', path: '/officer/hotspots', icon: Flame },
  { label: 'AI Priority', path: '/officer/priority', icon: Brain },
  { label: 'Routes', path: '/officer/routes', icon: Route },
  { label: 'Drain Monitor', path: '/officer/drains', icon: Droplets },
];

export function RouteOptimization() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [existingRoutes, setExistingRoutes] = useState<(RouteType & { stops: RouteStop[]; worker?: Profile })[]>([]);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    supabase.from('waste_reports').select('*').in('status', ['AI_ANALYZED', 'ASSIGNED']).order('created_at', { ascending: false }).then(({ data }) => setReports((data as WasteReport[]) || []));
    supabase.from('vehicles').select('*').then(({ data }) => setVehicles((data as Vehicle[]) || []));
    supabase.from('routes').select('*').order('created_at', { ascending: false }).limit(5).then(async ({ data }) => {
      const routes = data as RouteType[] || [];
      const withStops = await Promise.all(routes.map(async r => {
        const { data: stops } = await supabase.from('route_stops').select('*').eq('route_id', r.id).order('stop_order', { ascending: true });
        let worker: Profile | undefined;
        if (r.worker_id) { const { data: w } = await supabase.from('profiles').select('*').eq('id', r.worker_id).maybeSingle(); worker = w as Profile | undefined; }
        return { ...r, stops: (stops as RouteStop[]) || [], worker };
      }));
      setExistingRoutes(withStops);
    });
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    await new Promise(r => setTimeout(r, 1500));
    const reportData = reports.map(r => ({ id: r.id, report_id: r.report_id, latitude: r.latitude, longitude: r.longitude, estimated_kg: r.estimated_kg, address: r.address }));
    const result = optimizeRoute(reportData, vehicles);

    for (const route of result.routes) {
      const { data: routeRow } = await supabase.from('routes').insert({ vehicle_id: route.vehicle.id, worker_id: vehicles.find(v => v.id === route.vehicle.id)?.driver_name ? null : null, status: 'planned', total_distance_km: route.total_distance_km, estimated_time_min: route.estimated_time_min, total_stops: route.stops.length, waste_capacity: route.total_waste_kg }).select().single();
      if (routeRow) {
        await supabase.from('route_stops').insert(route.stops.map(s => ({ route_id: routeRow.id, report_id: reports.find(r => r.report_id === s.report_id)?.id, stop_order: s.order, zone: s.zone, status: 'pending' })));
      }
    }
    toast.success(`Optimized ${result.routes.length} routes covering ${reports.length} reports`);
    setOptimizing(false);
    loadData();
  };

  const totalDistance = existingRoutes.reduce((s, r) => s + r.total_distance_km, 0);
  const totalTime = existingRoutes.reduce((s, r) => s + r.estimated_time_min, 0);

  return (
    <DashboardLayout navItems={navItems} title="Smart Collection Routes" subtitle="AI-assisted route optimization" roleLabel="Officer" roleColor="bg-emerald-100 text-emerald-700">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Unassigned Reports" value={reports.length} icon={<MapPin className="h-5 w-5" />} iconBg="bg-amber-100 text-amber-600" />
          <StatCard label="Available Vehicles" value={vehicles.filter(v => v.status !== 'maintenance').length} icon={<Truck className="h-5 w-5" />} iconBg="bg-blue-100 text-blue-600" />
          <StatCard label="Estimated Distance" value={`${totalDistance.toFixed(1)} km`} icon={<Navigation className="h-5 w-5" />} iconBg="bg-emerald-100 text-emerald-600" />
          <StatCard label="Estimated Time" value={`${Math.floor(totalTime / 60)}h ${totalTime % 60}m`} icon={<Clock className="h-5 w-5" />} iconBg="bg-purple-100 text-purple-600" />
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Zap className="h-6 w-6 text-primary" /></div><div><p className="text-sm font-bold">AI-Assisted Route Optimization</p><p className="text-xs text-muted-foreground">Generate optimized routes for available vehicles</p></div></div>
            <Button onClick={handleOptimize} disabled={optimizing || reports.length === 0} className="gap-2">{optimizing ? 'Optimizing...' : 'Optimize Routes'}</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {existingRoutes.length === 0 ? (
            <Card className="lg:col-span-2"><CardContent className="py-12 text-center"><Truck className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">No routes yet. Click "Optimize Routes" to generate.</p></CardContent></Card>
          ) : (
            existingRoutes.map((route, idx) => {
              const vehicle = vehicles.find(v => v.id === route.vehicle_id);
              return (
                <Card key={route.id}>
                  <CardHeader><CardTitle className="flex items-center justify-between text-base"><span className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> {vehicle?.vehicle_id || `Route ${idx + 1}`}</span><Badge variant="outline" className={route.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}>{route.status}</Badge></CardTitle></CardHeader>
                  <CardContent>
                    <div className="mb-4 grid grid-cols-4 gap-2 text-center">
                      <div><p className="text-lg font-bold">{route.total_stops}</p><p className="text-xs text-muted-foreground">Stops</p></div>
                      <div><p className="text-lg font-bold">{route.total_distance_km}</p><p className="text-xs text-muted-foreground">km</p></div>
                      <div><p className="text-lg font-bold">{route.estimated_time_min}m</p><p className="text-xs text-muted-foreground">Time</p></div>
                      <div><p className="text-lg font-bold">{route.waste_capacity}</p><p className="text-xs text-muted-foreground">kg</p></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><div className="h-2 w-2 rounded-full bg-success" /> Start Point</div>
                      {route.stops.map((stop, sIdx) => (
                        <div key={stop.id} className="flex items-center gap-2 text-xs"><div className={`h-2 w-2 rounded-full ${stop.status === 'visited' ? 'bg-success' : 'bg-primary'}`} /><span className="flex-1">{stop.zone || `Stop ${stop.stop_order}`}</span><Badge variant="outline" className="text-[10px]">{stop.status}</Badge></div>
                      ))}
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><div className="h-2 w-2 rounded-full bg-destructive" /> Processing Center</div>
                    </div>
                    {vehicle && <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-3"><span className="text-xs text-muted-foreground">Capacity: {vehicle.current_load}/{vehicle.capacity} kg</span><div className="h-2 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(vehicle.current_load / vehicle.capacity) * 100}%` }} /></div></div>}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
