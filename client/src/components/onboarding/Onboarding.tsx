import React, { useState } from "react";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import api from "@/services/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package2, Building2, Store, Truck, ArrowRight, ShieldCheck, Plus, Search, Loader2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Navigate } from "react-router-dom";

type OnboardingStep = "role-selection" | "org-setup" | "finalizing";

export const Onboarding = () => {
  const { user, memberships, refreshContext } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("role-selection");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Redirect if already onboarded
  if (memberships.length > 0) {
    return <Navigate to="/" replace />;
  }
  
  // Org details
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");

  const roles = [
    { 
      id: "supplier", 
      title: "Supplier", 
      desc: "Manufacturer or wholesale distributor managing inventory and orders.",
      icon: Building2,
      accent: "bg-blue-50 text-blue-600 border-blue-100"
    },
    { 
      id: "retailer", 
      title: "Retailer", 
      desc: "Storefront or business receiving orders and processing payments.",
      icon: Store,
      accent: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    { 
      id: "employee", 
      title: "Delivery Staff", 
      desc: "Delivery person responsible for transporting products and confirming deliveries.",
      icon: Truck,
      accent: "bg-amber-50 text-amber-600 border-amber-100"
    }
  ];

  const handleRoleSelection = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    setStep("org-setup");
  };

  const handleCompleteOnboarding = async () => {
    if (!orgName.trim() && selectedRole !== "employee") {
      toast.error("Please enter an organization name");
      return;
    }
    
    setLoading(true);
    try {
      if (selectedRole !== "employee") {
        // Use backend API to create organization and membership atomically
        await api.post("/organizations", {
          name: orgName,
          description: orgDescription,
          type: selectedRole,
          settings: {
            theme: "neutral",
            currency: "USD"
          }
        });
      } else {
        // Employees join existing orgs via invite, but for now we might need 
        // to create a "placeholder" or just let them wait for an invite.
        // If they chose "employee", they are basically awaiting an invite.
        // We can create a user record or just let them stay in onboarding until invited.
        // Actually, the app logic seems to expect users to HAVE a role.
        // For employees, we'll just skip org creation.
        toast.info("Account set as Employee. You'll need an invite link to join an organization.");
      }

      toast.success("Setup complete!");
      // Refresh context via the function from useAuth
      await refreshContext();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to complete setup");
    } finally {
      setLoading(false);
      window.location.reload(); // Simple way to trigger context refresh for now
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xl mx-auto rotate-3 mb-4">
            <Package2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight">Welcome to TracksUp</h1>
          <p className="text-zinc-500 font-medium max-w-md mx-auto mt-2">
            Your account is ready, but you haven't chosen a role yet. 
            Select your account type to get started.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "role-selection" && (
            <motion.div
              key="role-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {roles.map((role) => (
                <Card 
                  key={role.id}
                  className={`cursor-pointer transition-all border-2 rounded-[2rem] overflow-hidden ${
                    selectedRole === role.id 
                      ? "border-zinc-900 shadow-xl bg-white scale-[1.02]" 
                      : "border-transparent bg-white/50 hover:bg-white hover:border-zinc-200"
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="pt-10 pb-4 flex flex-col items-center text-center">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-transform ${selectedRole === role.id ? "scale-110" : ""} ${role.accent}`}>
                      <role.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl font-black uppercase italic tracking-tight">{role.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center px-8 pb-10">
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">{role.desc}</p>
                  </CardContent>
                </Card>
              ))}
              <div className="md:col-span-3 flex justify-center mt-8">
                <Button 
                  onClick={handleRoleSelection}
                  className="rounded-2xl h-14 px-12 font-black uppercase italic tracking-widest text-base shadow-lg transition-all group"
                  disabled={!selectedRole}
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "org-setup" && (
            <motion.div
              key="org-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl mx-auto"
            >
              <Card className="border-zinc-200 shadow-sm rounded-[2rem] p-4">
                <CardHeader>
                  <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Organization Details</CardTitle>
                  <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-zinc-400">
                    {selectedRole === "employee" ? "Verification Required" : "Identity Setup"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedRole === "employee" ? (
                     <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-4 text-amber-900 font-black uppercase italic tracking-tight text-lg">
                           <ShieldCheck className="h-6 w-6" />
                           Delivery Driver
                        </div>
                        <p className="text-amber-700 font-medium text-sm">
                           As a delivery driver, you will join as an independent professional. 
                           You can be invited to various organizations by suppliers 
                           using an invite code.
                        </p>
                     </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Business Name</Label>
                        <Input 
                          placeholder="e.g. Acme Distribution" 
                          className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 px-4 font-bold"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description (Optional)</Label>
                        <Input 
                          placeholder="Wholesale distributor for hardware..." 
                          className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 px-4 font-bold"
                          value={orgDescription}
                          onChange={(e) => setOrgDescription(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="pt-6 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 rounded-2xl font-black uppercase italic tracking-widest border-2"
                    onClick={() => setStep("role-selection")}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-[2] h-14 rounded-2xl font-black uppercase italic tracking-widest text-base shadow-xl"
                    onClick={handleCompleteOnboarding}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-300 italic">
            System Status: Ready
          </p>
          
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
