import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { SignInPage } from '@/pages/SignInPage';
import { CitizenDashboard } from '@/pages/citizen/CitizenDashboard';
import { ReportWaste } from '@/pages/citizen/ReportWaste';
import { MyReports } from '@/pages/citizen/MyReports';
import { NearbyWaste } from '@/pages/citizen/NearbyWaste';
import { RewardsPage } from '@/pages/citizen/RewardsPage';
import { CitizenImpact } from '@/pages/citizen/CitizenImpact';
import { OfficerDashboard } from '@/pages/officer/OfficerDashboard';
import { CityMapPage } from '@/pages/officer/CityMapPage';
import { HotspotAnalytics } from '@/pages/officer/HotspotAnalytics';
import { PriorityEngine } from '@/pages/officer/PriorityEngine';
import { RouteOptimization } from '@/pages/officer/RouteOptimization';
import { DrainMonitor } from '@/pages/officer/DrainMonitor';
import { WorkerDashboard } from '@/pages/worker/WorkerDashboard';
import { WorkerTaskDetail } from '@/pages/worker/WorkerTaskDetail';
import { RecyclerDashboard } from '@/pages/recycler/RecyclerDashboard';
import { MaterialMarketplace } from '@/pages/recycler/MaterialMarketplace';
import { MyPickups } from '@/pages/recycler/MyPickups';
import { CircularEconomy } from '@/pages/recycler/CircularEconomy';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ProfilePage } from '@/pages/ProfilePage';
import type { Role } from '@/types';
import type { NavItem } from '@/components/DashboardLayout';

function RoleDashboard() {
  const { profile } = useAuth();
  if (!profile) return <Navigate to="/signin" replace />;
  return <DashboardRouter role={profile.role} />;
}

function DashboardRouter({ role }: { role: Role }) {
  switch (role) {
    case 'citizen':
      return <Navigate to="/citizen" replace />;
    case 'officer':
      return <Navigate to="/officer" replace />;
    case 'worker':
      return <Navigate to="/worker" replace />;
    case 'recycler':
      return <Navigate to="/recycler" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/signin" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/dashboard" element={<RoleDashboard />} />

          {/* Citizen routes */}
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/citizen/report" element={<ReportWaste />} />
          <Route path="/citizen/reports" element={<MyReports />} />
          <Route path="/citizen/nearby" element={<NearbyWaste />} />
          <Route path="/citizen/rewards" element={<RewardsPage />} />
          <Route path="/citizen/impact" element={<CitizenImpact />} />

          {/* Officer routes */}
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/officer/map" element={<CityMapPage />} />
          <Route path="/officer/hotspots" element={<HotspotAnalytics />} />
          <Route path="/officer/priority" element={<PriorityEngine />} />
          <Route path="/officer/routes" element={<RouteOptimization />} />
          <Route path="/officer/drains" element={<DrainMonitor />} />

          {/* Worker routes */}
          <Route path="/worker" element={<WorkerDashboard />} />
          <Route path="/worker/task/:reportId" element={<WorkerTaskDetail />} />

          {/* Recycler routes */}
          <Route path="/recycler" element={<RecyclerDashboard />} />
          <Route path="/recycler/marketplace" element={<MaterialMarketplace />} />
          <Route path="/recycler/pickups" element={<MyPickups />} />
          <Route path="/recycler/circular" element={<CircularEconomy />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
export type { NavItem };
