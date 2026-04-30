import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Package2, 
  LayoutDashboard, 
  Package, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  Building2,
  Bell,
  Search,
  Truck,
  Store,
  History,
  BarChart3,
  UserPlus,
  FileText,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { SettingsDialog } from "./SettingsDialog";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const SUPPLIER_ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: Package, label: "Orders", id: "orders" },
  { icon: BarChart3, label: "Insights", id: "insights" },
  { icon: Users, label: "Retailers", id: "network" },
  { icon: UserPlus, label: "Invites", id: "invites" },
  { icon: CreditCard, label: "Outstanding", id: "outstanding" },
  { icon: SettingsIcon, label: "Settings", id: "settings" },
];

const RETAILER_ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: Store, label: "My Shipments", id: "tracking" },
  { icon: History, label: "Order Log", id: "history" },
  { icon: CreditCard, label: "Ledger", id: "outstanding" },
  { icon: FileText, label: "Invoices", id: "invoices" },
  { icon: SettingsIcon, label: "Settings", id: "settings" },
];

const EMPLOYEE_ITEMS: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: Truck, label: "Deliveries", id: "deliveries" },
  { icon: Calculator, label: "Collections", id: "collections" },
  { icon: History, label: "Archive", id: "history" },
  { icon: SettingsIcon, label: "Settings", id: "settings" },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  title, 
  subtitle,
  actions 
}) => {
  const { user, activeOrg, activeRole, memberships, switchOrg } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getSidebarItems = () => {
    switch (activeRole) {
      case "supplier": return SUPPLIER_ITEMS;
      case "retailer": return RETAILER_ITEMS;
      case "employee": return EMPLOYEE_ITEMS;
      default: return [];
    }
  };

  const filteredItems = getSidebarItems();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleTabClick = (id: string) => {
    if (id === "settings") {
      setIsSettingsOpen(true);
    } else {
      onTabChange(id);
    }
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 text-zinc-400 transition-transform duration-300 transform 
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-zinc-900 shadow-xl rotate-3">
                <Package2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white uppercase italic">TracksUp</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{activeRole} terminal</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400" onClick={toggleSidebar}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all
                  ${activeTab === item.id 
                    ? "bg-white text-zinc-900 shadow-lg translate-x-1" 
                    : "hover:bg-white/5 hover:text-zinc-200"}
                `}
              >
                <item.icon className={`h-4 w-4 ${activeTab === item.id ? "text-zinc-900" : "text-zinc-500"}`} />
                {item.label}
              </button>
            ))}
          </div>

          {/* User Section in Sidebar (Bottom) */}
          <div className="p-4 mt-auto">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-black">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black text-white truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-zinc-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl px-2 h-10 font-black uppercase text-[10px] tracking-widest"
                onClick={() => signOut(auth)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Terminate Session
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-zinc-100 px-6 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={toggleSidebar}>
              <Menu className="h-6 w-6" />
            </Button>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-0.5">{subtitle || activeTab}</h2>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase italic">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search - Desktop only for now */}
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-zinc-900/5 transition-all"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative rounded-xl bg-zinc-50 hover:bg-zinc-100 h-11 w-11 shadow-sm" onClick={() => setIsSettingsOpen(true)}>
              <SettingsIcon className="h-5 w-5 text-zinc-600" />
            </Button>

            <Button variant="ghost" size="icon" className="relative rounded-xl bg-zinc-50 hover:bg-zinc-100 h-11 w-11 shadow-sm">
              <Bell className="h-5 w-5 text-zinc-600" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
            </Button>
          </div>
        </header>

        {/* Primary Action Button Area (for view-specific actions) */}
        {actions && (
          <div className="px-6 lg:px-8 py-4 bg-white border-b border-zinc-50 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
            {actions}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </div>
      </main>

      <SettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </div>
  );
};
