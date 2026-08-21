import { useEffect, useState } from 'react';
import { Recycle, Package, Truck, Leaf, Search, IndianRupee, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { RecyclableMaterial } from '@/types';
import { formatCurrency, wasteTypeLabel } from '@/lib/format';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', path: '/recycler', icon: Recycle },
  { label: 'Marketplace', path: '/recycler/marketplace', icon: Package },
  { label: 'My Pickups', path: '/recycler/pickups', icon: Truck },
  { label: 'Circular Economy', path: '/recycler/circular', icon: Leaf },
];

const MATERIAL_ICONS: Record<string, string> = { plastic: '♻️', paper: '📄', metal: '🔩', glass: '🍾', e_waste: '🔌' };

export function MaterialMarketplace() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<RecyclableMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    supabase.from('recyclable_materials').select('*').order('created_at', { ascending: false }).then(({ data }) => setMaterials((data as RecyclableMaterial[]) || []));
  }, []);

  const filtered = materials.filter(m => {
    const matchSearch = !search || m.material_type.toLowerCase().includes(search.toLowerCase()) || (m.zone || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || m.material_type === typeFilter;
    return matchSearch && matchType;
  });

  const handleRequest = async (material: RecyclableMaterial) => {
    if (!profile) return;
    const { error } = await supabase.from('recycler_requests').insert({ recycler_id: profile.id, material_id: material.id, material_type: material.material_type, quantity_kg: material.quantity_kg, status: 'pending', estimated_value: material.estimated_value });
    if (error) { toast.error('Failed to request material'); return; }
    await supabase.from('recyclable_materials').update({ status: 'reserved' }).eq('id', material.id);
    setMaterials(materials.map(m => m.id === material.id ? { ...m, status: 'reserved' } : m));
    toast.success(`Requested ${material.quantity_kg} kg of ${wasteTypeLabel(material.material_type)}`);
  };

  return (
    <DashboardLayout navItems={navItems} title="Material Marketplace" subtitle="Browse and request recyclable materials" roleLabel="Recycler" roleColor="bg-cyan-100 text-cyan-700">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by material type or zone..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="flex gap-2">
            {['all', 'plastic', 'paper', 'metal', 'glass', 'e_waste'].map(t => (
              <Button key={t} variant={typeFilter === t ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(t)} className="capitalize">{t === 'all' ? 'All' : wasteTypeLabel(t)}</Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(m => (
            <Card key={m.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">{MATERIAL_ICONS[m.material_type] || '♻️'}</div>
                    <div><p className="text-sm font-bold">{wasteTypeLabel(m.material_type)}</p><p className="text-xs text-muted-foreground">{m.zone}</p></div>
                  </div>
                  <Badge variant="outline" className={m.status === 'available' ? 'bg-success/10 text-success' : m.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}>{m.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Quantity</p><p className="text-lg font-bold">{m.quantity_kg} kg</p></div>
                  <div><p className="text-xs text-muted-foreground">Est. Value</p><p className="text-lg font-bold text-primary">{formatCurrency(m.estimated_value)}</p></div>
                </div>
                <Button onClick={() => handleRequest(m)} disabled={m.status !== 'available'} className="mt-4 w-full gap-2" size="sm">{m.status === 'available' ? <><Truck className="h-4 w-4" /> Request Pickup</> : <><CheckCircle2 className="h-4 w-4" /> Reserved</>}</Button>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <Card className="md:col-span-2 lg:col-span-3"><CardContent className="py-12 text-center"><Package className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 text-sm text-muted-foreground">No materials found</p></CardContent></Card>}
        </div>
      </div>
    </DashboardLayout>
  );
}
