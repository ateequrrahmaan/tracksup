import React from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { AuthForms } from "./components/auth/AuthForms";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupplierDashboard } from "./components/supplier/SupplierDashboard";
import { EmployeeDashboard } from "./components/employee/EmployeeDashboard";
import { RetailerDashboard } from "./components/retailer/RetailerDashboard";
import { Onboarding } from "./components/onboarding/Onboarding";
import { InvitePage } from "./components/invite/InvitePage";
import { Skeleton } from "@/components/ui/skeleton";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RetailerDetail } from "./components/supplier/RetailerDetail";
import { EmployeeDetail } from "./components/supplier/EmployeeDetail";
import { LandingPage } from "./components/landing/LandingPage";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { DashboardLayout } from "./components/shared/DashboardLayout";
import { SettingsView } from "./components/shared/SettingsView";

const SettingsViewWrapper = () => (
  <DashboardLayout title="System Settings" subtitle="Operative Configuration">
    <SettingsView />
  </DashboardLayout>
);

const AppContent = () => {
  const { user, loading, activeRole, memberships } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-zinc-50">
        <div className="h-1.5 w-48 bg-zinc-200 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-900 animate-[loading_1.5s_ease-in-out_infinite] w-1/3" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 animate-pulse italic">Synchronizing Buffer...</p>
      </div>
    );
  }

  // Root redirect logic based on auth state
  const getRootRedirect = () => {
    if (!user) return <LandingPage />;
    if (memberships.length === 0) return <Navigate to="/onboarding" replace />;
    
    switch (activeRole) {
      case "supplier": return <Navigate to="/supplier" replace />;
      case "employee": return <Navigate to="/employee" replace />;
      case "retailer": return <Navigate to="/retailer" replace />;
      default: return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-zinc-500">Your account is waiting for approval.</p>
            <button onClick={() => window.location.reload()} className="text-primary underline">Refresh</button>
          </div>
        </div>
      );
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={getRootRedirect()} />
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthForms />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* Protected Routes - General */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={memberships.length > 0 ? <Navigate to="/" replace /> : <Onboarding />} />
      </Route>

      {/* Protected Routes - Supplier */}
      <Route element={<ProtectedRoute allowedRoles={["supplier"]} />}>
        <Route path="/supplier/*" element={<SupplierDashboard />} />
        {/* Detail pages can remain as siblings or sub-routes */}
        <Route path="/supplier/retailers/:id" element={<RetailerDetail />} />
        <Route path="/supplier/employees/:id" element={<EmployeeDetail />} />
      </Route>

      {/* Protected Routes - Employee */}
      <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
        <Route path="/employee/*" element={<EmployeeDashboard />} />
      </Route>

      {/* Protected Routes - Retailer */}
      <Route element={<ProtectedRoute allowedRoles={["retailer"]} />}>
        <Route path="/retailer/*" element={<RetailerDashboard />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/settings" element={<SettingsViewWrapper />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <AppContent />
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
