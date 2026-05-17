import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Package2, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Globe, 
  Users, 
  Store, 
  Building2, 
  CreditCard, 
  MapPin, 
  Activity,
  ChevronRight,
  Database,
  History,
  FileText,
  Quote,
  Box,
  Check,
  Moon,
  Sun,
  Palette,
  Terminal,
  Menu,
  X
} from "lucide-react";
import { motion } from "motion/react";

const FlowStep = ({ icon: Icon, title, desc, step, theme }: { icon: any, title: string, desc: string, step: string, theme: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="flex flex-col items-center text-center group"
  >
    <div className="relative mb-6">
      <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110 ${theme === 'cyber' ? 'bg-emerald-950/30 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white'}`}>
        <Icon className="h-10 w-10" />
      </div>
      <div className={`absolute -top-2 -right-2 h-8 w-8 shadow-xl rounded-full flex items-center justify-center text-[10px] font-black italic border transition-colors ${theme === 'cyber' ? 'bg-black text-emerald-500 border-emerald-500/20' : 'bg-white text-zinc-900 border-zinc-200'}`}>
        {step}
      </div>
    </div>
    <h4 className={`text-lg font-black uppercase italic tracking-tight mb-2 leading-none transition-colors ${theme === 'cyber' ? 'text-emerald-400' : 'text-zinc-900'}`}>{title}</h4>
    <p className={`text-xs font-medium leading-relaxed max-w-[200px] transition-colors ${theme === 'cyber' ? 'text-emerald-600' : 'text-zinc-600'}`}>{desc}</p>
  </motion.div>
);

const RoleCard = ({ icon: Icon, role, title, features, colorClass, theme }: { icon: any, role: string, title: string, features: string[], colorClass: string, theme: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className={`p-10 md:p-12 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border flex flex-col h-full group transition-all duration-700 hover:-translate-y-2 ${theme === 'cyber' ? 'bg-black border-emerald-500/20 hover:bg-emerald-950/30 hover:border-emerald-500' : 'bg-white border-zinc-100 hover:bg-zinc-900 hover:text-white'}`}
  >
    <div className={`h-16 w-16 ${colorClass} rounded-2xl flex items-center justify-center mb-10 group-hover:rotate-6 transition-transform group-hover:bg-white/10`}>
      <Icon className="h-8 w-8 group-hover:text-white transition-colors" />
    </div>
    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 group-hover:text-zinc-400 italic transition-colors ${theme === 'cyber' ? 'text-emerald-600' : 'text-zinc-500'}`}>{role}</p>
    <h4 className={`text-3xl font-black uppercase italic tracking-tighter mb-8 leading-[0.9] transition-colors ${theme === 'cyber' ? 'text-emerald-400' : ''}`}>{title}</h4>
    <ul className="space-y-4 mb-auto">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-4">
          <div className={`h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center mt-1 group-hover:bg-white/10 transition-colors ${theme === 'cyber' ? 'bg-emerald-950/50' : 'bg-zinc-100'}`}>
            <ShieldCheck className={`h-3 w-3 group-hover:text-emerald-400 ${theme === 'cyber' ? 'text-emerald-500' : 'text-zinc-400'}`} />
          </div>
          <span className={`text-sm font-medium leading-tight group-hover:text-zinc-400 transition-colors ${theme === 'cyber' ? 'text-emerald-500' : 'text-zinc-600'}`}>{f}</span>
        </li>
      ))}
    </ul>
    <Link to="/auth" className="mt-12">
      <Button variant="outline" className={`w-full h-14 rounded-2xl border-2 font-black uppercase italic tracking-widest transition-all ${theme === 'cyber' ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black hover:border-emerald-500' : 'border-zinc-100 group-hover:bg-white group-hover:text-zinc-900 group-hover:border-white'}`}>
        Establish Node
      </Button>
    </Link>
  </motion.div>
);

const TestimonialCard = ({ quote, author, role, company, theme }: { quote: string, author: string, role: string, company: string, theme: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`p-10 rounded-[3rem] border flex flex-col group hover:bg-zinc-900 hover:text-white transition-all duration-700 relative overflow-hidden ${theme === 'cyber' ? 'bg-black border-emerald-500/10' : 'bg-zinc-50 border-zinc-100'}`}
  >
    <div className={`absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity ${theme === 'cyber' ? 'text-emerald-500' : 'text-zinc-900'}`}>
        <Quote className="h-24 w-24" />
    </div>
    <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4, 5].map(i => <Zap key={i} className={`h-4 w-4 fill-emerald-500 text-emerald-500`} />)}
    </div>
    <p className={`text-xl font-black italic tracking-tight leading-relaxed mb-12 relative z-10 select-none transition-colors ${theme === 'cyber' ? 'text-emerald-400' : 'text-zinc-900'} group-hover:text-white`}>
      "{quote}"
    </p>
    <div className="mt-auto flex items-center gap-4 relative z-10">
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black italic group-hover:bg-white/10 transition-all ${theme === 'cyber' ? 'bg-emerald-950/50 text-emerald-500' : 'bg-zinc-200 text-zinc-500 group-hover:text-emerald-400'}`}>
        {author[0]}
      </div>
      <div>
        <h5 className={`font-black uppercase italic tracking-tighter group-hover:text-white transition-colors ${theme === 'cyber' ? 'text-emerald-300' : ''}`}>{author}</h5>
        <p className={`text-[10px] font-black uppercase tracking-widest group-hover:text-zinc-400 italic ${theme === 'cyber' ? 'text-emerald-700' : 'text-zinc-500'}`}>{role} • {company}</p>
      </div>
    </div>
  </motion.div>
);

const PricingCard = ({ plan, price, description, features, theme, highlighted = false }: { plan: string, price: string, description: string, features: string[], theme: string, highlighted?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`p-10 md:p-12 rounded-[3.5rem] flex flex-col h-full border transition-all duration-500 hover:scale-[1.02] group ${highlighted ? 'bg-zinc-900 border-zinc-900 shadow-2xl text-white' : (theme === 'cyber' ? 'bg-black border-emerald-500/20 text-emerald-500' : 'bg-white border-zinc-100 text-zinc-900')}`}
  >
    <div className="mb-10">
      <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 italic ${highlighted ? 'opacity-70' : 'opacity-100'} transition-opacity break-words relative z-20`}>{plan}</h4>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-black italic tracking-tighter">{price}</span>
        {price !== "Custom" && <span className="text-sm font-bold opacity-40 italic">/mo</span>}
      </div>
      <p className={`mt-6 text-sm font-medium leading-relaxed ${highlighted ? 'text-zinc-400' : (theme === 'cyber' ? 'text-emerald-600' : 'text-zinc-700')}`}>{description}</p>
    </div>

    <div className="space-y-5 mb-12">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${highlighted ? 'bg-white/10' : (theme === 'cyber' ? 'bg-emerald-950/50' : 'bg-zinc-100')}`}>
            <Check className={`h-3 w-3 ${highlighted ? 'text-emerald-400' : (theme === 'cyber' ? 'text-emerald-500' : 'text-zinc-600')}`} />
          </div>
          <span className={`text-xs font-black uppercase italic tracking-widest opacity-80 ${theme === 'cyber' && !highlighted ? 'text-emerald-400' : 'text-zinc-700'}`}>{f}</span>
        </div>
      ))}
    </div>

    <Button 
      className={`mt-auto h-16 rounded-2xl font-black uppercase italic tracking-widest transition-all ${highlighted ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-900' : (theme === 'cyber' ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-zinc-900 text-white hover:bg-zinc-800')}`}
    >
      Get Started
    </Button>
  </motion.div>
);

export const LandingPage = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'cyber' | 'midnight'>('light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const themes = {
    light: {
      bg: "bg-white",
      text: "text-zinc-900",
      nav: "bg-white/80 border-zinc-200",
      subText: "text-zinc-600",
      card: "bg-white border-zinc-200",
      accent: "text-emerald-600",
      button: "bg-zinc-900 text-white",
      muted: "bg-zinc-100",
      noise: "opacity-[0.03]"
    },
    dark: {
      bg: "bg-zinc-950",
      text: "text-zinc-50",
      nav: "bg-zinc-950/80 border-zinc-800",
      subText: "text-zinc-300",
      card: "bg-zinc-900 border-zinc-800",
      accent: "text-emerald-400",
      button: "bg-zinc-50 text-zinc-900 hover:bg-zinc-200",
      muted: "bg-zinc-900",
      noise: "opacity-[0.05]"
    },
    cyber: {
      bg: "bg-[#050505]",
      text: "text-emerald-500",
      nav: "bg-black/80 border-emerald-900/30",
      subText: "text-emerald-600",
      card: "bg-black border-emerald-500/20",
      accent: "text-emerald-300",
      button: "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
      muted: "bg-emerald-950/20",
      noise: "opacity-[0.08]"
    },
    midnight: {
      bg: "bg-[#020617]",
      text: "text-blue-50",
      nav: "bg-slate-950/80 border-blue-900/30",
      subText: "text-blue-200",
      card: "bg-slate-900 border-blue-800/20",
      accent: "text-blue-400",
      button: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]",
      muted: "bg-blue-950/30",
      noise: "opacity-[0.04]"
    }
  };

  const currentTheme = themes[theme];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-700 ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Dynamic Background Noise */}
      <div className={`fixed inset-0 pointer-events-none z-[70] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${currentTheme.noise}`} />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 h-16 md:h-20 backdrop-blur-md border-b z-[101] flex items-center justify-between px-6 md:px-16 lg:px-24 transition-colors duration-700 ${currentTheme.nav}`}>
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg rotate-3 transition-transform hover:rotate-0 ${theme === 'light' ? 'bg-zinc-900' : 'bg-emerald-500'}`}>
            <Package2 className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <span className={`text-sm md:text-xl font-black uppercase tracking-tighter italic ${theme === 'cyber' ? 'text-emerald-500' : 'text-zinc-900'}`}>TracksUp</span>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <div className={`flex items-center p-1 rounded-full border transition-colors ${currentTheme.muted} ${theme === 'cyber' ? 'border-emerald-500/20' : 'border-zinc-200'}`}>
            <button 
              onClick={() => setTheme('light')}
              className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Moon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setTheme('cyber')}
              className={`p-2 rounded-full transition-all ${theme === 'cyber' ? 'bg-emerald-500 text-black' : 'text-emerald-600 hover:text-emerald-500'}`}
            >
              <Terminal className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setTheme('midnight')}
              className={`p-2 rounded-full transition-all ${theme === 'midnight' ? 'bg-blue-600 text-white' : 'text-blue-400 hover:text-blue-200'}`}
            >
              <Palette className="h-4 w-4" />
            </button>
          </div>
          <div className="w-[1px] h-6 bg-zinc-200 mx-2" />
          {["Network", "Protocols", "Pricing", "Testimonials"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${theme === 'cyber' ? 'text-emerald-600 hover:text-emerald-400' : 'text-zinc-500 hover:text-zinc-900'}`}>
              {item}
            </a>
          ))}
        </div>
        
        <div className="flex items-center gap-3 md:gap-4 relative z-[100]">
          <Link to="/auth" className="hidden lg:block">
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer mr-6 italic ${theme === 'cyber' ? 'text-emerald-600 hover:text-emerald-400' : 'text-zinc-500 hover:text-zinc-900'}`}>
              Sign In
            </span>
          </Link>
          <Link to="/auth" className="hidden md:block lg:hidden">
            <Button className={`rounded-lg h-9 px-5 text-[10px] font-black uppercase italic tracking-widest transition-all ${currentTheme.button}`}>
              Log In
            </Button>
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all ${currentTheme.muted} relative z-[102]`}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={isMenuOpen ? { x: 0, opacity: 1 } : { x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={`fixed inset-0 lg:hidden z-[90] flex flex-col p-6 pt-32 pb-10 overflow-y-auto transition-colors duration-700 ${currentTheme.bg}`}
      >
        <div className="space-y-8 flex flex-col items-center text-center">
          {["Network", "Protocols", "Pricing", "Testimonials"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              onClick={() => setIsMenuOpen(false)}
              className={`text-3xl md:text-4xl font-black uppercase italic tracking-tighter transition-colors ${theme === 'cyber' ? 'text-emerald-500 hover:text-emerald-300' : 'text-zinc-900 hover:text-zinc-500'}`}
            >
              {item}
            </a>
          ))}
          
          <div className={`w-full h-[1px] my-4 ${theme === 'cyber' ? 'bg-emerald-500/10' : 'bg-zinc-100'}`} />
          
          <div className="space-y-6 w-full max-w-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">Select Theme</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'light', icon: Sun, label: 'Standard' },
                { id: 'dark', icon: Moon, label: 'Stealth' },
                { id: 'cyber', icon: Terminal, label: 'Cyber' },
                { id: 'midnight', icon: Palette, label: 'Midnight' }
              ].map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`flex flex-col items-center gap-2 py-3 px-4 rounded-2xl border transition-all ${theme === t.id ? (theme === 'cyber' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-zinc-900 border-zinc-900 text-white shadow-xl') : (theme === 'cyber' ? 'border-emerald-500/20 text-emerald-500' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50')}`}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 w-full max-w-sm">
            <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="w-full">
              <Button className={`w-full h-16 rounded-2xl font-black uppercase italic tracking-widest text-lg ${currentTheme.button}`}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>


      <main>
        {/* Hero Section */}
        <section className="pt-32 md:pt-48 pb-20 px-6 md:px-16 lg:px-24 overflow-hidden relative">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-70 transition-colors duration-700 ${theme === 'cyber' ? 'bg-[radial-gradient(50%_50%_at_50%_50%,rgba(16,185,129,0.15)_0%,rgba(0,0,0,0)_100%)]' : theme === 'midnight' ? 'bg-[radial-gradient(50%_50%_at_50%_50%,rgba(37,99,235,0.15)_0%,rgba(0,0,0,0)_100%)]' : 'bg-[radial-gradient(50%_50%_at_50%_50%,rgba(16,185,129,0.08)_0%,rgba(255,255,255,0)_100%)]'}`} />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 lg:gap-32 items-center">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 xl:col-span-8 z-20 text-center lg:text-left"
            >
              <motion.div variants={itemVariants} className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 md:mb-10 border transition-colors ${currentTheme.muted} ${theme === 'cyber' ? 'border-emerald-500/20' : 'border-zinc-200/80'}`}>
                <span className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] ${theme === 'midnight' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest italic ${theme === 'cyber' ? 'text-emerald-500' : 'text-zinc-700'}`}>System Active • May 2026</span>
              </motion.div>
              
              <div className="relative mb-10 md:mb-12">
                <motion.h1 
                  variants={itemVariants} 
                  className="text-4xl sm:text-5xl md:text-8xl lg:text-7xl xl:text-[9rem] font-black uppercase italic tracking-tighter leading-[0.85] relative z-20 transition-colors"
                >
                  Supply <br />
                  Chain <br />
                  <span className={`transition-colors ${theme === 'light' ? 'text-zinc-300/80' : theme === 'cyber' ? 'text-emerald-800/40' : 'text-zinc-800/50'}`}>Simplified.</span>
                </motion.h1>
                <div className={`absolute -top-10 -left-2 md:-top-14 md:-left-14 text-6xl md:text-[13rem] font-black select-none -z-10 italic tracking-tighter leading-none pointer-events-none transition-colors ${theme === 'light' ? 'text-zinc-100/50' : theme === 'cyber' ? 'text-emerald-950/30' : 'text-zinc-900/40'}`}>
                  TRACK
                </div>
              </div>

              <motion.p variants={itemVariants} className={`text-base md:text-xl font-medium max-w-xl mx-auto lg:mx-0 mb-10 md:mb-14 leading-relaxed transition-colors ${currentTheme.subText}`}>
                The high-speed operating system for your business. TracksUp connects everything
                with absolute precision, making delivery and management effortless.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button className={`w-full sm:w-auto h-16 md:h-20 px-10 md:px-14 rounded-2xl md:rounded-3xl font-black uppercase italic tracking-widest text-lg md:text-xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] group border-none ${currentTheme.button}`}>
                    Get Started
                    <ArrowRight className="ml-2 h-6 md:h-7 w-6 md:w-7 transition-transform group-hover:translate-x-1.5" />
                  </Button>
                </Link>
                <Button variant="outline" className={`w-full sm:w-auto h-16 md:h-20 px-10 md:px-14 rounded-2xl md:rounded-3xl font-black uppercase italic tracking-widest text-lg md:text-xl border-[2px] md:border-[3px] group transition-all ${theme === 'cyber' ? 'border-emerald-900/50 bg-transparent text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500' : 'border-zinc-100 hover:border-zinc-900 bg-transparent hover:bg-zinc-50'}`}>
                  Documentation
                  <Database className="ml-2 h-5 md:h-6 w-5 md:w-6 opacity-50 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-16 md:mt-24 flex flex-col sm:flex-row items-center gap-6 md:gap-10">
                <div className="flex -space-x-3 md:-space-x-5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ y: -5, scale: 1.1, zIndex: 10 }}
                        className={`h-12 w-12 md:h-16 md:w-16 rounded-full border-2 md:border-4 shadow-2xl overflow-hidden transition-all cursor-pointer relative ${theme === 'cyber' ? 'border-emerald-500/20' : 'border-white'}`}
                    >
                        <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="avatar" className={`h-full w-full object-cover transition-all ${theme === 'light' ? 'grayscale hover:grayscale-0' : 'brightness-75 hover:brightness-100'}`} referrerPolicy="no-referrer" />
                    </motion.div>
                  ))}
                  <div className={`h-12 w-12 md:h-16 md:w-16 rounded-full border-2 md:border-4 shadow-2xl flex items-center justify-center text-[8px] md:text-[10px] font-black italic ${theme === 'cyber' ? 'border-emerald-500/20 bg-emerald-500/20 text-emerald-400' : 'border-white bg-zinc-900 text-white'}`}>
                    +12K
                  </div>
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                    <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest italic font-mono transition-colors ${currentTheme.subText}`}>
                    Enterprise Tier Access
                    </p>
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                        <span className={`h-2 w-2 rounded-full animate-pulse ${theme === 'midnight' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                        <p className={`text-xs md:text-sm font-bold leading-none transition-colors ${currentTheme.text}`}>12.8M Nodes Synchronized</p>
                    </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="lg:col-span-5 xl:col-span-4 relative w-full max-w-[400px] mx-auto lg:max-w-none"
            >
              <div className={`relative z-10 aspect-[4/5.5] rounded-[5rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.2)] p-6 border group overflow-hidden transition-colors duration-700 ${currentTheme.card}`}>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
                <div className={`h-full w-full rounded-[4.2rem] border flex flex-col p-10 md:p-12 relative z-10 transition-colors duration-700 ${currentTheme.muted} border-opacity-50`}>
                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-3">
                            <div className={`h-3 w-40 rounded-full ${currentTheme.text} transition-colors`} />
                            <div className={`h-3 w-24 rounded-full opacity-20 ${currentTheme.text} transition-colors`} />
                        </div>
                        <motion.div 
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className={`h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-2xl border transform group-hover:scale-110 transition-all relative group/icon ${currentTheme.bg} ${theme === 'cyber' ? 'border-emerald-500/20' : 'border-zinc-50'}`}
                        >
                            <Activity className={`h-10 w-10 group-hover/icon:animate-bounce transition-colors ${currentTheme.accent}`} />
                            <div className={`absolute inset-0 rounded-[2rem] border-2 animate-ping opacity-30 ${theme === 'midnight' ? 'border-blue-500' : 'border-emerald-500'}`} />
                        </motion.div>
                    </div>
                    
                    <div className="flex-1 space-y-5">
                        {[
                            { label: "System Reliability", val: "99.98%", color: currentTheme.accent, icon: ShieldCheck, trend: "+0.02%" },
                            { label: "Fast Syncing", val: "14ms", color: currentTheme.text, icon: Zap, trend: "-2ms" },
                            { label: "Data Storage", val: "4.2TB", color: currentTheme.text, icon: Database, trend: "Stable" }
                        ].map((stat, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + (i * 0.1) }}
                                className={`flex justify-between items-center py-5 border-b last:border-none group/stat transition-colors ${theme === 'cyber' ? 'border-emerald-500/10' : 'border-zinc-100'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center group-hover/stat:bg-emerald-500 group-hover/stat:text-black transition-all ${currentTheme.bg} border ${theme === 'cyber' ? 'border-emerald-500/20' : 'border-zinc-200'}`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <span className={`text-[11px] font-black uppercase tracking-widest italic block leading-none transition-colors truncate ${currentTheme.subText}`}>{stat.label}</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-tighter block ${theme === 'midnight' ? 'text-blue-400' : 'text-emerald-600'}`}>{stat.trend}</span>
                                    </div>
                                </div>
                                <span className={`text-2xl font-black italic tracking-tighter transition-colors flex-shrink-0 ml-4 ${currentTheme.text}`}>{stat.val}</span>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        whileHover={{ scale: 1.02 }}
                        className={`mt-10 rounded-[3rem] p-10 flex items-center gap-10 shadow-3xl relative overflow-hidden group/cta transition-colors ${theme === 'cyber' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-900 border-none'}`}
                    >
                        <div className={`absolute -right-5 -bottom-5 p-4 opacity-5 group-hover/cta:scale-125 transition-transform ${theme === 'cyber' ? 'text-emerald-500' : 'text-white'}`}>
                            <Truck className="h-44 w-44" />
                        </div>
                        <div className={`h-20 w-20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 group-hover/cta:rotate-6 transition-transform ${theme === 'cyber' ? 'bg-emerald-500/20 border-emerald-500/20' : 'bg-white/10'}`}>
                            <Box className={`h-10 w-10 ${theme === 'cyber' ? 'text-emerald-400' : 'text-white'}`} />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-end">
                                <div className={`h-3 w-1/2 rounded-full ${theme === 'midnight' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                                <span className={`text-[10px] font-black italic uppercase tracking-widest ${theme === 'cyber' ? 'text-emerald-500' : 'text-white'}`}>LIVE</span>
                            </div>
                            <div className={`h-3 w-full rounded-full overflow-hidden ${theme === 'cyber' ? 'bg-emerald-500/10' : 'bg-white/10'}`}>
                                <motion.div 
                                    className={`h-full ${theme === 'midnight' ? 'bg-blue-400' : 'bg-emerald-400'}`} 
                                    animate={{ width: ["0%", "100%"] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
              </div>
              
              <div className={`absolute -top-32 -right-32 h-[30rem] w-[30rem] rounded-full blur-[140px] -z-10 animate-pulse transition-colors duration-1000 ${theme === 'cyber' ? 'bg-emerald-500/10' : theme === 'midnight' ? 'bg-blue-500/10' : 'bg-emerald-50/50'}`} />
              <div className={`absolute -bottom-32 -left-32 h-[30rem] w-[30rem] rounded-full blur-[140px] -z-10 transition-colors duration-1000 ${theme === 'cyber' ? 'bg-emerald-500/5' : 'bg-zinc-100'}`} />
              
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -top-10 -right-10 h-32 w-32 rounded-3xl shadow-2xl flex items-center justify-center rotate-12 z-20 border hidden xl:flex transition-colors ${currentTheme.bg} ${theme === 'cyber' ? 'border-emerald-500/20' : 'border-zinc-100'}`}
              >
                 <Zap className={`h-16 w-16 transition-colors ${currentTheme.accent} fill-emerald-500/10`} />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Step by Step */}
        <section id="protocols" className={`py-32 px-6 md:px-16 lg:px-24 border-t overflow-hidden transition-colors duration-700 ${currentTheme.bg} ${theme === 'cyber' ? 'border-emerald-500/10' : 'border-zinc-100'}`}>
          <div className="max-w-7xl mx-auto">
             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-24">
                <div className="space-y-4">
                  <h2 className={`text-[10px] font-black uppercase tracking-[0.5em] italic ${theme === 'midnight' ? 'text-blue-500' : 'text-emerald-500'}`}>Process Flow</h2>
                  <h3 className={`text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none ${currentTheme.text}`}>Reliable Deliveries</h3>
                </div>
                <p className={`font-medium max-w-sm text-lg transition-colors ${currentTheme.subText}`}>From warehouse dispatch to storefront delivery—every step is tracked and verified.</p>
             </div>

             <div className="relative">
                <div className={`hidden lg:block absolute top-10 left-0 w-full h-[1px] -z-10 transition-colors ${theme === 'cyber' ? 'bg-emerald-500/10' : 'bg-zinc-100'}`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                  <FlowStep 
                    icon={Building2} 
                    step="01" 
                    title="Order Created" 
                    desc="Supplier sets up the order and product information." 
                    theme={theme}
                  />
                  <FlowStep 
                    icon={Truck} 
                    step="02" 
                    title="Driver Ready" 
                    desc="Delivery driver verifies the items and starts the route." 
                    theme={theme}
                  />
                  <FlowStep 
                    icon={ShieldCheck} 
                    step="03" 
                    title="Out for Delivery" 
                    desc="Real-time tracking of the delivery as it travels to the store." 
                    theme={theme}
                  />
                  <FlowStep 
                    icon={Store} 
                    step="04" 
                    title="Delivery Confirmed" 
                    desc="Retailer confirms arrival, completing the order process." 
                    theme={theme}
                  />
                </div>
             </div>
          </div>
        </section>

        {/* Testimonials Protocol */}
        <section id="testimonials" className={`py-40 px-6 md:px-16 lg:px-24 relative overflow-hidden transition-colors duration-700 ${currentTheme.muted}`}>
           <div className={`absolute top-0 right-0 p-8 md:p-12 opacity-[0.03] italic font-black text-[10rem] md:text-[20rem] uppercase tracking-tighter -rotate-90 pointer-events-none select-none ${currentTheme.text}`}>
            TRUST
          </div>
           <div className="max-w-7xl mx-auto relative z-10">
             <div className="flex flex-col items-center text-center mb-24 space-y-6">
                <h2 className={`text-[10px] font-black uppercase tracking-[1em] italic ${theme === 'midnight' ? 'text-blue-500' : 'text-emerald-500'}`}>Network Validation</h2>
                <h3 className={`text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none ${currentTheme.text}`}>
                    Trusted By The <span className={`${theme === 'light' ? 'text-zinc-200' : theme === 'cyber' ? 'text-emerald-950' : 'text-zinc-800'}`}>Global Elite</span>
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TestimonialCard 
                    quote="The TracksUp protocol transformed our distribution lag from days to minutes. It is the gold standard for high-velocity logistics."
                    author="Marcus Vane"
                    role="Chief Logistics Officer"
                    company="Global Transit"
                    theme={theme}
                />
                <TestimonialCard 
                    quote="Never seen a dashboard this clean or a backend this stable. Our retailers refuse to use anything else. Unmatched synchronization."
                    author="Sarah Chen"
                    role="Director of Operations"
                    company="Vanguard Retail"
                    theme={theme}
                />
                <TestimonialCard 
                    quote="Cryptographic proof-of-delivery changed the game for our agents. Payments are handled instantly, and trust is baked into the code."
                    author="Julian Thorne"
                    role="Network Commander"
                    company="Direct-Node"
                    theme={theme}
                />
             </div>
           </div>
        </section>

        {/* Role Breakdown Grid */}
        <section id="network" className={`py-20 md:py-32 px-6 md:px-16 lg:px-24 relative overflow-hidden transition-colors duration-700 ${currentTheme.bg}`}>
          <div className="max-w-7xl mx-auto text-center lg:text-left">
             <div className="flex flex-col items-center text-center mb-16 md:mb-24 space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">User Types</h2>
                <h3 className={`text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none ${currentTheme.text}`}>Accounts for everyone.</h3>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
                <RoleCard 
                  icon={Building2} 
                  role="Supplier Account"
                  title="Suppliers & Distributors"
                  features={[
                      "Real-time Inventory Sync",
                      "Automated Payment Logs",
                      "Team Management Tools",
                      "Order Management Tools",
                      "Fast Payment Gateway"
                  ]}
                  colorClass={theme === 'cyber' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-100 text-zinc-900"}
                  theme={theme}
                />
                <RoleCard 
                  icon={Store} 
                  role="Retailer Account"
                  title="Retailers & Stores"
                  features={[
                      "Live Order Tracking",
                      "Verified Supplier Network",
                      "Delivery Confirmation",
                      "Digital Receipts",
                      "Inventory Alerts"
                  ]}
                  colorClass={theme === 'cyber' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-100 text-zinc-900"}
                  theme={theme}
                />
                <RoleCard 
                  icon={Package2} 
                  role="Employee Account"
                  title="Delivery Staff"
                  features={[
                      "Daily Tasks List",
                      "Route Optimization",
                      "Proof of Delivery",
                      "Quick Payment Processing",
                      "Performance Tracking"
                  ]}
                  colorClass={theme === 'cyber' ? "bg-emerald-500 text-black" : "bg-zinc-900 text-white"}
                  theme={theme}
                />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className={`py-20 md:py-40 px-6 md:px-16 lg:px-24 relative transition-colors duration-700 ${currentTheme.bg}`}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center text-center mb-16 md:mb-24 space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[1em] text-rose-500 italic text-center">Pricing</h2>
                    <h3 className={`text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none ${currentTheme.text} text-center`}>
                        Strategic <span className={`${theme === 'light' ? 'text-zinc-200' : theme === 'cyber' ? 'text-emerald-950' : 'text-zinc-800'}`}>Scale</span>
                    </h3>
                    <p className={`font-medium max-w-xl text-base md:text-lg transition-colors ${currentTheme.subText} text-center`}>Predictable pricing for your business. Grow your network with ease.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <PricingCard 
                        plan="Starter"
                        price="$0"
                        description="Ideal for individuals and single stores starting out with TracksUp."
                        features={[
                            "5 Orders per month",
                            "1 Supplier Account",
                            "Standard App Access",
                            "Driver Mobile App"
                        ]}
                        theme={theme}
                    />
                    <PricingCard 
                        plan="Professional"
                        price="$299"
                        description="For growing businesses scaling their operations across multiple locations."
                        highlighted={true}
                        features={[
                            "Unlimited Orders",
                            "10 Branch Accounts",
                            "Real-time Tracking",
                            "Full API Access",
                            "Priority Support"
                        ]}
                        theme={theme}
                    />
                    <PricingCard 
                        plan="Enterprise"
                        price="Custom"
                        description="Full-scale solution for global supply chains with high-volume needs."
                        features={[
                            "Unlimited Accounts",
                            "Custom Branding",
                            "Business Software Sync",
                            "24/7 Support",
                            "Dedicated Account Manager"
                        ]}
                        theme={theme}
                    />
                </div>
            </div>
        </section>

        {/* Integration Section */}
        <section id="integrations" className={`py-40 px-6 md:px-16 lg:px-24 transition-colors duration-700 ${currentTheme.muted}`}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className="relative">
                    <div className="grid grid-cols-2 gap-8">
                        {[Database, Globe, ShieldCheck, Zap].map((Icon, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className={`p-10 rounded-[3.5rem] flex items-center justify-center transition-all ${i % 2 === 0 ? 'bg-zinc-900 shadow-2xl' : currentTheme.bg + ' lg:rotate-6 border ' + (theme === 'cyber' ? 'border-emerald-500/20' : 'border-zinc-100')}`}
                            >
                                <Icon className={`h-12 w-12 ${i % 2 === 0 ? 'text-white' : currentTheme.text}`} />
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div className="space-y-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 italic">Integrations</h3>
                    <h2 className={`text-5xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] ${currentTheme.text}`}>Connect your business.</h2>
                    <p className={`text-xl font-medium leading-relaxed transition-colors ${currentTheme.subText}`}>
                        TracksUp provides easy integrations with your existing systems, 
                        automating your entire delivery process and data syncing.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div>
                            <h4 className={`text-xs font-black uppercase tracking-widest mb-3 italic transition-colors ${currentTheme.text}`}>Webhooks</h4>
                            <p className={`text-sm font-medium leading-relaxed transition-colors ${currentTheme.subText}`}>Get alerts for every order update as it happens.</p>
                        </div>
                        <div>
                            <h4 className={`text-xs font-black uppercase tracking-widest mb-3 italic transition-colors ${currentTheme.text}`}>Developer Tools</h4>
                            <p className={`text-sm font-medium leading-relaxed transition-colors ${currentTheme.subText}`}>Connect easily with our specialized developer libraries.</p>
                        </div>
                    </div>
                    <Button variant="link" className={`p-0 h-auto font-black uppercase italic tracking-[0.2em] hover:text-emerald-600 group transition-colors ${currentTheme.text}`}>
                        Explore Developer Portal
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </div>
        </section>

        {/* Final CTA */}
        <section className={`py-24 md:py-48 px-6 md:px-16 lg:px-24 overflow-hidden relative transition-colors duration-700 ${theme === 'cyber' ? 'bg-black' : (theme === 'midnight' ? 'bg-blue-950' : 'bg-zinc-900')} text-white`}>
          <div className="absolute inset-0 opacity-10">
             <div className={`absolute -top-1/2 -left-1/4 w-[150%] h-[150%] ${theme === 'cyber' ? 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.3)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.2)_0%,transparent_70%)]'}`}></div>
          </div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-8 md:space-y-12"
            >
                <h2 className={`text-4xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.8] ${theme === 'cyber' ? 'text-emerald-400' : ''}`}>
                Ready to simplify <br /> your business?
                </h2>
                <p className={`text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed ${theme === 'cyber' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                Join the 12,000+ organizations already using TracksUp to manage their deliveries.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center pt-8">
                    <Link to="/auth">
                        <Button className={`h-16 md:h-24 px-10 md:px-20 rounded-2xl md:rounded-[2.5rem] font-black uppercase italic tracking-widest text-lg md:text-2xl shadow-[0_20px_80px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 group ${theme === 'cyber' ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white text-zinc-900'}`}>
                            Get Started
                            <ArrowRight className="ml-3 h-6 md:h-8 w-6 md:w-8 transition-transform group-hover:translate-x-2" />
                        </Button>
                    </Link>
                    <Button variant="outline" className={`h-16 md:h-24 px-10 md:px-20 rounded-2xl md:rounded-[2.5rem] border-[2px] md:border-[3px] bg-transparent font-black uppercase italic tracking-widest text-lg md:text-2xl transition-all ${theme === 'cyber' ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500' : 'border-white/10 text-white hover:bg-white/10 hover:border-white'}`}>
                    Watch Demo
                    </Button>
                </div>
            </motion.div>
          </div>
          
          <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20 text-[10px] font-black uppercase tracking-[1em] italic whitespace-nowrap ${theme === 'cyber' ? 'text-emerald-500' : ''}`}>
            System Status: Ready
          </div>
        </section>
      </main>

      <footer className={`py-32 px-6 md:px-16 lg:px-24 border-t transition-colors duration-700 ${currentTheme.bg} ${theme === 'cyber' ? 'border-emerald-500/10' : 'border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-16 md:gap-12">
            <div className="space-y-8 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white rotate-3 ${theme === 'light' ? 'bg-zinc-900' : 'bg-emerald-500'}`}>
                        <Package2 className="h-6 w-6" />
                    </div>
                    <span className={`text-2xl font-black italic tracking-tighter uppercase ${currentTheme.text}`}>TracksUp</span>
                </div>
                <p className={`text-sm leading-relaxed font-medium transition-colors ${currentTheme.subText}`}> The global system for simple logistics and supply chain tracking. </p>
                <div className="flex gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${currentTheme.muted} text-zinc-500 hover:text-emerald-500`}>
                        <Globe className="h-4 w-4" />
                    </div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${currentTheme.muted} text-zinc-500 hover:text-emerald-500`}>
                        <Users className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic ${currentTheme.text}`}>Platform</h4>
                <ul className="space-y-4">
                    {["Process", "Infrastructure", "Pricing", "API Docs", "Changelog"].map(l => (
                        <li key={l}><a href="#" className={`text-xs font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors ${currentTheme.subText}`}>{l}</a></li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic ${currentTheme.text}`}>Network</h4>
                <ul className="space-y-4">
                    {["Suppliers", "Retailers", "Logistics", "Governments"].map(l => (
                        <li key={l}><a href="#" className={`text-xs font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors ${currentTheme.subText}`}>{l}</a></li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic ${currentTheme.text}`}>Legal Compliance</h4>
                <ul className="space-y-4">
                    {["Security", "Privacy Policy", "Terms of Service", "Status"].map(l => (
                        <li key={l}><a href="#" className={`text-xs font-bold uppercase tracking-widest hover:text-emerald-500 transition-colors ${currentTheme.subText}`}>{l}</a></li>
                    ))}
                </ul>
            </div>
        </div>
        <div className={`max-w-7xl mx-auto pt-20 mt-20 border-t flex flex-col items-center gap-6 ${theme === 'cyber' ? 'border-emerald-500/10' : 'border-zinc-200'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic text-center">
               © 2026 TracksUp Logistics • All Rights Reserved
            </p>
        </div>
      </footer>
    </div>
  );
};
