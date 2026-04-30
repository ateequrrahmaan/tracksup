import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Package2, LogIn, UserPlus, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AuthForms = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const [activeTab, setActiveTab] = useState("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message || "Failed to login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      toast.error("Please enter your full name");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        createdAt: new Date().toISOString(),
      });
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl rotate-3 mb-2 transition-transform hover:rotate-0 cursor-default">
            <Package2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 uppercase italic">TracksUp</h1>
          <p className="mt-2 text-zinc-500 font-medium">Precision logistics for modern commerce</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-100 p-1 rounded-xl mb-6">
            <TabsTrigger value="login" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login-animation-wrapper"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="login">
                  <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                    <form onSubmit={handleLogin}>
                      <CardHeader className="space-y-1">
                        <CardTitle className="text-xl font-black uppercase tracking-tight">Welcome Back</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase text-zinc-400">Access your distribution terminal</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="agent@tracksup.io" 
                            required 
                            className="rounded-xl border-zinc-200 focus:ring-primary focus:border-primary transition-all bg-zinc-50/50"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Security Key</Label>
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••"
                              required 
                              className="rounded-xl border-zinc-200 focus:ring-primary focus:border-primary transition-all bg-zinc-50/50"
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button type="submit" className="w-full rounded-xl h-11 font-black uppercase tracking-widest shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
                              Authenticating...
                            </>
                          ) : (
                            <>
                              Establish Link
                              <LogIn className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
              </motion.div>
            ) : (
              <motion.div
                key="signup-animation-wrapper"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="signup">
                  <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
                    <form onSubmit={handleSignup}>
                      <CardHeader className="space-y-1">
                        <CardTitle className="text-xl font-black uppercase tracking-tight">New Operative</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase text-zinc-400">Join the world's fastest distribution network</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Full Name</Label>
                          <Input 
                            id="signup-name" 
                            placeholder="John Maverick" 
                            required 
                            className="rounded-xl border-zinc-200 focus:ring-primary focus:border-primary transition-all bg-zinc-50/50"
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</Label>
                          <Input 
                            id="signup-email" 
                            type="email" 
                            placeholder="agent@tracksup.io" 
                            required 
                            className="rounded-xl border-zinc-200 focus:ring-primary focus:border-primary transition-all bg-zinc-50/50"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Create Security Key</Label>
                          <Input 
                            id="signup-password" 
                            type="password" 
                            placeholder="Min. 8 characters"
                            required 
                            className="rounded-xl border-zinc-200 focus:ring-primary focus:border-primary transition-all bg-zinc-50/50"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                          />
                          {password.length > 0 && (
                            <div className="space-y-1 mt-2">
                              <div className="flex gap-1 h-1.5">
                                {[1, 2, 3, 4].map((i) => (
                                  <div 
                                    key={`strength-${i}`} 
                                    className={`flex-1 rounded-full transition-all duration-500 ${
                                      strength >= i 
                                        ? (strength <= 1 ? "bg-rose-500" : strength <= 2 ? "bg-amber-500" : strength <= 3 ? "bg-blue-500" : "bg-emerald-500") 
                                        : "bg-zinc-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-[9px] font-bold uppercase tracking-tight text-zinc-400">
                                Strength: {strength <= 1 ? "Weak" : strength <= 2 ? "Moderate" : strength <= 3 ? "Strong" : "Exceptional"}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button type="submit" className="w-full rounded-xl h-11 font-black uppercase tracking-widest shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
                              Registering...
                            </>
                          ) : (
                            <>
                              Initialize Profile
                              <UserPlus className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>


        <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
          Secure Terminal v2.4.0 • Distributed Node
        </p>
      </div>
    </div>
  );
};
