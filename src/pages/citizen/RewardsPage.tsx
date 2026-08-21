import { useEffect, useState } from 'react';
import { Recycle, Camera, CheckCircle2, MapPin, Sparkles, Award, Trophy, Star, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

const navItems = [
  { label: 'Home', path: '/citizen', icon: Recycle },
  { label: 'Report Waste', path: '/citizen/report', icon: Camera },
  { label: 'My Reports', path: '/citizen/reports', icon: CheckCircle2 },
  { label: 'Nearby Waste', path: '/citizen/nearby', icon: MapPin },
  { label: 'Rewards', path: '/citizen/rewards', icon: Sparkles },
  { label: 'Impact', path: '/citizen/impact', icon: Recycle },
];

const ALL_BADGES = [
  { name: 'Early Adopter', icon: Star, desc: 'One of the first CleanLoop citizens', color: 'bg-blue-100 text-blue-600' },
  { name: 'Waste Warrior', icon: Recycle, desc: 'Reported 10+ waste piles', color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Drain Guardian', icon: Leaf, desc: 'Reported 5+ drain risks', color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Eco Champion', icon: Trophy, desc: 'Earned 500+ Eco Points', color: 'bg-amber-100 text-amber-600' },
  { name: 'Plastic Fighter', icon: Award, desc: 'Reported 10+ plastic waste', color: 'bg-purple-100 text-purple-600' },
  { name: 'Community Hero', icon: Sparkles, desc: 'Reports verified 20+ times', color: 'bg-pink-100 text-pink-600' },
];

export function RewardsPage() {
  const { profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'citizen')
      .order('eco_points', { ascending: false })
      .limit(10)
      .then(({ data }) => setLeaderboard((data as Profile[]) || []));
  }, []);

  const myRank = leaderboard.findIndex((p) => p.id === profile?.id) + 1;

  return (
    <DashboardLayout
      navItems={navItems}
      title="Rewards & Achievements"
      subtitle="Earn Eco Points and badges for your contributions"
      roleLabel="Citizen"
      roleColor="bg-blue-100 text-blue-700"
    >
      <div className="space-y-6">
        {/* Points summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mx-auto">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{profile?.eco_points || 0}</p>
              <p className="text-sm text-muted-foreground">Eco Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600 mx-auto">
                <Award className="h-7 w-7" />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{profile?.badges?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                <Trophy className="h-7 w-7" />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">#{myRank || '-'}</p>
              <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_BADGES.map((badge) => {
                const Icon = badge.icon;
                const earned = profile?.badges?.includes(badge.name);
                return (
                  <div
                    key={badge.name}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                      earned ? 'border-primary/20 bg-primary/5' : 'border-border opacity-50'
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${badge.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.desc}</p>
                      {earned && <Badge className="mt-1 bg-primary/10 text-primary">Earned</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-lg p-3 ${
                    p.id === profile?.id ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name} {p.id === profile?.id && '(You)'}</p>
                    <p className="text-xs text-muted-foreground">{p.zone}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold">{p.eco_points}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How to earn */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to Earn Eco Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-2xl font-bold text-primary">+20</p>
                <p className="text-sm font-medium">Report Verified</p>
                <p className="text-xs text-muted-foreground">When your report is AI-verified</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-2xl font-bold text-primary">+30</p>
                <p className="text-sm font-medium">Recyclable Waste</p>
                <p className="text-xs text-muted-foreground">Report contains recyclable materials</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-2xl font-bold text-primary">+50</p>
                <p className="text-sm font-medium">Verified Hotspot</p>
                <p className="text-xs text-muted-foreground">Report a repeated dumping location</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
