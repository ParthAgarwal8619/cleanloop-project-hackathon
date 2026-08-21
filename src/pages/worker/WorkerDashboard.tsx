import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ClipboardList, MapPin, Clock, Package, ArrowRight, CheckCircle2, Loader2, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { CollectionTask, WasteReport } from '@/types';
import { priorityColor, priorityLabel, statusColor, statusLabel, wasteTypeLabel, formatDateTime } from '@/lib/format';

const navItems = [
  { label: 'Today', path: '/worker', icon: ClipboardList },
  { label: 'Tasks', path: '/worker', icon: Truck },
];

export function WorkerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<(CollectionTask & { report?: WasteReport })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from('collection_tasks').select('*').eq('worker_id', profile.id).order('created_at', { ascending: false }).then(async ({ data }) => {
      const taskList = data as CollectionTask[] || [];
      const withReports = await Promise.all(taskList.map(async t => {
        const { data: report } = await supabase.from('waste_reports').select('*').eq('id', t.report_id).maybeSingle();
        return { ...t, report: report as WasteReport };
      }));
      setTasks(withReports);
      setLoading(false);
    });
  }, [profile]);

  const activeTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'started' || t.status === 'arrived');
  const completedTasks = tasks.filter(t => t.status === 'verified' || t.status === 'collected');

  return (
    <DashboardLayout navItems={navItems} title="Today's Tasks" subtitle="Your assigned collection route" roleLabel="Worker" roleColor="bg-amber-100 text-amber-700">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mx-auto"><ClipboardList className="h-5 w-5" /></div><p className="mt-2 text-2xl font-bold">{activeTasks.length}</p><p className="text-xs text-muted-foreground">Active Tasks</p></Card>
          <Card className="p-4 text-center"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success mx-auto"><CheckCircle2 className="h-5 w-5" /></div><p className="mt-2 text-2xl font-bold">{completedTasks.length}</p><p className="text-xs text-muted-foreground">Completed</p></Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Active Tasks</h2>
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div> : activeTasks.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Truck className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">No active tasks assigned</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => (
                <Card key={task.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/worker/task/${task.report?.report_id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {task.report?.image_url ? <img src={task.report.image_url} alt="Waste" className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>}
                        <div><p className="text-sm font-bold">{task.report?.report_id}</p><p className="text-xs text-muted-foreground">{wasteTypeLabel(task.report?.waste_type || 'mixed')} · {task.report?.estimated_kg} kg</p><p className="text-xs text-muted-foreground truncate">{task.report?.address}</p></div>
                      </div>
                      <Badge variant="outline" className={priorityColor(task.priority)}>{priorityLabel(task.priority)}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {formatDateTime(task.created_at)}</div>
                      <Button size="sm" className="gap-1">Open <ArrowRight className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Completed</h2>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map(task => (
                <Card key={task.id} className="p-3 opacity-70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /><p className="text-sm font-medium">{task.report?.report_id}</p></div>
                    <Badge variant="outline" className={statusColor(task.status)}>{statusLabel(task.status)}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
