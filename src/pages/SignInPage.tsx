import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, ArrowLeft, Mail, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

const DEMO_ACCOUNTS = [
  { email: 'aarav@demo.in', role: 'Citizen', label: 'Citizen', color: 'bg-blue-100 text-blue-700' },
  { email: 'officer1@cleanloop.ai', role: 'Officer', label: 'Municipal Officer', color: 'bg-emerald-100 text-emerald-700' },
  { email: 'worker1@cleanloop.ai', role: 'Worker', label: 'Collection Worker', color: 'bg-amber-100 text-amber-700' },
  { email: 'recycler1@cleanloop.ai', role: 'Recycler', label: 'Recycler', color: 'bg-cyan-100 text-cyan-700' },
  { email: 'admin@cleanloop.ai', role: 'Admin', label: 'Admin', color: 'bg-purple-100 text-purple-700' },
];

export function SignInPage() {
  const navigate = useNavigate();
  const { profile, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (profile) navigate('/dashboard');
  }, [profile, navigate]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setProfiles(data as Profile[]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email);
    if (error) setError(error);
    setLoading(false);
  };

  const quickSignIn = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    const { error } = await signIn(demoEmail);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 lg:flex-row">
      {/* Left panel */}
      <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-primary to-emerald-700 p-8 text-white lg:p-12">
        <Link to="/" className="mb-8 flex items-center gap-2 text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Recycle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xl font-bold">CleanLoop AI</p>
            <p className="text-sm text-white/80">Smart Waste Platform</p>
          </div>
        </div>
        <h2 className="mt-8 text-3xl font-bold leading-tight">
          Transforming India's Waste Management with AI
        </h2>
        <p className="mt-4 text-white/90">
          Sign in to access your role-based dashboard — report waste, manage collection, optimize routes,
          and track your circular economy impact.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-2xl font-bold">100+</p>
            <p className="text-xs text-white/80">Reports</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-white/80">Vehicles</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-2xl font-bold">30+</p>
            <p className="text-xs text-white/80">Drain Risks</p>
          </div>
        </div>
      </div>

      {/* Right panel - sign in form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Access your CleanLoop AI dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10" />
                  </div>
                  <p className="text-xs text-muted-foreground">Demo mode: any password works.</p>
                </div>
                {error && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> Quick Demo Access
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => quickSignIn(acc.email)}
                      disabled={loading}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{acc.label}</p>
                        <p className="text-xs text-muted-foreground">{acc.email}</p>
                      </div>
                      <Badge className={acc.color} variant="outline">
                        {acc.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              {profiles.length > 0 && (
                <div className="mt-4 max-h-32 overflow-y-auto scrollbar-thin">
                  <p className="mb-2 text-xs text-muted-foreground">All demo users ({profiles.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {profiles.slice(0, 20).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => quickSignIn(p.email || '')}
                        className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
