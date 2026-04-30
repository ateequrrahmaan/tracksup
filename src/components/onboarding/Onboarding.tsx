import React, { useState } from "react";
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/src/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package2, Plus, ArrowRight, UserPlus, LogOut, CheckCircle2, Building2, ShieldCheck, Mail } from "lucide-react";
import { motion } from "motion/react";

export const Onboarding = () => {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !user) return;
    
    setLoading(true);
    try {
      const orgRef = await addDoc(collection(db, "organizations"), {
        name: orgName,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "memberships", `${user.uid}_${orgRef.id}`), {
        userId: user.uid,
        organizationId: orgRef.id,
        role: "supplier",
        status: "active",
      });

      toast.success("Organization established!");
    } catch (error) {
      toast.error("Failed to initialize organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-12 md:grid-cols-5">
        
        {/* Left Side: Brand & Context */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl rotate-3 mb-2">
              <Package2 className="h-7 w-7" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 uppercase italic leading-none">Initialization<br/><span className="text-zinc-400">Required</span></h1>
              <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                Welcome, <span className="text-zinc-900 font-bold underline decoration-zinc-200">{user?.name}</span>. 
                Your profile is active, but you are not currently associated with an operational node.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm font-bold text-zinc-600 uppercase tracking-widest">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Identity Verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                <div className="h-4 w-4 rounded-full border-2 border-zinc-200" />
                <span>Establish Organization</span>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-200 max-w-xs">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Logged in as</p>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900 truncate">{user?.email}</span>
                </div>
                <button onClick={() => signOut(auth)} className="text-zinc-400 hover:text-rose-500 transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Options */}
        <div className="md:col-span-3 grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-zinc-200 shadow-xl rounded-3xl overflow-hidden bg-white hover:border-zinc-300 transition-colors">
              <CardHeader className="bg-zinc-900 text-white pb-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight italic">Provision Network</CardTitle>
                </div>
                <CardDescription className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                  Act as a primary supplier and build your distribution ecosystem.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleCreateOrg} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="orgName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Organization Nomenclature</Label>
                    <Input 
                      id="orgName" 
                      placeholder="e.g. OMNI LOGISTICS CORP" 
                      required 
                      className="rounded-2xl h-14 text-lg font-bold border-zinc-200 bg-zinc-50 focus:bg-white transition-all px-6"
                      value={orgName} 
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <Button className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]" type="submit" disabled={loading}>
                    Initialize Operation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="bg-zinc-50/50 flex items-center gap-3 p-4 border-t border-zinc-100">
                <ShieldCheck className="h-4 w-4 text-zinc-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Owner-level permissions will be granted to your profile.</span>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed border-2 border-zinc-200 bg-transparent rounded-3xl overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <UserPlus className="h-5 w-5 text-zinc-500" />
                  <CardTitle className="text-lg font-bold text-zinc-700">Join via Authorization</CardTitle>
                </div>
                <CardDescription className="font-medium text-zinc-500">
                  Expected to be a Retailer or Agent? Check your encrypted communication channels for an invite link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 rounded-2xl bg-zinc-100/50 border border-zinc-200 border-dashed text-center space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Awaiting Link</p>
                  <p className="text-sm text-zinc-600 font-medium italic">
                    Invitation tokens are bound to specific email addresses. Ensure you are logged in correctly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-30 select-none pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node ID: {user?.uid.substring(0, 8)}</span>
        <div className="h-1 w-1 rounded-full bg-zinc-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Region: Global Edge</span>
        <div className="h-1 w-1 rounded-full bg-zinc-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Status: Nominal</span>
      </div>
    </div>
  );
};
