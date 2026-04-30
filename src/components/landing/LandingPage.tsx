import React from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Globe, 
  Zap, 
  Clock, 
  Smartphone, 
  FileText, 
  CreditCard,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Menu,
  X,
  Play,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-100'}`}>
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'bg-white' : 'bg-zinc-900'}`}>
            <Truck className={`h-6 w-6 ${isDark ? 'text-zinc-900' : 'text-white'}`} />
          </div>
          <span className={`text-xl font-black italic uppercase tracking-tighter transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>Tracksup</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8">
          <a href="#features" className={`text-sm font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>Features</a>
          <a href="#how-it-works" className={`text-sm font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>Flow</a>
          <a href="#pricing" className={`text-sm font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}>Pricing</a>
          <Button variant="ghost" onClick={toggleTheme} className={`h-10 w-10 p-0 rounded-full ${isDark ? 'text-white hover:bg-zinc-800' : 'text-zinc-900 hover:bg-zinc-100'}`}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/auth")} className={`font-bold uppercase tracking-widest text-xs ${isDark ? 'text-white hover:bg-zinc-800' : ''}`}>Login</Button>
          <Button onClick={() => navigate("/auth")} className={`rounded-full px-6 font-bold uppercase tracking-widest text-xs shadow-lg transition-all ${isDark ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'shadow-zinc-200'}`}>Get Started</Button>
        </div>

        {/* Mobile Toggle */}
        <button className={`lg:hidden ${isDark ? 'text-white' : 'text-zinc-900'}`} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={`lg:hidden absolute top-20 left-0 right-0 border-b p-6 flex flex-col gap-6 shadow-xl transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-100'}`}>
          <a href="#features" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-zinc-500">Features</a>
          <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-zinc-500">Flow</a>
          <a href="#pricing" onClick={() => setIsOpen(false)} className="text-sm font-bold uppercase tracking-widest text-zinc-500">Pricing</a>
          <button onClick={toggleTheme} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-500">
             {isDark ? <><Sun className="h-5 w-5" /> Light Mode</> : <><Moon className="h-5 w-5" /> Dark Mode</>}
          </button>
          <div className={`flex flex-col gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
            <Button variant="outline" onClick={() => navigate("/auth")} className={`w-full rounded-xl font-bold uppercase tracking-widest text-xs ${isDark ? 'border-zinc-700 bg-transparent text-white' : ''}`}>Login</Button>
            <Button onClick={() => navigate("/auth")} className={`w-full rounded-xl font-bold uppercase tracking-widest text-xs ${isDark ? 'bg-white text-zinc-900' : ''}`}>Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

const SectionHeader = ({ badge, title, description, isDark, light = false }: { badge: string; title: string; description: string; isDark: boolean; light?: boolean }) => (
  <div className="max-w-3xl mx-auto text-center mb-16 px-6">
    <Badge variant="outline" className={`mb-4 px-4 py-1 rounded-full text-[10px] uppercase font-black tracking-[0.2em] transition-colors ${light || isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
      {badge}
    </Badge>
    <h2 className={`text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-6 transition-colors ${light || isDark ? 'text-white' : 'text-zinc-900'}`}>
      {title}
    </h2>
    <p className={`text-lg italic font-medium transition-colors ${light || isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
      {description}
    </p>
  </div>
);

export const LandingPage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 selection:bg-zinc-900 selection:text-white ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      <Navbar isDark={isDarkMode} toggleTheme={toggleTheme} />

      {/* HERO SECTION */}
      <section className="pt-40 pb-24 lg:pt-52 lg:pb-32 px-6">
        <div className="container mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className={`border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 transition-colors ${isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                Next-Gen Distribution OS
              </Badge>
              <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Supply Chain <br className="hidden md:block" />
                <span className={isDarkMode ? 'text-zinc-700' : 'text-zinc-400'}>Intelligence</span> <br className="hidden md:block" />
                Redefined.
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`text-xl md:text-2xl font-medium italic max-w-2xl mx-auto lg:mx-0 transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
            >
              Track deliveries, manage workforce, and automate invoicing in one unified terminal. The modern standard for distributed logistics.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button 
                onClick={() => navigate("/auth")}
                size="lg" 
                className={`h-16 px-10 rounded-full font-black uppercase tracking-widest shadow-2xl group w-full sm:w-auto transition-all ${isDarkMode ? 'bg-white text-zinc-900 hover:bg-zinc-200 shadow-white/5' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'}`}
              >
                Launch Terminal
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className={`h-16 px-10 rounded-full font-black uppercase tracking-widest border-2 w-full sm:w-auto ${isDarkMode ? 'border-zinc-800 text-white hover:bg-zinc-900 hover:text-white' : ''}`}
              >
                Watch Demo
                <Play className="ml-2 h-4 w-4 fill-current" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className={`flex items-center justify-center lg:justify-start gap-8 pt-8 opacity-40 transition-all ${isDarkMode ? 'grayscale invert' : 'grayscale'}`}
            >
              <div className="font-black italic uppercase text-xl">LogiTech</div>
              <div className="font-black italic uppercase text-xl">FleetCo</div>
              <div className="font-black italic uppercase text-xl">FastMove</div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, type: "spring" }}
            className="flex-1 relative group"
          >
            <div className={`absolute inset-0 rounded-[3rem] -rotate-3 -z-10 group-hover:rotate-0 transition-transform duration-700 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-gradient-to-br from-blue-50 to-emerald-50'}`} />
            <Card className={`rounded-[2.5rem] border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden aspect-[4/3] flex flex-col relative transition-colors ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className={`h-12 border-b flex items-center px-6 gap-2 transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div className={`ml-4 h-4 w-32 rounded-full transition-colors ${isDarkMode ? 'bg-white/10' : 'bg-zinc-200/50'}`} />
              </div>
              <div className="flex-1 p-8 space-y-8 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Fleet Operations</h4>
                    <p className={`text-xl font-black italic uppercase tracking-tight transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Operational Log</p>
                  </div>
                  <Badge className={`border-none px-3 font-bold uppercase text-[9px] tracking-widest transition-colors ${isDarkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}>Active Link</Badge>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className={`rounded-2xl p-6 border relative overflow-hidden group/card transition-all duration-500 ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-900'}`}>
                    <div className="relative z-10 space-y-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-zinc-200 text-zinc-500 group-hover:card:text-white group-hover:card:bg-zinc-800'}`}>
                        <Clock className="h-4 w-4" />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400 group-hover:card:text-zinc-500'}`}>Orders</p>
                      <p className={`text-3xl font-black italic tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900 group-hover:card:text-white'}`}>124</p>
                    </div>
                  </div>
                  <div className={`rounded-2xl p-6 border relative overflow-hidden shadow-xl transition-all ${isDarkMode ? 'bg-white text-zinc-900 border-white/10' : 'bg-zinc-900 text-white border-zinc-800 shadow-zinc-200'}`}>
                    <div className="space-y-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-zinc-900/10 text-zinc-900' : 'bg-white/10 text-white'}`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Transit</p>
                      <p className={`text-3xl font-black italic tracking-tighter transition-colors ${isDarkMode ? 'text-zinc-900' : 'text-white'}`}>42</p>
                    </div>
                    <div className="absolute top-0 right-0 p-4">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                    </div>
                  </div>
                </div>

                <div className={`flex-1 rounded-2xl border relative overflow-hidden flex items-center justify-center group/view transition-colors ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                   <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-200/50 to-transparent opacity-50 transition-colors ${isDarkMode ? 'from-white/10' : ''}`} />
                   <div className="relative text-center p-8">
                     <p className={`text-lg font-black italic uppercase tracking-tighter mb-6 group-hover:view:text-zinc-600 transition-colors ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                       Track your deliveries, payments, <br /> and operations in one place
                     </p>
                     <div className="flex gap-3 justify-center">
                        <Button variant="outline" className={`rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 transition-colors ${isDarkMode ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'border-zinc-200 bg-white'}`}>
                          Track Delivery
                        </Button>
                        <Button className={`rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 shadow-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700 shadow-black' : 'bg-zinc-900 text-white shadow-zinc-200'}`}>
                           Create Order
                        </Button>
                     </div>
                   </div>
                </div>
              </div>
            </Card>
            
            {/* Added floating decorative elements */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 h-24 w-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-6 -rotate-12"
            >
               <BarChart3 className="h-full w-full text-zinc-900" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className={`absolute -bottom-10 -left-10 h-20 w-20 rounded-[2rem] shadow-2xl flex items-center justify-center p-5 rotate-12 transition-colors ${isDarkMode ? 'bg-white' : 'bg-zinc-900'}`}
            >
               <Smartphone className={`h-full w-full ${isDarkMode ? 'text-zinc-900' : 'text-white'}`} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className={`py-24 px-6 relative overflow-hidden transition-colors ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className={`absolute top-0 left-1/4 w-96 h-96 blur-[120px] rounded-full transition-colors ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
        </div>
        <div className="container mx-auto relative z-10">
          <SectionHeader 
            badge="The Friction"
            title="Logistics shouldn't be a black box"
            description="Traditional supply chains are plagued by manual processes that bleed efficiency every single day."
            isDark={isDarkMode}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: MapPin, title: "Zero Visibility", desc: "No idea where your delivery vehicles are at any given moment." },
              { icon: FileText, title: "Paper Fatigue", desc: "Manual invoicing leading to errors, delays, and lost revenue." },
              { icon: BarChart3, title: "Data Silos", desc: "Inventory and sales data scattered across multiple legacy spreadsheets." },
              { icon: Users, title: "Workforce Chaos", desc: "Difficulty managing employee performance and delivery status." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`p-8 rounded-[2.5rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border group transition-all duration-500 hover:shadow-2xl ${isDarkMode ? 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800 hover:shadow-black' : 'bg-white border-zinc-100 hover:shadow-zinc-200'}`}
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-all duration-500 ${isDarkMode ? 'bg-zinc-900 text-white group-hover:bg-white group-hover:text-zinc-900' : 'bg-zinc-50 group-hover:bg-zinc-900 group-hover:text-white'}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className={`text-xl font-black italic uppercase tracking-tighter mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.title}</h3>
                <p className={`font-medium italic text-sm transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className={`py-32 px-6 overflow-hidden relative transition-colors ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        <div className={`absolute top-1/2 left-0 w-full h-[500px] -z-10 -skew-y-3 transition-colors ${isDarkMode ? 'bg-zinc-900/30' : 'bg-zinc-50'}`} />
        <div className="container mx-auto">
          <SectionHeader 
            badge="Arsenal"
            title="Engineered for performance"
            description="A suite of tools designed to eliminate every bottleneck in your distribution cycle."
            isDark={isDarkMode}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="md:col-span-7"
            >
              <Card className={`rounded-[3rem] overflow-hidden border-none shadow-2xl relative min-h-[450px] group transition-colors ${isDarkMode ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>
                <div className="p-12 space-y-6 relative z-10">
                  <Badge className={`border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isDarkMode ? 'bg-zinc-900/5 text-zinc-900' : 'bg-white/10 text-white'}`}>Live Tracking</Badge>
                  <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                    Real-Time <br /> Node Intelligence
                  </h3>
                  <p className={`font-medium italic text-lg max-w-md transition-colors ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Track every delivery agent with sub-second precision. View transit logs, predicted arrival times, and instant status updates.
                  </p>
                  <Button className={`rounded-full h-14 px-10 font-black uppercase tracking-widest text-xs shadow-xl transition-all ${isDarkMode ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200' : 'bg-white text-zinc-900 hover:bg-zinc-200 shadow-white/5'}`}>
                    Explore Analytics
                  </Button>
                </div>
                <div className={`absolute bottom-0 right-0 w-2/3 h-2/3 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700 ${isDarkMode ? 'invert' : ''}`}>
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent" />
                </div>
                <LayoutDashboard className={`absolute -bottom-10 -right-10 h-64 w-64 rotate-12 group-hover:rotate-0 transition-all duration-1000 ${isDarkMode ? 'text-black/5' : 'text-white/5'}`} />
              </Card>
            </motion.div>

            <div className="md:col-span-5 grid grid-rows-2 gap-8">
               {[
                 { icon: FileText, title: "Digital Handovers", desc: "Instant generation of professional PDF invoices and delivery manifests." },
                 { icon: CreditCard, title: "Unified Payments", desc: "Monitor collections, outstanding credits, and cash flows with automated reconcilement." }
               ].map((feat, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, x: 30 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.7, delay: i * 0.2 }}
                 >
                   <Card className={`rounded-[3rem] border-none shadow-sm flex flex-col justify-center p-12 transition-all duration-500 hover:shadow-2xl border group h-full ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:shadow-black' : 'bg-zinc-50 hover:bg-white hover:border-zinc-100'}`}>
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-all duration-500 ${isDarkMode ? 'bg-white text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white' : 'bg-white text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white'}`}>
                        <feat.icon className="h-8 w-8" />
                      </div>
                      <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{feat.title}</h3>
                      <p className={`font-medium italic transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{feat.desc}</p>
                   </Card>
                 </motion.div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className={`py-24 px-6 overflow-hidden transition-colors ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-900'}`}>
        <div className="container mx-auto">
          <SectionHeader 
            badge="The Flow"
            title="Operational Harmony"
            description="Our platform connects every stakeholder in the chain through a streamlined four-step workflow."
            isDark={true}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: MapPin, title: "Zero Visibility", desc: "No idea where your delivery vehicles are at any given moment." },
              { icon: FileText, title: "Paper Fatigue", desc: "Manual invoicing leading to errors, delays, and lost revenue." },
              { icon: BarChart3, title: "Data Silos", desc: "Inventory and sales data scattered across multiple legacy spreadsheets." },
              { icon: Users, title: "Workforce Chaos", desc: "Difficulty managing employee performance and delivery status." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`p-8 rounded-[2.5rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border group transition-all duration-500 hover:shadow-2xl ${isDarkMode ? 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800 hover:shadow-black' : 'bg-white border-zinc-100 hover:shadow-zinc-200'}`}
              >
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-all duration-500 ${isDarkMode ? 'bg-zinc-900 text-white group-hover:bg-white group-hover:text-zinc-900' : 'bg-zinc-50 group-hover:bg-zinc-900 group-hover:text-white'}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className={`text-xl font-black italic uppercase tracking-tighter mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.title}</h3>
                <p className={`font-medium italic text-sm transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS ALTERNATIVE FLOW */}
      <section className={`py-24 px-6 overflow-hidden transition-colors ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-950'}`}>
        <div className="container mx-auto">
          <SectionHeader 
            badge="The Protocol"
            title="Operational Sync"
            description="Our platform connects every stakeholder in the chain through a streamlined four-step workflow."
            isDark={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative mt-16">
            {/* Connector Line */}
            <div className={`hidden md:block absolute top-[1.75rem] left-[10%] right-[10%] h-[2px] z-0 transition-colors ${isDarkMode ? 'bg-white/5' : 'bg-white/10'}`} />
            
            {[
              { step: "01", title: "Ingestion", desc: "Supplier creates the order node on the central terminal." },
              { step: "02", title: "Assignment", desc: "Task is automatically deployed to the nearest delivery agent." },
              { step: "03", title: "Transit", desc: "Retailer receives a live tracking link with ETAs." },
              { step: "04", title: "Handover", desc: "Agent updates status + payment, syncing the ledger instantly." }
            ].map((flow, i) => (
              <div key={i} className="relative z-10 space-y-6">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center font-black italic text-lg shadow-2xl transition-colors ${isDarkMode ? 'bg-white text-zinc-900 border-2 border-white' : 'bg-zinc-800 border-2 border-zinc-700 text-white'}`}>
                  {flow.step}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">{flow.title}</h3>
                  <p className={`font-medium italic text-sm transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{flow.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARGET USERS */}
      <section className={`py-24 px-6 transition-colors ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        <div className="container mx-auto">
          <SectionHeader 
            badge="Cohort"
            title="Who is Tracksup for?"
            description="Designed for enterprises that value speed and operational transparency."
            isDark={isDarkMode}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`rounded-[3rem] p-12 space-y-6 transition-colors ${isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
              <div className="flex items-center gap-4">
                 <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white' : 'bg-zinc-900'}`}>
                    <Globe className={`h-5 w-5 ${isDarkMode ? 'text-zinc-900' : 'text-white'}`} />
                 </div>
                 <h4 className={`text-xl font-black italic uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Enterprise Distributors</h4>
              </div>
              <p className={`font-medium italic transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>FMCG distributors handling thousands of SKUs and dozens of delivery routes across multiple regions.</p>
              <ul className="space-y-3">
                {["Multi-warehouse sync", "Agent performance metrics", "Regional analytics"].map((li, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {li}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-[3rem] p-12 space-y-6 transition-colors ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-black text-white'}`}>
              <div className="flex items-center gap-4">
                 <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white text-zinc-900' : 'bg-white text-black'}`}>
                    <Smartphone className="h-5 w-5" />
                 </div>
                 <h4 className="text-xl font-black italic uppercase tracking-tighter">Wholesale Suppliers</h4>
              </div>
              <p className={`font-medium italic transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Local wholesalers looking to provide a superior tracking experience to their retail clients.</p>
              <ul className="space-y-3">
                {["One-click invoicing", "Instant payment reconciliation", "Client trust building"].map((li, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-300'}`}>
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    {li}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className={`py-32 px-6 relative transition-colors ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
        <div className="container mx-auto">
          <SectionHeader 
            badge="Investment"
            title="Simple, Scaleable Plans"
            description="Transparent pricing that grows as your fleet expands."
            isDark={isDarkMode}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className={`rounded-[3rem] p-12 border-none transition-all duration-700 group ${isDarkMode ? 'bg-zinc-800/50 shadow-black hover:bg-zinc-800' : 'bg-white shadow-[0_4px_30px_-10px_rgba(0,0,0,0.02)] hover:shadow-2xl'}`}>
                 <div className="text-center space-y-4 mb-10">
                    <h4 className={`text-xl font-black italic uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-400 group-hover:text-zinc-900'}`}>Starter</h4>
                    <div className="flex items-center justify-center gap-1">
                       <span className={`text-4xl font-black italic transition-colors ${isDarkMode ? 'text-white/10' : 'text-zinc-300'}`}>$</span>
                       <span className={`text-7xl font-black italic tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>49</span>
                       <span className={`text-xl font-bold italic transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>/mo</span>
                    </div>
                 </div>
                 <ul className="space-y-4 mb-10">
                    {["Up to 5 Employees", "Basic Tracking", "Digital Invoices", "Email Support"].map((li, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <CheckCircle2 className={`h-4 w-4 transition-colors ${isDarkMode ? 'text-zinc-600 group-hover:text-emerald-500' : 'text-zinc-200 group-hover:text-emerald-500'}`} />
                        {li}
                      </li>
                    ))}
                 </ul>
                 <Button variant="outline" className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest border-2 hover:bg-zinc-900 hover:text-white transition-all transform group-hover:scale-[1.02] ${isDarkMode ? 'border-zinc-700 text-white hover:bg-white hover:text-zinc-900' : ''}`}>
                   Get Started
                 </Button>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className={`rounded-[3rem] p-12 border-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] relative overflow-hidden group transition-colors ${isDarkMode ? 'bg-white text-zinc-900 shadow-black' : 'bg-zinc-900 text-white'}`}>
                 <div className="absolute top-0 right-0 bg-blue-500 text-white px-8 py-3 rounded-bl-[2.5rem] text-[10px] font-black uppercase tracking-widest italic z-10">Optimal Choice</div>
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent opacity-50 relative pointer-events-none" />
                 
                 <div className="relative z-10 text-center space-y-4 mb-10">
                    <h4 className={`text-xl font-black italic uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-blue-600' : 'text-blue-400'}`}>Terminal Pro</h4>
                    <div className="flex items-center justify-center gap-1">
                       <span className={`text-4xl font-black italic transition-colors ${isDarkMode ? 'text-blue-600/20' : 'text-blue-500/20'}`}>$</span>
                       <span className={`text-7xl font-black italic tracking-tighter transition-colors ${isDarkMode ? 'text-zinc-900' : 'text-white'}`}>149</span>
                       <span className={`text-xl font-bold italic transition-colors ${isDarkMode ? 'text-blue-600' : 'text-blue-400'}`}>/mo</span>
                    </div>
                 </div>
                 <ul className={`relative z-10 space-y-4 mb-10 transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {["Unlimited Employees", "Advanced Fleet Analytics", "Custom API Access", "Priority Support", "Dedicated Manager"].map((li, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        {li}
                      </li>
                    ))}
                 </ul>
                 <Button className={`relative z-10 w-full h-16 rounded-2xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all transform group-hover:scale-[1.02] ${isDarkMode ? 'text-white' : ''}`}>
                   Launch Enterprise
                 </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className={`py-24 px-6 overflow-hidden relative transition-colors ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        <div className="container mx-auto">
          <SectionHeader 
            badge="Signals"
            title="Trusted by the best"
            description="Hear from distributors who have revolutionized their stack."
            isDark={isDarkMode}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "Visibility across our 50-vehicle fleet tripled within 30 days of implementation.", author: "Marcus Thorne", role: "Logistics Director" },
              { quote: "The automated reconciliation saved our accounting team over 15 hours every single week.", author: "Sarah Jenkins", role: "FMCG Distributor" },
              { quote: "Retailer trust is at an all-time high since we deployed full transparency tracking.", author: "David Chen", role: "Warehouse Manager" }
            ].map((t, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02 }} 
                className={`p-10 rounded-[2.5rem] space-y-6 border transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}
              >
                <div className="flex gap-1">
                   {[1, 2, 3, 4, 5].map(s => <Zap key={s} className="h-4 w-4 text-yellow-500 fill-current" />)}
                </div>
                <p className={`text-xl font-black italic uppercase tracking-tighter leading-tight transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  "{t.quote}"
                </p>
                <div>
                  <h4 className={`font-black uppercase italic text-xs tracking-widest transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-900'}`}>{t.author}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`py-24 px-6 transition-colors ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        <div className="container mx-auto max-w-4xl">
          <SectionHeader 
            badge="Intelligence"
            title="Frequent Queries"
            description="Everything you need to know about the Tracksup ecosystem."
            isDark={isDarkMode}
          />

          <div className="space-y-6">
             {[
               { q: "Do retailers need to install an app?", a: "No. Retailers receive an encrypted web link that works on any mobile browser instantly." },
               { q: "How many employees can I manage?", a: "Our Pro plan supports unlimited employees and organizations, perfect for scaling fleets." },
               { q: "Is the tracking real-time?", a: "Yes. Our node sync system delivers updates with sub-second latency across all connected terminals." },
               { q: "Can we integrate with our current ERP?", a: "Absolutely. Our Enterprise tier offers custom API endpoints for seamless data orchestration." }
             ].map((faq, i) => (
               <details key={i} className={`group border rounded-3xl overflow-hidden transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50'}`}>
                  <summary className={`p-8 flex items-center justify-between cursor-pointer list-none font-black italic uppercase tracking-tighter text-lg transition-colors ${isDarkMode ? 'bg-zinc-900 group-open:bg-zinc-900/50 text-white' : 'bg-white group-open:bg-zinc-50 text-zinc-900'}`}>
                    {faq.q}
                    <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className={`p-8 pt-0 font-medium italic ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {faq.a}
                  </div>
               </details>
             ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className={`container mx-auto max-w-5xl rounded-[4rem] p-12 md:p-24 text-center space-y-12 relative overflow-hidden transition-colors ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-900'}`}>
           <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-zinc-700 to-transparent pointer-events-none opacity-50 ${isDarkMode ? 'from-zinc-700' : 'from-zinc-800'}`} />
           <Badge className="bg-white/10 text-white border-none px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] relative z-10">
              Terminal Ready
           </Badge>
           <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter leading-none text-white relative z-10">
             Optimize Your <br /> Supply Chain Today.
           </h2>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <Button onClick={() => navigate("/auth")} size="lg" className="h-20 px-12 bg-white text-zinc-900 hover:bg-zinc-200 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl shadow-white/10 text-lg">
                Get Started
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button variant="ghost" size="lg" className={`h-20 px-12 border-2 rounded-full font-black uppercase tracking-[0.2em] text-lg ${isDarkMode ? 'text-white border-white/20' : 'text-white border-white/10'}`}>
                Book Full Demo
              </Button>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-12 px-6 border-t transition-colors ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-100'}`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white' : 'bg-zinc-900'}`}>
              <Truck className={`h-5 w-5 ${isDarkMode ? 'text-zinc-900' : 'text-white'}`} />
            </div>
            <span className={`text-lg font-black italic uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Tracksup</span>
          </div>
          
          <div className="flex items-center gap-8">
             <a href="#" className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-900'}`}>Terms</a>
             <a href="#" className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-900'}`}>Privacy</a>
             <a href="#" className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-900'}`}>Legal</a>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            © 2026 Tracksup Technologies • Node.01
          </div>
        </div>
      </footer>
    </div>
  );
};
