import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { 
  Package2, 
  Package,
  LayoutDashboard, 
  Users, 
  Store, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Box,
  FileText,
  History,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  X,
  CheckCircle,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title,
  subtitle,
  actions
}) => {
  const { user, activeRole, activeOrg, memberships, organizations, switchOrg } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard, path: `/${activeRole}` },
    { id: "orders", label: "Orders", icon: Box, path: `/${activeRole}/orders` },
    ...(activeRole === 'supplier' ? [
      { id: "retailers", label: "Retailers", icon: Store, path: "/supplier/retailers" },
      { id: "employees", label: "Employees", icon: Users, path: "/supplier/employees" },
      { id: "products", label: "Products", icon: Box, path: "/supplier/products" },
      { id: "tasks", label: "Tasks", icon: ClipboardList, path: "/supplier/tasks" },
      { id: "inventory", label: "Inventory", icon: Package, path: "/supplier/inventory" },
      { id: "performance", label: "Performance", icon: TrendingUp, path: "/supplier/performance" },
      { id: "strategy", label: "Strategy", icon: Zap, path: "/supplier/strategy" },
      { id: "invites", label: "Invites", icon: FileText, path: "/supplier/invites" },
    ] : []),
    ...(activeRole === 'retailer' ? [
      { id: "marketplace", label: "Marketplace", icon: Store, path: "/retailer/marketplace" },
      { id: "suppliers", label: "Suppliers", icon: Users, path: "/retailer/suppliers" },
      { id: "history", label: "History", icon: History, path: "/retailer/history" },
    ] : []),
    ...(activeRole === 'employee' ? [
       { id: "tasks", label: "Tasks", icon: ClipboardList, path: "/employee/tasks" },
       { id: "history", label: "Deliveries", icon: History, path: "/employee/history" }
    ] : [])
  ];

  const isActive = (path: string) => {
    if (path === `/${activeRole}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-50 font-sans overflow-hidden">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[100] md:hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3">
                  <Package2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase italic tracking-tight leading-none">Terminal</h1>
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1">Menu Systems</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-zinc-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Org Switcher for Multiple Orgs (Mobile) */}
              {memberships.length > 1 && activeRole === 'retailer' && (
                <div className="space-y-4">
                  <p className="px-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">
                    Switch Supplier
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {memberships.map((m) => {
                      const o = organizations[m.organizationId];
                      if (!o) return null;
                      const isSelect = o.id === activeOrg?.id;
                      return (
                        <button
                          key={o.id}
                          onClick={() => {
                            switchOrg(o.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            isSelect
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-lg" 
                              : "bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100"
                          }`}
                        >
                          <span>{o.name}</span>
                          {isSelect && <CheckCircle className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-b border-zinc-100" />
                </div>
              )}

              <div className="space-y-1">
                <p className="px-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4 italic">Operations</p>
                <div className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all text-center border ${
                        isActive(item.path)
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-lg" 
                          : "bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5 mb-1" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all text-center border ${
                      location.pathname === "/settings"
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-lg" 
                        : "bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100"
                    }`}
                  >
                    <Settings className="h-5 w-5 mb-1" />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>

              <div className="pt-8 border-t border-zinc-100">
                <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-3xl mb-6">
                  <div className="h-14 w-14 flex-shrink-0 rounded-full bg-white border-2 border-zinc-200 shadow-sm flex items-center justify-center font-black text-2xl text-zinc-900 uppercase italic">
                    {user?.name?.charAt(0) || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight truncate">{user?.name || "Agent"}</p>
                    <p className="text-xs font-bold text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full gap-3 h-14 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-black uppercase tracking-widest transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout From Terminal</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header (Consolidated) */}
      <header className="md:hidden bg-white border-b border-zinc-100 px-4 py-4 flex items-center justify-between sticky top-0 z-50 shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white rotate-3 shrink-0 shadow-lg">
            <Package2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[13px] sm:text-[15px] font-black uppercase italic tracking-tight leading-none mb-1 truncate">{activeOrg?.name || "Terminal"}</h1>
            <p className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em] truncate">{activeRole} sector control</p>
          </div>
        </div>
        <div className="flex items-center shrink-0">
           {actions}
        </div>
      </header>

      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside 
        className={`hidden md:flex ${isCollapsed ? "w-24" : "w-72"} bg-white border-r border-zinc-200 flex-col transition-all duration-300 ease-in-out relative flex-shrink-0`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 bg-white border border-zinc-200 rounded-full p-1 shadow-sm hover:bg-zinc-100 transition-colors z-50 group"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-zinc-900" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-zinc-900" />
          )}
        </button>

        <div className={`flex flex-col h-full p-6 ${isCollapsed ? "items-center" : ""}`}>
          <div className={`flex items-center gap-3 mb-10 ${isCollapsed ? "justify-center" : "px-2"}`}>
            <div className="h-10 w-10 bg-zinc-900 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg rotate-3">
              <Package2 className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="text-xl font-black uppercase italic tracking-tight leading-none">TracksUp</h1>
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1">{activeRole} terminal</p>
              </motion.div>
            )}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
            {/* Org Switcher for Multiple Orgs */}
            {memberships.length > 1 && !isCollapsed && activeRole === 'retailer' && (
              <div className="mb-6 px-2">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 italic flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  My Suppliers
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {memberships.map((m) => {
                    const o = organizations[m.organizationId];
                    if (!o) return null;
                    const isSelect = o.id === activeOrg?.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => switchOrg(o.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between border ${
                          isSelect 
                            ? "bg-zinc-100 border-zinc-200 text-zinc-900 shadow-sm" 
                            : "border-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="truncate flex-1">{o.name}</span>
                        {isSelect && <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 border-b border-zinc-100" />
              </div>
            )}

            {!isCollapsed && <p className="px-2 text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4 italic">Operations</p>}
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                  isActive(item.path)
                    ? "bg-zinc-900 text-white shadow-md translate-x-1" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
            
            <div className={`pt-4 mt-4 border-t border-zinc-100 ${isCollapsed ? "flex justify-center" : ""}`}>
               <Link
                to="/settings"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                  location.pathname === "/settings"
                    ? "bg-zinc-900 text-white shadow-md translate-x-1" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? "Settings" : ""}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>Settings</span>}
              </Link>
            </div>
          </nav>

          <div className="mt-auto pt-8 border-t border-zinc-100 space-y-4">
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "px-2 mb-4"}`}>
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-zinc-900 uppercase italic">
                {user?.name?.charAt(0) || "A"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight truncate">{user?.name || "Agent"}</p>
                  <p className="text-[10px] font-bold text-zinc-500 truncate">{user?.email}</p>
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              className={`w-full gap-3 rounded-xl h-12 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-black uppercase tracking-widest transition-all ${isCollapsed ? "justify-center p-0" : "justify-start"}`}
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : ""}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50 min-w-0">
        {/* Header (Desktop Only) */}
        <header className="hidden md:flex h-20 border-b border-zinc-100 bg-white/80 backdrop-blur-md items-center justify-between px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-4 truncate">
            <div className="space-y-0.5 truncate">
               <h2 className="text-lg font-black uppercase tracking-tight italic leading-none truncate">
                 {title || activeOrg?.name || "Terminal"}
               </h2>
               {subtitle && <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-6">
            {actions && <div className="flex items-center">{actions}</div>}
            <div className="hidden lg:flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 font-black" />
                <input 
                  type="text" 
                  placeholder="Universal Search..." 
                  className="pl-9 pr-4 py-2 bg-zinc-100 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-zinc-900 w-48 transition-all"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-rose-500 rounded-full border border-white shadow-sm"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide pb-24 md:pb-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-4 py-3 flex justify-around items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {[
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: `/${activeRole}` },
          { id: "orders", label: "Orders", icon: Box, path: `/${activeRole}/orders` },
          { 
            id: "products", 
            label: activeRole === 'retailer' ? "Market" : "Inventory", 
            icon: activeRole === 'retailer' ? Store : Box, 
            path: activeRole === 'retailer' ? "/retailer/marketplace" : (activeRole === 'employee' ? "/employee/history" : "/supplier/products")
          },
        ].map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
              isActive(item.path)
                ? "text-zinc-900 scale-110" 
                : "text-zinc-400"
            }`}
          >
            <item.icon className={`h-6 w-6 ${isActive(item.path) ? "stroke-[2.5px]" : "stroke-2"}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive(item.path) ? "opacity-100" : "opacity-60"}`}>
              {item.label}
            </span>
          </Link>
        ))}

        {/* Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
            isMobileMenuOpen ? "text-zinc-900 scale-110" : "text-zinc-400"
          }`}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6 stroke-[2.5px]" /> : <Menu className="h-6 w-6 stroke-2" />}
          <span className={`text-[8px] font-black uppercase tracking-widest ${isMobileMenuOpen ? "opacity-100" : "opacity-60"}`}>
            Menu
          </span>
        </button>
      </nav>
    </div>
  );
};
