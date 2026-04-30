import React from "react";
import { SystemUser } from "@/src/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Store, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupplierNetworkProps {
  employees: SystemUser[];
  retailers: SystemUser[];
  stats: {
    employeePerformance: { name: string, deliveries: number, collected: number }[];
    topRetailers: { name: string, revenue: number }[];
  };
}

export const SupplierNetwork: React.FC<SupplierNetworkProps> = ({
  employees,
  retailers,
  stats
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 italic px-2">Deployed Logistics Operatives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employees.map(emp => (
            <Card key={`network-emp-${emp.uid}`} className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden group hover:scale-[1.03] transition-all duration-500 cursor-pointer" onClick={() => navigate(`/dashboard/employees/${emp.uid}`)}>
                <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-zinc-100 flex items-center justify-center border-4 border-white shadow-inner group-hover:rotate-12 transition-transform duration-500">
                        <Users className="h-10 w-10 text-zinc-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900 group-hover:text-primary transition-colors">{emp.name}</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic mt-0.5">{emp.email}</p>
                        <Badge className="mt-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest h-6 px-3 bg-emerald-500/10 text-emerald-600 border-none italic">Verified Agent</Badge>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-500">
                        <p className="text-[9px] font-black uppercase text-zinc-400 mb-1 tracking-widest italic group-hover:text-zinc-500">Missions</p>
                        <p className="text-2xl font-black italic tracking-tighter">
                        {stats.employeePerformance.find(p => p.name === emp.name)?.deliveries || 0}
                        </p>
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-500">
                        <p className="text-[9px] font-black uppercase text-zinc-400 mb-1 tracking-widest italic group-hover:text-zinc-500">Recouped</p>
                        <p className="text-2xl font-black italic tracking-tighter">
                        ${(stats.employeePerformance.find(p => p.name === emp.name)?.collected || 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ExternalLink className="h-4 w-4" />
                    </div>
                </div>
                </CardContent>
            </Card>
            ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 italic px-2">Affiliated Retail Nodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {retailers.map(ret => (
            <Card key={`network-ret-${ret.uid}`} className="rounded-[2.5rem] border-none shadow-2xl bg-zinc-900 text-white overflow-hidden group hover:scale-[1.03] transition-all duration-500 cursor-pointer" onClick={() => navigate(`/dashboard/retailers/${ret.uid}`)}>
                <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center border-4 border-white/10 shadow-inner group-hover:-rotate-12 transition-transform duration-500">
                        <Store className="h-10 w-10 text-zinc-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white group-hover:text-emerald-400 transition-colors uppercase">{ret.name}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic mt-0.5">{ret.email}</p>
                        <Badge className="mt-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest h-6 px-3 bg-white/5 text-zinc-400 border-none italic">Authorized Shop</Badge>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                <div className="grid grid-cols-1 gap-4 mt-8">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 group-hover:bg-white group-hover:text-zinc-900 transition-all duration-500">
                        <p className="text-[9px] font-black uppercase text-zinc-500 mb-1 tracking-widest italic group-hover:text-zinc-400">Total Lifecycle Revenue</p>
                        <p className="text-3xl font-black italic tracking-tighter">
                        ${(stats.topRetailers.find(p => p.name === ret.name)?.revenue || 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-zinc-900 transition-all">
                        <ExternalLink className="h-4 w-4" />
                    </div>
                </div>
                </CardContent>
            </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
