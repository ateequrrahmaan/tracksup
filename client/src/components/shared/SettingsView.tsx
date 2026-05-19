import React from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Building, Shield, Bell, Lock, LogOut, Coins } from "lucide-react";
import { toast } from "sonner";
import { CURRENCIES } from "@/constants";

export const SettingsView = () => {
  const { user, activeRole, activeOrg, refreshContext, logout } = useAuth();
  const [userName, setUserName] = React.useState(user?.name || "");
  const [orgName, setOrgName] = React.useState(activeOrg?.name || "");
  const [currency, setCurrency] = React.useState(user?.currency || activeOrg?.currency || "USD");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    if (user?.name) setUserName(user.name);
    if (user?.currency) setCurrency(user.currency);
  }, [user?.name, user?.currency]);

  React.useEffect(() => {
    if (activeOrg?.name) setOrgName(activeOrg.name);
    if (!user?.currency && activeOrg?.currency) setCurrency(activeOrg.currency);
  }, [activeOrg?.name, activeOrg?.currency, user?.currency]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Update Personal Data
      if (userName !== user?.name || currency !== user?.currency) {
        await api.patch("/auth/me", { 
          name: userName,
          currency: currency 
        });
      }

      // 2. Update Org Data (if owner/admin)
      if (activeOrg && (orgName !== activeOrg.name || (activeRole !== 'employee' && currency !== activeOrg.currency))) {
        await api.patch(`/organizations/${activeOrg.id}`, { 
          name: orgName,
          currency: currency
        });
      }

      await refreshContext?.();
      toast.success("Settings updated successfully.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900">Settings</h2>
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">User Profile & Preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-zinc-900 p-10 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.2),transparent)]" />
              <div className="relative z-10 flex items-center gap-8">
                <div className="h-24 w-24 rounded-[2rem] bg-white text-zinc-900 flex items-center justify-center text-4xl font-black italic shadow-2xl border-4 border-white/20">
                  {userName?.charAt(0) || "A"}
                </div>
                <div>
                  <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">{userName || "Agent"}</CardTitle>
                  <CardDescription className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic shadow-sm">
                    {activeRole} • Verified
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                      <Input 
                        value={userName} 
                        onChange={(e) => setUserName(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus:ring-zinc-900 transition-all font-bold text-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input value={user?.email || ""} className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-200 font-bold text-sm" disabled />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                      {activeRole === 'retailer' ? 'Shop Name' : 'Organization Name'}
                    </Label>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                      <Input 
                        value={orgName} 
                        onChange={(e) => setOrgName(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus:ring-zinc-900 transition-all font-bold text-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Display Currency</Label>
                    <div className="relative group">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors z-10" />
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="pl-12 h-14 rounded-2xl bg-zinc-50 border-zinc-100 focus:ring-zinc-900 transition-all font-bold text-sm">
                          <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="font-bold">
                              {c.code} ({c.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-zinc-900" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Account Type</p>
                        <p className="text-base font-black italic uppercase tracking-tight capitalize">{activeRole}</p>
                      </div>
                   </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full md:w-auto px-10 h-14 rounded-2xl bg-zinc-900 text-white font-black uppercase tracking-widest text-[11px] italic shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-[2.5rem] border-none shadow-2xl bg-zinc-950 text-white overflow-hidden p-8">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-8">Preferences</h3>
              <div className="space-y-6">
                 {[
                   { icon: Bell, label: "System Notifications", active: true },
                   { icon: Lock, label: "Biometric Login", active: false },
                   { icon: Mail, label: "Email Reports", active: true }
                 ].map((opt, i) => (
                   <div key={`opt-${i}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <opt.icon className="h-5 w-5 text-zinc-400" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">{opt.label}</span>
                      </div>
                      <div className={`h-6 w-10 rounded-full p-1 transition-colors ${opt.active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                        <div className={`h-4 w-4 rounded-full bg-white transition-transform ${opt.active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-8">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-4 text-zinc-900">System Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Status</span>
                   <span className="text-xs font-black italic">Active</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Latency</span>
                   <span className="text-xs font-black italic">4ms</span>
                </div>
                <div className="flex justify-between items-center py-3">
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Version</span>
                   <span className="text-xs font-black italic">V4.2.0</span>
                </div>
              </div>
           </Card>

           <Button 
               onClick={handleLogout}
               variant="outline"
               disabled={isLoggingOut}
               className="w-full h-16 rounded-[2rem] border-rose-100 bg-rose-50/30 text-rose-600 font-black uppercase tracking-widest text-[11px] italic hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all group mt-8 disabled:opacity-50"
            >
              <LogOut className={`mr-3 h-4 w-4 transition-all ${isLoggingOut ? 'animate-pulse' : 'group-hover:scale-110'}`} />
              {isLoggingOut ? "Terminating..." : "Terminate Session"}
            </Button>
        </div>
      </div>
    </div>
  );
};
