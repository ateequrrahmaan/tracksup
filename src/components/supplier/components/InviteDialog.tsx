import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface InviteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ isOpen, onOpenChange, onSubmit }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-10 border-none shadow-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                    <UserPlus className="h-6 w-6" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Provision Entry</DialogTitle>
                    <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Initialize a new organizational linkage</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          <div className="grid gap-8 py-8">
            <div className="grid gap-3">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Target operative email</Label>
              <Input 
                id="email"
                name="email" 
                type="email" 
                placeholder="operative@tracksup.nexus" 
                required 
                className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-xs uppercase italic tracking-widest px-6"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Structural Role Designation</Label>
              <Select name="role" required defaultValue="employee">
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-none font-bold text-xs uppercase italic tracking-widest px-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="employee" className="font-bold uppercase text-[10px] tracking-widest py-3">LOGISTICS OPERATIVE</SelectItem>
                  <SelectItem value="retailer" className="font-bold uppercase text-[10px] tracking-widest py-3">RETAIL SHOP NODE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] italic border-zinc-200" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] italic bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl">
              Construct Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
