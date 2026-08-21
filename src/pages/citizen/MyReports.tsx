import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Camera, CheckCircle2, MapPin, Sparkles, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { WasteReport, ReportStatus, Priority } from '@/types';
import { statusColor, statusLabel, priorityColor, priorityLabel, formatDate, wasteTypeLabel } from '@/lib/format';

const navItems = [
  { label: 'Home', path: '/citizen', icon: Recycle },
  { label: 'Report Waste', path: '/citizen/report', icon: Camera },
  { label: 'My Reports', path: '/citizen/reports', icon: CheckCircle2 },
  { label: 'Nearby Waste', path: '/citizen/nearby', icon: MapPin },
  { label: 'Rewards', path: '/citizen/rewards', icon: Sparkles },
  { label: 'Impact', path: '/citizen/impact', icon: Recycle },
];

export function MyReports() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('waste_reports')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports((data as WasteReport[]) || []);
        setLoading(false);
      });
  }, [profile]);

  const filtered = reports.filter((r) => {
    const matchSearch =
      !search ||
      r.report_id.toLowerCase().includes(search.toLowerCase()) ||
      (r.address || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.waste_type || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <DashboardLayout
      navItems={navItems}
      title="My Reports"
      subtitle="Track all your waste reports"
      roleLabel="Citizen"
      roleColor="bg-blue-100 text-blue-700"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by report ID, location, or waste type..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="AI_ANALYZED">AI Verified</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COLLECTED">Collected</SelectItem>
              <SelectItem value="AI_VERIFIED">AI Verified</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium">No reports found</p>
              <p className="text-xs text-muted-foreground">Try adjusting filters or report new waste.</p>
              <Link to="/citizen/report">
                <Button className="mt-4" size="sm">Report Waste</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => (
              <Card key={report.id} className="overflow-hidden transition-shadow hover:shadow-md">
                {report.image_url ? (
                  <div className="h-32 overflow-hidden bg-muted">
                    <img src={report.image_url} alt="Waste" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center bg-muted">
                    <Recycle className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{report.report_id}</p>
                    <Badge variant="outline" className={priorityColor(report.priority)}>
                      {priorityLabel(report.priority)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {wasteTypeLabel(report.waste_type || 'mixed')} · {formatDate(report.created_at)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">{report.address}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className={statusColor(report.status)}>
                      {statusLabel(report.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Risk: {report.risk_score}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
