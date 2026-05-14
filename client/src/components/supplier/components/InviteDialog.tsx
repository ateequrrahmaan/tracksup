import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, ShieldCheck } from "lucide-react";

interface InviteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onSubmit 
}) => {
  const [role, setRole] = React.useState("employee");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl sm:max-w-[450px]">
        <form onSubmit={onSubmit}>
          <input type="hidden" name="role" value={role} />
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-6 mx-auto">
               <UserPlus className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-center">Provision Entry Key</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center mt-2">
              Generate a secure access link for a new operative
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-10">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Target Email Address</Label>
              <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                 <Input 
                   id="email" 
                   name="email" 
                   type="email" 
                   placeholder="agent@network.io" 
                   required 
                   className="h-14 rounded-2xl border-none bg-zinc-50 px-12 font-bold focus:ring-2 focus:ring-zinc-900"
                 />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Operational Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-zinc-50 px-6 font-bold shadow-none">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="employee" className="font-bold uppercase text-[10px] tracking-widest py-3">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="h-4 w-4 text-amber-500" />
                       Delivery Agent
                    </div>
                  </SelectItem>
                  <SelectItem value="retailer" className="font-bold uppercase text-[10px] tracking-widest py-3">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="h-4 w-4 text-emerald-500" />
                       Retail Node
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-[11px] bg-zinc-900 text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              Initialize Access Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
