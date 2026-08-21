import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Recycle,
  Camera,
  CheckCircle2,
  MapPin,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Bell,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { CityMap } from '@/components/CityMap';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { WasteReport, Notification } from '@/types';
import { statusColor, statusLabel, priorityColor, timeAgo, wasteTypeLabel } from '@/lib/format';

const navItems = [
  { label: 'Home', path: '/citizen', icon: Recycle },
  { label: 'Report Waste', path: '/citizen/report', icon: Camera },
  { label: 'My Reports', path: '/citizen/reports', icon: CheckCircle2 },
  { label: 'Nearby Waste', path: '/citizen/nearby', icon: MapPin },
  { label: 'Rewards', path: '/citizen/rewards', icon: Sparkles },
  { label: 'Impact', path: '/citizen/impact', icon: Recycle },
];

export function CitizenDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('waste_reports')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setReports((data as WasteReport[]) || []);
        setLoading(false);
      });

    supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setNotifications((data as Notification[]) || []));
  }, [profile]);

  const myReportCount = reports.length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  const markers = reports.map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    priority: r.status === 'RESOLVED' ? 'LOW' : r.priority,
    reportId: r.report_id,
    wasteType: r.waste_type || undefined,
    status: r.status,
  }));

  return (
    <DashboardLayout
      navItems={navItems}
      title={`Welcome, ${profile?.name?.split(' ')[0] || 'Citizen'}`}
      subtitle="Your waste reporting dashboard"
      roleLabel="Citizen"
      roleColor="bg-blue-100 text-blue-700"
    >
      <div className="space-y-6">
        {/* Quick action banner */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-emerald-50">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-foreground">Report Waste in Your Area</h2>
              <p className="text-sm text-muted-foreground">Upload a photo and let AI analyze and prioritize it.</p>
            </div>
            <Button onClick={() => navigate('/citizen/report')} size="lg" className="gap-2">
              <Camera className="h-5 w-5" /> Report Waste
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Reports" value={myReportCount} icon={<CheckCircle2 className="h-5 w-5" />} iconBg="bg-blue-100 text-blue-600" />
          <StatCard label="Resolved" value={resolvedCount} icon={<Recycle className="h-5 w-5" />} iconBg="bg-success/10 text-success" />
          <StatCard label="Eco Points" value={profile?.eco_points || 0} icon={<Sparkles className="h-5 w-5" />} iconBg="bg-amber-100 text-amber-600" />
          <StatCard label="Badges" value={profile?.badges?.length || 0} icon={<Award className="h-5 w-5" />} iconBg="bg-purple-100 text-purple-600" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent reports */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Reports</CardTitle>
                <Link to="/citizen/reports">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Camera className="h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">No reports yet. Start by reporting waste!</p>
                    <Button onClick={() => navigate('/citizen/report')} className="mt-4" size="sm">
                      Report Waste
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <Link
                        key={report.id}
                        to="/citizen/reports"
                        className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Recycle className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{report.report_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {wasteTypeLabel(report.waste_type || 'mixed')} · {timeAgo(report.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={priorityColor(report.priority)}>
                            {report.priority}
                          </Badge>
                          <Badge variant="outline" className={statusColor(report.status)}>
                            {statusLabel(report.status)}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4" /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{notif.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(notif.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* My reports map */}
        {reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Reports Map</CardTitle>
            </CardHeader>
            <CardContent>
              <CityMap markers={markers} height="350px" />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
