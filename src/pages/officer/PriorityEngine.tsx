import { useEffect, useState } from 'react';
import { LayoutDashboard, Map, Flame, Brain, Route, Droplets, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { calculatePriorityScore } from '@/lib/ai';
import type { WasteReport } from '@/types';
import { priorityColor, priorityLabel, wasteTypeLabel, timeAgo } from '@/lib/format';

const navItems = [
  { label: 'Dashboard', path: '/officer', icon: LayoutDashboard },
  { label: 'City Map', path: '/officer/map', icon: Map },
  { label: 'Hotspots', path: '/officer/hotspots', icon: Flame },
  { label: 'AI Priority', path: '/officer/priority', icon: Brain },
  { label: 'Routes', path: '/officer/routes', icon: Route },
  { label: 'Drain Monitor', path: '/officer/drains', icon: Droplets },
];

export function PriorityEngine() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [selected, setSelected] = useState<WasteReport | null>(null);

  useEffect(() => {
    supabase.from('waste_reports').select('*').in('status', ['AI_ANALYZED', 'ASSIGNED', 'SUBMITTED']).order('risk_score', { ascending: false }).limit(30).then(({ data }) => {
      setReports((data as WasteReport[]) || []);
      if (data && data.length > 0) setSelected(data[0] as WasteReport);
    });
  }, []);

  const scoreData = selected ? calculatePriorityScore(selected) : null;

  return (
    <DashboardLayout navItems={navItems} title="AI Priority Engine" subtitle="Risk-based prioritization of waste reports" roleLabel="Officer" roleColor="bg-emerald-100 text-emerald-700">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          <p className="text-sm font-semibold text-muted-foreground">Reports Queue</p>
          <div className="max-h-[600px] space-y-2 overflow-y-auto scrollbar-thin">
            {reports.map(r => (
              <button key={r.id} onClick={() => setSelected(r)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selected?.id === r.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                <div className="flex items-center justify-between"><p className="text-xs font-bold">{r.report_id}</p><Badge variant="outline" className={`text-[10px] ${priorityColor(r.priority)}`}>{priorityLabel(r.priority)}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{wasteTypeLabel(r.waste_type || 'mixed')} · {r.estimated_kg} kg · {timeAgo(r.created_at)}</p>
                <p className="text-xs font-semibold text-primary">Score: {r.risk_score}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selected && scoreData ? (
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Report {selected.report_id}</p><p className="text-2xl font-bold text-foreground">Priority Score</p></div>
                    <div className="text-right"><p className="text-4xl font-extrabold text-primary">{scoreData.score}<span className="text-lg text-muted-foreground">/100</span></p><Badge variant="outline" className={priorityColor(scoreData.score > 80 ? 'CRITICAL' : scoreData.score > 60 ? 'HIGH' : 'MEDIUM')}>{scoreData.score > 80 ? 'CRITICAL PRIORITY' : 'HIGH PRIORITY'}</Badge></div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${scoreData.score > 75 ? 'bg-red-500' : scoreData.score > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${scoreData.score}%` }} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Priority Factors</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scoreData.factors.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="text-sm font-medium">{f.label}</span>
                        <span className="text-sm font-bold text-primary">+{f.points}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4"><p className="text-xs text-muted-foreground">Waste Type</p><p className="text-sm font-bold capitalize">{wasteTypeLabel(selected.waste_type || 'mixed')}</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Estimated Quantity</p><p className="text-sm font-bold">{selected.estimated_kg} kg</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Near Drain</p><p className="text-sm font-bold">{selected.near_drain ? `Yes (${selected.drain_distance}m)` : 'No'}</p></Card>
                <Card className="p-4"><p className="text-xs text-muted-foreground">Public Area</p><p className="text-sm font-bold">{selected.public_area ? 'Yes' : 'No'}</p></Card>
              </div>

              {selected.ai_recommendation && (
                <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4"><p className="flex items-center gap-2 text-sm font-semibold text-primary"><Brain className="h-4 w-4" /> AI Recommendation</p><p className="mt-2 text-sm">{selected.ai_recommendation}</p></CardContent></Card>
              )}
            </div>
          ) : <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a report to view priority analysis</CardContent></Card>}
        </div>
      </div>
    </DashboardLayout>
  );
}
