import React, { useState, useEffect } from "react";
import { User, Building, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const { user, activeOrg, activeRole } = useAuth();
  const [userName, setUserName] = useState(user?.name || "");
  const [orgName, setOrgName] = useState(activeOrg?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  useEffect(() => {
    if (user) setUserName(user.name);
    if (activeOrg) setOrgName(activeOrg.name);
  }, [user, activeOrg, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Update User Profile
      if (userName !== user.name) {
        await updateDoc(doc(db, "users", user.uid), {
          name: userName
        });
      }

      // Update Org Name (only for supplier)
      if (activeRole === "supplier" && activeOrg && orgName !== activeOrg.name) {
        await updateDoc(doc(db, "organizations", activeOrg.id), {
          name: orgName
        });
      }

      toast.success("Settings updated successfully");
      setIsOpen(false);
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and organization settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 border-b pb-2">
              <User className="h-4 w-4" />
              <span>Personal Profile</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userName">Full Name</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider">Email Address</Label>
              <p className="text-sm text-zinc-900 font-medium">{user?.email}</p>
            </div>
          </div>

          {activeRole === "supplier" && activeOrg && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 border-b pb-2">
                <Building className="h-4 w-4" />
                <span>Organization Details</span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider">Plan</Label>
                <p className="text-sm text-zinc-900 font-medium capitalize">Standard Distribution</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
            {!isSaving && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
