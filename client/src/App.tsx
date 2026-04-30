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

const AppContent = () => {
  const { user, loading, activeRole, memberships } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const isInviteFlow = urlParams.has("token");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="space-y-4 w-full max-w-4xl">
          <Skeleton className="h-12 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  // Invitation flow handles its own login/signup state via URL param
  if (isInviteFlow) {
    if (!user && urlParams.get("auth") === "true") {
      return <AuthForms />;
    }
    return <InvitePage />;
  }

  return (
    <Routes>
      <Route path="/" element={
        !user ? <LandingPage /> :
        memberships.length === 0 ? <Onboarding /> :
        activeRole === "supplier" ? <SupplierDashboard /> :
        activeRole === "employee" ? <EmployeeDashboard /> :
        activeRole === "retailer" ? <RetailerDashboard /> :
        (
          <div className="flex h-screen items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-zinc-500">Your account is pending activation in this organization.</p>
              <button onClick={() => window.location.reload()} className="text-primary underline">Reload Page</button>
            </div>
          </div>
        )
      } />
      
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthForms />} />
      
      {activeRole === "supplier" && user && (
        <>
          <Route path="/dashboard/retailers/:id" element={<RetailerDetail />} />
          <Route path="/dashboard/employees/:id" element={<EmployeeDetail />} />
        </>
      )}

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
