import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Recycle,
  MapPin,
  Brain,
  Truck,
  TrendingUp,
  Shield,
  ArrowRight,
  Leaf,
  Trash2,
  Route,
  Award,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CityMap, MapMarker } from '@/components/CityMap';
import { supabase } from '@/lib/supabase';
import type { WasteReport } from '@/types';
import { useAuth } from '@/context/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, critical: 0 });

  useEffect(() => {
    supabase
      .from('waste_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setReports(data);
          setStats({
            total: data.length,
            resolved: data.filter((r) => r.status === 'RESOLVED').length,
            critical: data.filter((r) => r.priority === 'CRITICAL' || r.priority === 'HIGH').length,
          });
        }
      });
  }, []);

  const markers: MapMarker[] = reports.map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    priority: r.status === 'RESOLVED' ? 'LOW' : r.priority,
    reportId: r.report_id,
    wasteType: r.waste_type || undefined,
    status: r.status,
  }));

  const features = [
    {
      icon: Brain,
      title: 'AI Waste Detection',
      description: 'Upload a photo and our AI identifies waste type, quantity, severity, and environmental risk in seconds.',
    },
    {
      icon: MapPin,
      title: 'Smart Location Mapping',
      description: 'Every report is geo-tagged and plotted on an interactive city map for real-time visibility.',
    },
    {
      icon: Route,
      title: 'Route Optimization',
      description: 'AI-powered collection routes minimize distance and time while maximizing waste collected.',
    },
    {
      icon: Shield,
      title: 'Drain Risk Monitoring',
      description: 'Detect waste near drainage channels to prevent blockages and urban flooding before it happens.',
    },
    {
      icon: Recycle,
      title: 'Circular Economy',
      description: 'Recovered materials flow directly to recyclers, turning waste into value and reducing landfill.',
    },
    {
      icon: Award,
      title: 'Citizen Rewards',
      description: 'Earn Eco Points and badges for verified reports. Gamify civic responsibility.',
    },
  ];

  const flow = [
    { icon: Trash2, label: 'Report Waste', desc: 'Citizen uploads photo' },
    { icon: Brain, label: 'AI Analysis', desc: 'Detection & classification' },
    { icon: Activity, label: 'Priority Scoring', desc: 'Risk-based prioritization' },
    { icon: Truck, label: 'Smart Collection', desc: 'Optimized routes' },
    { icon: CheckCircle2, label: 'AI Verification', desc: 'Before/after check' },
    { icon: Leaf, label: 'Circular Economy', desc: 'Materials to recyclers' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">CleanLoop AI</p>
              <p className="text-[10px] text-muted-foreground">Smart Waste Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile ? (
              <Button onClick={() => navigate('/dashboard')} className="gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/signin')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/dashboard')} className="gap-2">
                  Explore Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-up">
              <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
                <Leaf className="mr-1 h-3 w-3" /> AI-Powered Civic Tech
              </Badge>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground lg:text-5xl">
                Turn India's Waste Problem Into a <span className="text-primary">Smarter System.</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                CleanLoop AI uses artificial intelligence to detect, classify, prioritize and optimize
                waste collection while connecting recyclable materials to the circular economy.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate('/citizen/report')} className="gap-2">
                  <Trash2 className="h-5 w-5" /> Report Waste
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
                  Explore Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-8 flex gap-8">
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}+</p>
                  <p className="text-xs text-muted-foreground">Reports Filed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.resolved}+</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.critical}+</p>
                  <p className="text-xs text-muted-foreground">High Priority</p>
                </div>
              </div>
            </div>
            <div className="animate-fade-in">
              <Card className="overflow-hidden p-0 shadow-xl">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Live City Map</p>
                  </div>
                  <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                    <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live
                  </Badge>
                </div>
                <CityMap markers={markers} height="400px" />
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground">From Report to Recycling</h2>
            <p className="mt-2 text-muted-foreground">The complete CleanLoop AI workflow</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {flow.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                  {idx < flow.length - 1 && (
                    <ArrowRight className="mt-2 hidden h-4 w-4 text-muted-foreground/40 lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground">A Complete Smart City Platform</h2>
            <p className="mt-2 text-muted-foreground">Everything needed to manage urban waste intelligently</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-6 transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-12 text-white shadow-xl">
            <h2 className="text-3xl font-bold">See Waste. Act Smart. Close the Loop.</h2>
            <p className="mt-3 text-white/90">
              Join the movement transforming India's waste management with AI.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/citizen/report')}
                className="gap-2"
              >
                <Trash2 className="h-5 w-5" /> Report Waste Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/signin')}
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Sign In to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 lg:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm font-semibold">CleanLoop AI</p>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-Powered Smart Waste Collection & Circular Economy Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
