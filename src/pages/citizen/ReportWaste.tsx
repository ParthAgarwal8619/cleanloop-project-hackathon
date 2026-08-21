import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  MapPin,
  Brain,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Droplets,
  Users,
  Recycle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CityMap } from '@/components/CityMap';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { analyzeWaste } from '@/lib/ai';
import { generateReportId, wasteTypeLabel } from '@/lib/format';
import type { AIAnalysisResult } from '@/types';
import { toast } from 'sonner';

const navItems = [
  { label: 'Home', path: '/citizen', icon: Recycle },
  { label: 'Report Waste', path: '/citizen/report', icon: Camera },
  { label: 'My Reports', path: '/citizen/reports', icon: CheckCircle2 },
  { label: 'Nearby Waste', path: '/citizen/nearby', icon: MapPin },
  { label: 'Rewards', path: '/citizen/rewards', icon: Sparkles },
  { label: 'Impact', path: '/citizen/impact', icon: Recycle },
];

type Step = 'form' | 'analyzing' | 'result' | 'success';

export function ReportWaste() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('form');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [address, setAddress] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          toast.success('Location captured');
        },
        () => {
          toast.info('Using default demo location');
        }
      );
    } else {
      toast.info('Geolocation not available, using demo location');
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview && !description) {
      toast.error('Please upload an image or add a description');
      return;
    }
    setStep('analyzing');
    await new Promise((r) => setTimeout(r, 2200));
    const result = analyzeWaste(imageFile?.name || null, description, latitude, longitude);
    setAnalysis(result);
    setStep('result');
  };

  const handleSubmit = async () => {
    if (!analysis || !profile) return;
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const fileName = `reports/${Date.now()}-${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('waste-images')
        .upload(fileName, imageFile);
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('waste-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const reportId = generateReportId();
    const { data, error } = await supabase
      .from('waste_reports')
      .insert({
        report_id: reportId,
        profile_id: profile.id,
        image_url: imageUrl,
        latitude,
        longitude,
        address: address || 'Demo Location, Bengaluru',
        description: description || 'Waste accumulation reported',
        status: 'AI_ANALYZED',
        priority:
          analysis.risk_score > 80 ? 'CRITICAL' : analysis.risk_score > 60 ? 'HIGH' : analysis.risk_score > 40 ? 'MEDIUM' : 'LOW',
        risk_score: analysis.risk_score,
        waste_type: analysis.waste_type,
        confidence: analysis.confidence,
        severity: analysis.severity,
        estimated_kg: analysis.estimated_kg,
        near_drain: analysis.near_drain,
        drain_distance: analysis.drain_distance,
        public_area: analysis.public_area,
        overflow_risk: analysis.overflow_risk,
        health_risk: analysis.health_risk,
        ai_recommendation: analysis.recommendation,
        ai_mode: 'demo',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to submit report');
      setSubmitting(false);
      return;
    }

    if (data) {
      await supabase.from('waste_materials').insert(
        analysis.materials.map((m) => ({
          report_id: data.id,
          material_type: m.type,
          estimated_kg: m.estimated_kg,
        }))
      );

      if (analysis.near_drain) {
        await supabase.from('drain_incidents').insert({
          report_id: data.id,
          latitude,
          longitude,
          address: address || 'Demo Location, Bengaluru',
          distance_to_drain: analysis.drain_distance,
          waste_quantity: analysis.estimated_kg,
          risk_score: analysis.risk_score,
          risk_level: analysis.severity,
          status: 'active',
          recommended_action: analysis.recommendation,
        });
      }

      await supabase.from('notifications').insert({
        profile_id: profile.id,
        type: 'report_received',
        title: 'Report Submitted',
        message: `Your report ${reportId} has been received and AI-analyzed.`,
        read: false,
      });

      await supabase
        .from('profiles')
        .update({ eco_points: profile.eco_points + 20 })
        .eq('id', profile.id);
    }

    setSubmittedReportId(reportId);
    setStep('success');
    setSubmitting(false);
  };

  const resetForm = () => {
    setStep('form');
    setImagePreview(null);
    setImageFile(null);
    setDescription('');
    setAddress('');
    setAnalysis(null);
  };

  return (
    <DashboardLayout
      navItems={navItems}
      title="Report Waste"
      subtitle="Upload a photo and let AI analyze the waste"
      roleLabel="Citizen"
      roleColor="bg-blue-100 text-blue-700"
    >
      {step === 'form' && (
        <div className="mx-auto max-w-3xl animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" /> Report Waste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Waste Photo</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Waste preview" className="max-h-64 rounded-lg object-contain" />
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Upload className="h-7 w-7" />
                      </div>
                      <p className="mt-3 text-sm font-medium">Click to upload or take a photo</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the waste you see (e.g., plastic bottles near the drain, food waste on the street)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter address or landmark"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={getLocation} className="gap-2">
                    <MapPin className="h-4 w-4" /> GPS
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                </p>
                <CityMap
                  markers={[
                    { id: 'current', latitude, longitude, priority: 'HIGH', label: 'Your location' },
                  ]}
                  height="200px"
                  showLegend={false}
                  centerLat={latitude}
                  centerLng={longitude}
                />
              </div>

              <Button onClick={handleAnalyze} size="lg" className="w-full gap-2">
                <Brain className="h-5 w-5" /> Analyze with AI
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 animate-fade-in">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-primary" />
          </div>
          <h2 className="mt-6 text-xl font-bold">Demo AI Analysis</h2>
          <p className="mt-2 text-sm text-muted-foreground">Analyzing image for waste detection...</p>
          <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Detecting waste type...</p>
            <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Estimating quantity...</p>
            <p className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Assessing environmental risk...</p>
          </div>
        </div>
      )}

      {step === 'result' && analysis && (
        <div className="mx-auto max-w-3xl animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">AI Analysis</h2>
            <Badge className="border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="mr-1 h-3 w-3" /> Demo AI
            </Badge>
          </div>

          {/* Main analysis card */}
          <Card className="overflow-hidden">
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Waste Type</p>
                <p className="text-xl font-bold capitalize">{wasteTypeLabel(analysis.waste_type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-xl font-bold text-primary">{Math.round(analysis.confidence * 100)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Quantity</p>
                <p className="text-xl font-bold">{analysis.estimated_kg} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Severity</p>
                <Badge
                  className={
                    analysis.severity === 'HIGH'
                      ? 'bg-red-100 text-red-700'
                      : analysis.severity === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }
                >
                  {analysis.severity}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        analysis.risk_score > 75 ? 'bg-red-500' : analysis.risk_score > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${analysis.risk_score}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold">{analysis.risk_score} / 100</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Detected materials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detected Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{wasteTypeLabel(mat.type)}</span>
                    <span className="text-sm font-bold">{mat.estimated_kg} kg</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Environmental risk */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Environmental Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <RiskItem icon={Droplets} label="Drain Proximity" value={analysis.near_drain ? `${analysis.drain_distance}m` : 'Far'} risk={analysis.near_drain} />
                <RiskItem icon={Users} label="Public Area" value={analysis.public_area ? 'Yes' : 'No'} risk={analysis.public_area} />
                <RiskItem icon={AlertTriangle} label="Overflow Risk" value={analysis.overflow_risk} risk={analysis.overflow_risk === 'High'} />
                <RiskItem icon={AlertTriangle} label="Health Risk" value={analysis.health_risk} risk={analysis.health_risk === 'Medium' || analysis.health_risk === 'High'} />
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Brain className="h-4 w-4" /> AI Recommendation
              </p>
              <p className="mt-2 text-sm text-foreground">{analysis.recommendation}</p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetForm} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} size="lg" className="flex-1 gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="mx-auto max-w-2xl animate-scale-in">
          <Card className="overflow-hidden">
            <div className="flex flex-col items-center p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">Report Submitted</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your waste report has been received and AI-analyzed.</p>

              <div className="mt-6 w-full space-y-3 rounded-xl bg-muted/50 p-6 text-left">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Report ID</span>
                  <span className="text-sm font-bold">{submittedReportId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-700">AI Verified</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <Badge className={analysis ? (analysis.risk_score > 80 ? 'bg-red-100 text-red-700' : analysis.risk_score > 60 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700') : ''}>
                    {analysis ? (analysis.risk_score > 80 ? 'CRITICAL' : analysis.risk_score > 60 ? 'HIGH' : 'MEDIUM') : ''}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimated Response</span>
                  <span className="text-sm font-bold">Within 4 hours</span>
                </div>
              </div>

              <CityMap
                markers={[
                  { id: 'submitted', latitude, longitude, priority: (analysis?.risk_score ?? 0) > 80 ? 'CRITICAL' : 'HIGH', reportId: submittedReportId },
                ]}
                height="200px"
                showLegend={false}
                centerLat={latitude}
                centerLng={longitude}
                className="mt-4 w-full"
              />

              <div className="mt-6 flex w-full gap-3">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Report Another
                </Button>
                <Button onClick={() => navigate('/citizen/reports')} className="flex-1 gap-2">
                  Track Report <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function RiskItem({ icon: Icon, label, value, risk }: { icon: typeof MapPin; label: string; value: string; risk: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${risk ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
