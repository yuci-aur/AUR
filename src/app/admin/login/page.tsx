"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { BrandLogo } from "../../components/BrandLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    // Mock API call
    setTimeout(() => {
      // For mock purposes, any valid-looking input works if it's not empty
      if (email.includes("@") && password.length >= 6) {
        localStorage.setItem("adminToken", "mock-secure-token-12345");
        router.push("/admin/dashboard");
      } else {
        setError("Invalid credentials. Use a valid email and 6+ char password.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1A365D]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-xl">
          
          <div className="flex flex-col items-center mb-8">
            <BrandLogo className="mb-4" />
            <div className="w-16 h-16 bg-[#1A365D]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#1A365D]/20">
              <ShieldCheck className="w-8 h-8 text-[#1A365D]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A365D] tracking-tight">Admin Console</h1>
            <p className="text-slate-500 text-sm mt-1 text-center">
              Sign in to manage universities and platform data
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="overflow-hidden"
              >
                <Alert
                  variant="destructive"
                  className="block bg-red-50 border-red-200 text-red-600 text-sm p-3 rounded-xl text-center"
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-sm font-semibold text-slate-700 ml-1">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-auto w-full bg-white dark:bg-white border border-slate-200 text-slate-900 text-base md:text-base rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] focus-visible:ring-2 focus-visible:ring-[#1A365D]/50 focus-visible:border-[#1A365D] transition-all placeholder:text-slate-400 shadow-sm"
                  placeholder="admin@university.edu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-sm font-semibold text-slate-700 ml-1">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-auto w-full bg-white dark:bg-white border border-slate-200 text-slate-900 text-base md:text-base rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] focus-visible:ring-2 focus-visible:ring-[#1A365D]/50 focus-visible:border-[#1A365D] transition-all placeholder:text-slate-400 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-auto w-full border-0 bg-[#1A365D] hover:bg-[#122540] text-white text-base font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:not-aria-[haspopup]:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-auto group mt-2 shadow-md shadow-[#1A365D]/20 hover:shadow-[#1A365D]/40"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              {!loading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </Button>
          </form>

        </div>
        
        <p className="text-center text-slate-500 text-xs mt-6 font-medium">
          Protected by AES-256 Encryption • Advanced University Ranking
        </p>
      </motion.div>
    </div>
  );
}
