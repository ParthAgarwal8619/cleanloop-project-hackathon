import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ClipboardList, MapPin, Package, ArrowLeft, Navigation, Camera, CheckCircle2, Loader2, Brain, Sparkles, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CityMap } from '@/components/CityMap';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { verifyCollection } from '@/lib/ai';
import type { WasteReport, CollectionTask } from '@/types';
import { priorityColor, priorityLabel, statusColor, statusLabel, wasteTypeLabel } from '@/lib/format';
import { toast } from 'sonner';

const navItems = [
  { label: 'Today', path: '/worker', icon: ClipboardList },
  { label: 'Tasks', path: '/worker', icon: Truck },
];

export function WorkerTaskDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<WasteReport | null>(null);
  const [task, setTask] = useState<CollectionTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{ verified: boolean; confidence: number; message: string } | null>(null);

  useEffect(() => {
    if (!reportId) return;
    supabase.from('waste_reports').select('*').eq('report_id', reportId).maybeSingle().then(async ({ data }) => {
      setReport(data as WasteReport);
      if (data) {
        const { data: taskData } = await supabase.from('collection_tasks').select('*').eq('report_id', (data as WasteReport).id).maybeSingle();
        setTask(taskData as CollectionTask);
      }
      setLoading(false);
    });
  }, [reportId]);

  const updateTaskStatus = async (newStatus: CollectionTask['status']) => {
    if (!task || !report) return;
    const { error } = await supabase.from('collection_tasks').update({ status: newStatus }).eq('id', task.id);
    if (error) { toast.error('Failed to update task'); return; }
    setTask({ ...task, status: newStatus });

    const statusMap: Record<string, WasteReport['status']> = { started: 'IN_PROGRESS', arrived: 'IN_PROGRESS', collected: 'COLLECTED', verified: 'AI_VERIFIED' };
    if (statusMap[newStatus]) {
      await supabase.from('waste_reports').update({ status: statusMap[newStatus] }).eq('id', report.id);
      setReport({ ...report, status: statusMap[newStatus] });
    }
    toast.success(`Task marked as ${newStatus}`);
  };

  const handleAfterImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
      setAfterImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAfterImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!afterImageFile || !report || !task) return;
    setVerifying(true);
    await new Promise(r => setTimeout(r, 2000));

    let afterUrl: string | null = null;
    const fileName = `after/${Date.now()}-${afterImageFile.name}`;
    const { data: uploadData } = await supabase.storage.from('waste-images').upload(fileName, afterImageFile);
    if (uploadData) { const { data: urlData } = supabase.storage.from('waste-images').getPublicUrl(fileName); afterUrl = urlData.publicUrl; }

    const result = verifyCollection(report.image_url, afterUrl);
    setVerification(result);

    await supabase.from('collection_tasks').update({ status: 'verified', after_image_url: afterUrl, ai_verification: result.message, ai_verification_confidence: result.confidence, completed_at: new Date().toISOString() }).eq('id', task.id);
    await supabase.from('waste_reports').update({ status: 'AI_VERIFIED', after_image_url: afterUrl }).eq('id', report.id);
    setTask({ ...task, status: 'verified', after_image_url: afterUrl, ai_verification: result.message, ai_verification_confidence: result.confidence });
    setReport({ ...report, status: 'AI_VERIFIED', after_image_url: afterUrl });
    setVerifying(false);
    toast.success('AI verification complete');
  };

  const handleResolve = async () => {
    if (!report || !task) return;
    await supabase.from('waste_reports').update({ status: 'RESOLVED', resolved_at: new Date().toISOString() }).eq('id', report.id);
    await supabase.from('collection_tasks').update({ status: 'verified' }).eq('id', task.id);

    if (report.waste_type && ['plastic', 'paper', 'metal', 'glass', 'e_waste'].includes(report.waste_type)) {
      const prices: Record<string, number> = { plastic: 25, paper: 12, metal: 80, glass: 8, e_waste: 350 };
      await supabase.from('recyclable_materials').insert({ material_type: report.waste_type, quantity_kg: report.estimated_kg, zone: report.address || 'Unknown', estimated_value: report.estimated_kg * (prices[report.waste_type] || 10), status: 'available', report_id: report.id });
    }

    if (profile) {
      await supabase.from('notifications').insert({ profile_id: profile.id, type: 'report_resolved', title: 'Report Resolved', message: `Report ${report.report_id} has been marked as resolved.`, read: false });
    }

    toast.success('Report resolved! Recyclable materials sent to marketplace.');
    navigate('/worker');
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Task Detail" roleLabel="Worker" roleColor="bg-amber-100 text-amber-700"><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  if (!report) return <DashboardLayout navItems={navItems} title="Task Detail" roleLabel="Worker" roleColor="bg-amber-100 text-amber-700"><Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Task not found</CardContent></Card></DashboardLayout>;

  const currentStatus = task?.status || 'assigned';

  return (
    <DashboardLayout navItems={navItems} title={`Task ${report.report_id}`} subtitle="Collection task detail" roleLabel="Worker" roleColor="bg-amber-100 text-amber-700">
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/worker')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Tasks</Button>

        {/* Report image */}
        <Card className="overflow-hidden">
          {report.image_url ? <img src={report.image_url} alt="Waste" className="h-48 w-full object-cover" /> : <div className="flex h-48 items-center justify-center bg-muted"><Package className="h-10 w-10 text-muted-foreground/40" /></div>}
          <CardContent className="p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-bold">{report.report_id}</p><Badge variant="outline" className={priorityColor(report.priority)}>{priorityLabel(report.priority)}</Badge></div>
            <p className="mt-1 text-xs text-muted-foreground">{wasteTypeLabel(report.waste_type || 'mixed')} · {report.estimated_kg} kg</p>
            <p className="text-xs text-muted-foreground">{report.address}</p>
          </CardContent>
        </Card>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3"><p className="text-xs text-muted-foreground">Waste Type</p><p className="text-sm font-bold">{wasteTypeLabel(report.waste_type || 'mixed')}</p></Card>
          <Card className="p-3"><p className="text-xs text-muted-foreground">Quantity</p><p className="text-sm font-bold">{report.estimated_kg} kg</p></Card>
          <Card className="p-3"><p className="text-xs text-muted-foreground">Priority</p><Badge variant="outline" className={priorityColor(report.priority)}>{priorityLabel(report.priority)}</Badge></Card>
          <Card className="p-3"><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColor(report.status)}>{statusLabel(report.status)}</Badge></Card>
        </div>

        {/* Map */}
        <Card><CardContent className="p-0"><CityMap markers={[{ id: report.id, latitude: report.latitude, longitude: report.longitude, priority: report.priority, reportId: report.report_id }]} height="200px" showLegend={false} centerLat={report.latitude} centerLng={report.longitude} /></CardContent></Card>

        {/* Action buttons based on status */}
        {currentStatus === 'assigned' && (
          <div className="flex gap-3"><Button onClick={() => updateTaskStatus('started')} className="flex-1 gap-2"><Navigation className="h-4 w-4" /> Start Task</Button><Button variant="outline" onClick={() => updateTaskStatus('arrived')} className="flex-1"><MapPin className="h-4 w-4 mr-2" /> Arrived</Button></div>
        )}
        {currentStatus === 'started' && (
          <Button onClick={() => updateTaskStatus('arrived')} className="w-full gap-2"><MapPin className="h-4 w-4" /> Mark as Arrived</Button>
        )}
        {currentStatus === 'arrived' && (
          <Button onClick={() => updateTaskStatus('collected')} className="w-full gap-2"><CheckCircle2 className="h-4 w-4" /> Mark as Collected</Button>
        )}

        {/* After collection - upload and verify */}
        {(currentStatus === 'collected' || currentStatus === 'verified') && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4 text-primary" /> AI Collection Verification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Before</p>{report.image_url ? <img src={report.image_url} alt="Before" className="h-28 w-full rounded-lg object-cover" /> : <div className="flex h-28 items-center justify-center rounded-lg bg-muted"><Package className="h-6 w-6 text-muted-foreground" /></div>}</div>
                <div><p className="mb-1 text-xs font-semibold text-muted-foreground">After</p>{afterImage ? <img src={afterImage} alt="After" className="h-28 w-full rounded-lg object-cover" /> : <button onClick={() => fileInputRef.current?.click()} className="flex h-28 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:border-primary"><Camera className="h-6 w-6 text-muted-foreground" /><span className="mt-1 text-xs text-muted-foreground">Upload</span></button>}</div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAfterImage} />

              {verification && (
                <div className="rounded-lg border border-success/20 bg-success/5 p-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /><p className="text-sm font-semibold text-success">AI Verification Complete</p></div><p className="mt-1 text-sm">{verification.message}</p><p className="mt-1 text-xs text-muted-foreground">Confidence: <span className="font-bold text-success">{Math.round(verification.confidence * 100)}%</span></p></div>
              )}

              {currentStatus === 'collected' && !verification && (
                <Button onClick={handleVerify} disabled={!afterImageFile || verifying} className="w-full gap-2">{verifying ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : <><Sparkles className="h-4 w-4" /> Run AI Verification</>}</Button>
              )}
              {currentStatus === 'verified' && (
                <Button onClick={handleResolve} className="w-full gap-2 bg-success hover:bg-success/90"><CheckCircle2 className="h-4 w-4" /> Mark as Resolved</Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
