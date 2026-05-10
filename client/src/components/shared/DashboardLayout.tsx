import React from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Package2, 
  LayoutDashboard, 
  Users, 
  Store, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  PieChart,
  Truck,
  Box,
  FileText,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { motion } from "motion/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  title,
  subtitle,
  actions
}) => {
  const { user, activeRole, activeOrg } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "All Orders", icon: Box },
    { id: "outstanding", label: "Pending Payments", icon: PieChart },
    ...(activeRole === 'supplier' ? [
      { id: "network", label: "Partners", icon: Users },
      { id: "products", label: "My Products", icon: Package2 },
      { id: "invites", label: "Invites", icon: Store },
      { id: "insights", label: "Performance", icon: PieChart }
    ] : []),
    ...(activeRole === 'retailer' ? [
      { id: "suppliers", label: "My Suppliers", icon: Users },
      { id: "marketplace", label: "Marketplace", icon: Store },
      { id: "invoices", label: "Order History", icon: FileText }
    ] : []),
    ...(activeRole === 'employee' ? [
       { id: "history", label: "Work History", icon: History }
    ] : [])
  ];

  return (
    <div className="flex h-screen bg-zinc-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-zinc-200 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3">
            <Package2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tight">TracksUp</h1>
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{activeRole} account</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="px-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Operations</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeTab === item.id 
                  ? "bg-zinc-900 text-white shadow-md translate-x-1" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-zinc-100 space-y-4">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="h-10 w-10 rounded-full bg-zinc-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-zinc-900 uppercase italic">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-tight truncate">{user?.name || "Agent"}</p>
              <p className="text-[10px] font-bold text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 rounded-xl h-12 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-black uppercase tracking-widest"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50">
        {/* Header */}
        <header className="h-20 border-b border-zinc-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-10 transition-colors">
          <div className="flex items-center gap-4">
            <div className="space-y-0.5">
               <h2 className="text-lg font-black uppercase tracking-tight italic leading-none">
                 {title || activeOrg?.name || "Dashboard"}
               </h2>
               {subtitle && <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-6">
            {actions && <div className="hidden md:block">{actions}</div>}
            <div className="hidden lg:flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 bg-zinc-100 border-none rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-zinc-900 w-48 transition-all"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-rose-500 rounded-full border border-white shadow-sm"></span>
              </Button>
              <div className="h-8 w-[1px] bg-zinc-100 mx-2"></div>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`rounded-xl transition-all ${activeTab === 'settings' ? 'bg-zinc-900 text-white shadow-lg' : 'hover:bg-zinc-100'}`}
                onClick={() => onTabChange?.("settings")}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
