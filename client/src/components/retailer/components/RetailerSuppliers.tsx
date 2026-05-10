import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Membership, Organization } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, ArrowRight, Plus, Mail, ShieldCheck, Globe, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, setDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";

interface RetailerSuppliersProps {
  onViewMarketplace?: (supplierId: string) => void;
}

export const RetailerSuppliers: React.FC<RetailerSuppliersProps> = ({ onViewMarketplace }) => {
  const { memberships, activeOrg, switchOrg, firebaseUser } = useAuth();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter memberships where the user is a retailer
  const retailerMemberships = memberships.filter(m => m.role === 'retailer');

  const handleConnectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    
    setIsSubmitting(true);
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 48); // 48h for retailers to invite suppliers

    try {
      // In this flow, a Retailer invites a Supplier to connect.
      // This creates an invite that, when accepted, should probably link the Retailer to the Supplier's org
      // OR create a new shared space. 
      // For simplicity in this existing multi-tenant model, we'll treat it as requesting the Supplier 
      // to join a network or vice versa.
      // The user said: "retailer need to invite this onlt for retailer".
      
      await setDoc(doc(db, "invites", token), {
        email: inviteEmail,
        role: "supplier", // The person invited will be a supplier
        organizationId: activeOrg?.id || "standalone",
        token,
        status: "pending",
        expiresAt: Timestamp.fromDate(expiry),
        invitedBy: firebaseUser.uid,
        invitedByName: firebaseUser.displayName || firebaseUser.email,
        createdAt: serverTimestamp(),
        type: "connection_request" 
      });

      const link = `${window.location.protocol}//${window.location.host}/?token=${token}`;
      await navigator.clipboard.writeText(link);
      
      toast.success("Invite link generated. Link copied to clipboard.");
      setIsInviteOpen(false);
      setInviteEmail("");
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("Error creating invite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">Supplier Network</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1 italic">
            Your connected suppliers and distribution partners
          </p>
        </div>
        <Button 
          onClick={() => setIsInviteOpen(true)}
          className="rounded-2xl h-14 px-8 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus className="mr-2 h-5 w-5" /> Invite Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {retailerMemberships.length > 0 ? (
          retailerMemberships.map((mem) => {
            const isActive = activeOrg?.id === mem.organizationId;
            return (
              <Card 
                key={mem.id} 
                className={`rounded-[2.5rem] border-none shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-[1.03] flex flex-col ${isActive ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}
              >
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 duration-500 ${isActive ? 'bg-white/10' : 'bg-zinc-100'}`}>
                      <Store className={`h-8 w-8 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    </div>
                    {isActive && (
                      <Badge className="bg-emerald-500 text-black font-black uppercase text-[8px] tracking-[0.2em] h-6 px-3 border-none">
                        Active Account
                      </Badge>
                    )}
                  </div>
                  <div className="mt-6">
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter truncate">
                      {mem.organizationId === activeOrg?.id ? activeOrg.name : `Supplier ${mem.organizationId.slice(0,4).toUpperCase()}`}
                    </CardTitle>
                    <CardDescription className={`text-[10px] font-bold uppercase tracking-widest italic mt-1 ${isActive ? "text-white/60" : "text-zinc-500"}`}>
                      Your Role: {mem.role}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0 flex-grow flex flex-col justify-between">
                  <div className="space-y-4 mt-6">
                     <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${isActive ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-100'}`}>
                        <ShieldCheck className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Private Connection</span>
                     </div>
                     <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${isActive ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-100'}`}>
                        <Globe className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Verified Partner</span>
                     </div>
                  </div>
                  
                  <div className="mt-8 flex flex-col gap-3">
                    {onViewMarketplace && (
                      <Button 
                        onClick={() => onViewMarketplace(mem.organizationId)}
                        variant="secondary"
                        className={`w-full h-14 rounded-2xl font-black uppercase italic tracking-widest transition-all ${isActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}
                      >
                        Browse Products <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                    
                    {!isActive ? (
                      <Button 
                        onClick={() => switchOrg(mem.organizationId)}
                        className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-lg"
                      >
                        Switch Account
                      </Button>
                    ) : (
                      <Button 
                        disabled
                        className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      >
                        Active Account
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
            <div className="col-span-full py-32 text-center flex flex-col items-center justify-center opacity-30 select-none">
            <LinkIcon className="h-20 w-20 mb-6 animate-pulse" />
            <h4 className="text-xl font-black uppercase italic tracking-tighter">No Active Connections</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2">Invite a supplier to get started</p>
          </div>
        )}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl sm:max-w-[500px]">
          <form onSubmit={handleConnectRequest}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Connect to Supplier</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  Send an invitation to a new supply partner
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-6 py-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Supplier Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input 
                    required
                    type="email"
                    placeholder="logistics@supplier.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-16 pl-14 rounded-2xl bg-zinc-50 border-none font-bold text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100">
                <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest leading-relaxed">
                  Note: This will create an invite link. Send this link to your supplier to connect.
                </p>
              </div>
            </div>
            <DialogFooter className="sm:justify-between gap-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsInviteOpen(false)}
                className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-2xl h-14 px-8 flex-1 font-black uppercase italic tracking-widest bg-zinc-900 text-white shadow-xl"
              >
                {isSubmitting ? "Creating..." : "Create Invite Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
