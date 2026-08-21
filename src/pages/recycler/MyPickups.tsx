import { useEffect, useState } from 'react';
import { Recycle, Package, Truck, Leaf, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { RecyclerRequest } from '@/types';
import { formatCurrency, wasteTypeLabel, formatDate } from '@/lib/format';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', path: '/recycler', icon: Recycle },
  { label: 'Marketplace', path: '/recycler/marketplace', icon: Package },
  { label: 'My Pickups', path: '/recycler/pickups', icon: Truck },
  { label: 'Circular Economy', path: '/recycler/circular', icon: Leaf },
];

export function MyPickups() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<RecyclerRequest[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from('recycler_requests').select('*').eq('recycler_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => setRequests((data as RecyclerRequest[]) || []));
  }, [profile]);

  const updateStatus = async (id: string, status: RecyclerRequest['status']) => {
    const { error } = await supabase.from('recycler_requests').update({ status }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Pickup ${status}`);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', accepted: 'bg-blue-100 text-blue-700', collected: 'bg-cyan-100 text-cyan-700', processing: 'bg-purple-100 text-purple-700', completed: 'bg-success/10 text-success', cancelled: 'bg-red-100 text-red-700' };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <DashboardLayout navItems={navItems} title="My Pickups" subtitle="Track your material pickup requests" roleLabel="Recycler" roleColor="bg-cyan-100 text-cyan-700">
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><Truck className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">No pickup requests yet</p><p className="text-xs text-muted-foreground">Browse the marketplace to request materials</p></CardContent></Card>
        ) : (
          requests.map(r => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package className="h-6 w-6" /></div>
                  <div><p className="text-sm font-bold">{wasteTypeLabel(r.material_type)}</p><p className="text-xs text-muted-foreground">{r.quantity_kg} kg · {formatCurrency(r.estimated_value)} · {formatDate(r.created_at)}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusBadge(r.status)}>{r.status}</Badge>
                  {r.status === 'pending' && <Button size="sm" onClick={() => updateStatus(r.id, 'accepted')}>Accept</Button>}
                  {r.status === 'accepted' && <Button size="sm" onClick={() => updateStatus(r.id, 'collected')}>Mark Collected</Button>}
                  {r.status === 'collected' && <Button size="sm" onClick={() => updateStatus(r.id, 'processing')}>Start Processing</Button>}
                  {r.status === 'processing' && <Button size="sm" onClick={() => updateStatus(r.id, 'completed')} className="bg-success hover:bg-success/90">Complete</Button>}
                  {(r.status === 'pending' || r.status === 'accepted') && <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'cancelled')}>Cancel</Button>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
