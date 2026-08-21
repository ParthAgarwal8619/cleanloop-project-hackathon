import { useEffect, useState } from 'react';
import { Recycle, Camera, CheckCircle2, MapPin, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CityMap } from '@/components/CityMap';
import { supabase } from '@/lib/supabase';
import type { WasteReport } from '@/types';
import { priorityColor, priorityLabel, statusColor, statusLabel, wasteTypeLabel, timeAgo } from '@/lib/format';

const navItems = [
  { label: 'Home', path: '/citizen', icon: Recycle },
  { label: 'Report Waste', path: '/citizen/report', icon: Camera },
  { label: 'My Reports', path: '/citizen/reports', icon: CheckCircle2 },
  { label: 'Nearby Waste', path: '/citizen/nearby', icon: MapPin },
  { label: 'Rewards', path: '/citizen/rewards', icon: Sparkles },
  { label: 'Impact', path: '/citizen/impact', icon: Recycle },
];

export function NearbyWaste() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('waste_reports')
      .select('*')
      .in('status', ['AI_ANALYZED', 'ASSIGNED', 'IN_PROGRESS'])
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setReports((data as WasteReport[]) || []);
        setLoading(false);
      });
  }, []);

  const markers = reports.map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    priority: r.priority,
    reportId: r.report_id,
    wasteType: r.waste_type || undefined,
    status: r.status,
    time: timeAgo(r.created_at),
  }));

  return (
    <DashboardLayout
      navItems={navItems}
      title="Nearby Waste"
      subtitle="Active waste reports in your area"
      roleLabel="Citizen"
      roleColor="bg-blue-100 text-blue-700"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interactive Map</CardTitle>
          </CardHeader>
          <CardContent>
            <CityMap markers={markers} height="450px" />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)
          ) : (
            reports.slice(0, 9).map((report) => (
              <Card key={report.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{report.report_id}</p>
                  <Badge variant="outline" className={priorityColor(report.priority)}>
                    {priorityLabel(report.priority)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {wasteTypeLabel(report.waste_type || 'mixed')} · {report.estimated_kg} kg
                </p>
                <p className="mt-1 text-xs text-muted-foreground truncate">{report.address}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="outline" className={statusColor(report.status)}>
                    {statusLabel(report.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(report.created_at)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
