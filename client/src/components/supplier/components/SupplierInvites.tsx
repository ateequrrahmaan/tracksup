import React from "react";
import { Invite } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface SupplierInvitesProps {
  invites: Invite[];
  onInviteOpen: () => void;
  onCopyLink: (token: string) => void;
  onDeleteInvite: (invite: Invite) => void;
}

export const SupplierInvites: React.FC<SupplierInvitesProps> = ({
  invites,
  onInviteOpen,
  onCopyLink,
  onDeleteInvite
}) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.1),transparent)]" />
        <div className="relative z-10">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Node Expansion Registry</h3>
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-500 mt-3 italic">Provision and coordinate organizational operational entryways</p>
        </div>
        <Button onClick={onInviteOpen} className="relative z-10 rounded-2xl h-16 px-10 bg-white text-zinc-900 hover:bg-zinc-100 font-black uppercase text-[11px] tracking-[0.2em] shadow-xl group-hover:scale-105 transition-all mt-8 md:mt-0">
           <Plus className="mr-4 h-6 w-6" /> Initialize Entry Key
        </Button>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow className="h-16 border-none">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-12">Authorized Entity</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-12">Operational Class</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-12">Temporal Decay</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-12">Administrative Vector</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={`invite-row-${invite.id || invite.token}`} className="h-24 hover:bg-zinc-50/50 transition-all group">
                <TableCell className="px-12">
                    <div className="flex flex-col">
                        <span className="font-black uppercase italic text-sm text-zinc-900">{invite.email}</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Token: {invite.token.substring(0, 8)}...</span>
                    </div>
                </TableCell>
                <TableCell className="px-12 capitalize">
                   <Badge className={`rounded-xl h-7 font-black uppercase text-[9px] tracking-widest italic px-4 border-none shadow-sm ${
                       invite.role === 'retailer' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'
                   }`}>
                     {invite.role}
                   </Badge>
                </TableCell>
                <TableCell className="px-12 font-bold text-zinc-400 text-xs italic uppercase tracking-tighter">
                  {invite.expiresAt?.toDate ? format(invite.expiresAt.toDate(), 'PP p') : 'Syncing...'}
                </TableCell>
                <TableCell className="px-12 text-right">
                  <div className="flex justify-end gap-4">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-zinc-900 hover:text-white text-zinc-300 transition-all shadow-sm" onClick={() => onCopyLink(invite.token)}>
                      <Copy className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-rose-500 hover:text-white text-zinc-300 transition-all shadow-sm" onClick={() => onDeleteInvite(invite)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {invites.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center bg-zinc-50/10">
                   <div className="flex flex-col items-center justify-center opacity-20">
                      <div className="h-20 w-20 rounded-[2rem] border-4 border-dashed border-zinc-300 flex items-center justify-center mb-6">
                        <Users className="h-10 w-10" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Zero active entry keys in distribution sector</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
