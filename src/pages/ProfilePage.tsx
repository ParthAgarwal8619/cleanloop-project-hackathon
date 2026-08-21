import { useNavigate } from 'react-router-dom';
import { Recycle, User, Mail, Phone, MapPin, Award, Sparkles, LogOut, ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { label: 'Profile', path: '/profile', icon: User },
];

export function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) {
    navigate('/signin');
    return null;
  }

  const roleColors: Record<string, string> = {
    citizen: 'bg-blue-100 text-blue-700',
    officer: 'bg-emerald-100 text-emerald-700',
    worker: 'bg-amber-100 text-amber-700',
    recycler: 'bg-cyan-100 text-cyan-700',
    admin: 'bg-purple-100 text-purple-700',
  };

  return (
    <DashboardLayout navItems={navItems} title="Profile" subtitle="Your account information" roleLabel={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} roleColor={roleColors[profile.role]}>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">{profile.name.charAt(0)}</div>
              <div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <Badge variant="outline" className={`mt-1 capitalize ${roleColors[profile.role]}`}>{profile.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Mail className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{profile.email}</p></div></div>
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Phone className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium">{profile.phone || 'Not provided'}</p></div></div>
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><MapPin className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Zone</p><p className="text-sm font-medium">{profile.zone || 'Not assigned'}</p></div></div>
            </div>
          </CardContent>
        </Card>

        {profile.role === 'citizen' && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-amber-500" /> Eco Points & Badges</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-amber-50 p-4 text-center"><p className="text-3xl font-bold text-amber-600">{profile.eco_points}</p><p className="text-xs text-muted-foreground">Eco Points</p></div>
                <div className="rounded-lg bg-purple-50 p-4 text-center"><p className="text-3xl font-bold text-purple-600">{profile.badges.length}</p><p className="text-xs text-muted-foreground">Badges</p></div>
              </div>
              {profile.badges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">{profile.badges.map(b => <Badge key={b} className="bg-primary/10 text-primary"><Award className="mr-1 h-3 w-3" /> {b}</Badge>)}</div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <Button variant="destructive" onClick={() => { signOut(); navigate('/'); }} className="w-full gap-2"><LogOut className="h-4 w-4" /> Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
