"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, BookOpen, Building2, Settings, LogOut,
  Users, GraduationCap, FileCheck, ShieldCheck, CheckCircle2,
  Image as ImageIcon, Search, Calendar, Trophy, Activity
} from "lucide-react";
import RegisterForm from "./RegisterForm";

// --- MOCK DATA ---
const mockData = {
  universityName: "Stanford University",
  registrationNumber: "REG-2023-XYZ",
  status: "Profile Live", // 'Profile Live' | 'Pending Verification'
  description: "Stanford University is a private research university in Stanford, California. The campus occupies 8,180 acres, among the largest in the United States, and enrolls over 17,000 students. It is considered one of the most prestigious universities in the world.",
  rankingScore: 98.5,
  stats: {
    totalStudents: 17326,
    totalStaff: 2288,
    totalCourses: 145,
    totalColleges: 7,
    affiliatedColleges: 3,
    totalBlogs: 0,
    totalEvents: 0,
    totalAwards: 0
  },
  recentActivity: [] as { id: number; type: string; title: string; time: string; icon: string }[],
  courses: [
    { id: 1, name: "B.Tech Computer Science", college: "School of Engineering", fee: "$65,000/yr" },
    { id: 2, name: "MBA Finance", college: "Graduate School of Business", fee: "$75,000/yr" },
    { id: 3, name: "B.Sc Physics", college: "School of Humanities & Sciences", fee: "$60,000/yr" },
    { id: 4, name: "MD Medicine", college: "School of Medicine", fee: "$85,000/yr" },
  ],
  colleges: [
    "School of Engineering",
    "Graduate School of Business",
    "School of Medicine",
    "School of Law",
    "School of Humanities & Sciences"
  ],
  gallery: [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=400"
  ]
};

// --- COMPONENTS ---

const Sidebar = ({ activeTab, setActiveTab, onLogout, onRegister }: any) => {
  const tabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="w-64 bg-[#1A365D] min-h-screen text-white flex flex-col fixed left-0 top-0 bottom-0 shadow-2xl z-20">
      <div className="p-6 border-b border-white/10 flex items-center space-x-3 bg-white/5 backdrop-blur-sm">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold leading-tight tracking-wide">Admin Portal</h2>
          <p className="text-blue-200 text-xs font-medium">University Manager</p>
        </div>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider mb-4 ml-2">Menu</div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeTab === tab.id 
                ? "bg-white text-[#1A365D] shadow-lg font-bold translate-x-1" 
                : "text-blue-100/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-[#1A365D]" : ""}`} />
            <span>{tab.label}</span>
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            onClick={onRegister}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-white text-[#1A365D] hover:bg-gray-100 transition-all duration-300 font-bold shadow-md"
          >
            <Building2 className="w-5 h-5" />
            <span>+ Register University</span>
          </button>
        </div>
      </nav>

      <div className="p-6 border-t border-white/10 bg-black/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-300 hover:bg-red-500/20 hover:text-red-100 rounded-xl transition-all font-bold border border-transparent hover:border-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md flex items-center justify-between group transition-all duration-300"
  >
    <div>
      <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-black text-[#1A365D] tracking-tight">{value}</h3>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
      <Icon className="w-7 h-7" />
    </div>
  </motion.div>
);

const MainContent = ({ data }: { data: typeof mockData }) => {
  return (
    <div className="space-y-8 pb-10">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={data.stats.totalStudents.toLocaleString()} icon={Users} color="bg-blue-50 text-blue-600 border border-blue-100" />
        <StatCard title="Total Staff" value={data.stats.totalStaff.toLocaleString()} icon={GraduationCap} color="bg-emerald-50 text-emerald-600 border border-emerald-100" />
        <StatCard title="Courses Offered" value={data.stats.totalCourses.toString()} icon={BookOpen} color="bg-amber-50 text-amber-600 border border-amber-100" />
        <StatCard title="Total Colleges" value={data.stats.totalColleges.toString()} icon={Building2} color="bg-purple-50 text-purple-600 border border-purple-100" />
        <StatCard title="Affiliated Colleges" value={data.stats.affiliatedColleges.toString()} icon={Building2} color="bg-indigo-50 text-indigo-600 border border-indigo-100" />
        <StatCard title="Blogs Posted" value={data.stats.totalBlogs.toString()} icon={BookOpen} color="bg-orange-50 text-orange-600 border border-orange-100" />
        <StatCard title="Events Hosted" value={data.stats.totalEvents.toString()} icon={Calendar} color="bg-pink-50 text-pink-600 border border-pink-100" />
        <StatCard title="Awards & Recognitions" value={data.stats.totalAwards.toString()} icon={Trophy} color="bg-yellow-50 text-yellow-600 border border-yellow-100" />
      </div>

      {/* 1. About Section - Full Width */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full"
      >
        <div className="bg-[#1A365D] p-4 flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">About University</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="inline-block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration Code</p>
            <p className="text-[#1A365D] font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">{data.registrationNumber}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
            <p className="text-slate-600 leading-relaxed text-sm font-medium">{data.description}</p>
          </div>
        </div>
      </motion.div>

      {/* 2. Colleges & Media Grid (Side by side for better space usage, or stack them) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Affiliated Colleges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="bg-[#1A365D] p-4 flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Affiliated Colleges</h3>
          </div>
          <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto p-2 bg-slate-50 min-h-[300px]">
            {data.colleges.map((college, idx) => (
              <li key={idx} className="px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center transition-colors cursor-default mb-1 bg-white border border-slate-100 shadow-sm">
                <div className="w-2.5 h-2.5 bg-[#1A365D]/20 rounded-full mr-3 border border-[#1A365D]/40" />
                {college}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Media Gallery */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="bg-[#1A365D] p-4 flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Media Gallery</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50 flex-1 content-start min-h-[300px]">
            {data.gallery.map((img, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm relative group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1" />
                <div className="absolute inset-0 bg-[#1A365D]/0 group-hover:bg-[#1A365D]/10 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 3. Courses and Recently Added (Below the rest) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Courses & Fees Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="bg-[#1A365D] p-4 flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Courses & Fees</h3>
          </div>
          <div className="overflow-x-auto flex-1 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Course Name</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">College</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-[#1A365D]">{course.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{course.college}</td>
                    <td className="px-6 py-4 text-slate-900 font-black text-right bg-slate-50/50 group-hover:bg-slate-100/50">{course.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recently Added (Scrolling Section) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="bg-[#1A365D] p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Recently Added</h3>
            </div>
          </div>
          <div className="overflow-y-auto bg-slate-50 p-4 space-y-3 flex-1 min-h-[300px] max-h-[400px] flex flex-col">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((item) => {
                const Icon = item.icon === "BookOpen" ? BookOpen : item.icon === "Calendar" ? Calendar : Trophy;
                const iconColor = item.type === "Blog" ? "text-orange-600 bg-orange-100" : item.type === "Event" ? "text-pink-600 bg-pink-100" : "text-yellow-600 bg-yellow-100";
                
                return (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow flex items-start space-x-4 transition-all">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.type}</span>
                        <span className="text-[10px] font-bold text-slate-400">{item.time}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Activity className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-slate-800 font-bold mb-1">No Activity Yet</h4>
                <p className="text-sm text-slate-500 font-medium">You haven't added any blogs, events, or awards yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDataPopulated, setIsDataPopulated] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        onRegister={() => setActiveTab("register")}
      />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#1A365D] rounded-xl flex items-center justify-center shadow-inner text-white font-black text-xl tracking-tighter">
              {isDataPopulated ? "SU" : "NU"}
            </div>
            <div>
              <h1 className="text-xl font-black text-[#1A365D] tracking-tight">
                {isDataPopulated ? mockData.universityName : "New University"}
              </h1>
              <div className="flex items-center mt-1">
                {isDataPopulated ? (
                  <>
                    {mockData.status === "Profile Live" ? (
                      <span className="flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {mockData.status}
                      </span>
                    ) : (
                      <span className="flex items-center text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                        {mockData.status}
                      </span>
                    )}
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="flex items-center text-[11px] font-bold text-[#1A365D] bg-[#1A365D]/10 px-2.5 py-0.5 rounded-full border border-[#1A365D]/20 uppercase tracking-wider">
                      AUR Score: {mockData.rankingScore}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                    Registration Pending
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#1A365D] transition-colors">Admin User</p>
                <p className="text-xs text-slate-500 font-medium">admin@stanford.edu</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Admin" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 p-8">
          {activeTab === "overview" && isDataPopulated && <MainContent data={mockData} />}
          {activeTab === "overview" && !isDataPopulated && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[70vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
            >
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 border border-slate-200 shadow-sm relative">
                <Building2 className="w-12 h-12 text-[#1A365D]" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm">!</div>
              </div>
              <h2 className="text-3xl font-black text-[#1A365D] mb-4">Welcome to Your Dashboard!</h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-8 text-lg">
                It looks like your university profile hasn't been set up yet. To get started, please register your university to unlock all dashboard features and statistics.
              </p>
              <button
                onClick={() => setActiveTab("register")}
                className="px-8 py-4 bg-[#1A365D] text-white rounded-xl font-bold hover:bg-[#122540] transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Building2 className="w-5 h-5" />
                <span>Register University Now</span>
              </button>
            </motion.div>
          )}
          {activeTab === "register" && <RegisterForm onSuccess={() => {
            setIsDataPopulated(true);
            setActiveTab("overview");
          }} />}
          {activeTab !== "overview" && activeTab !== "register" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[60vh] flex items-center justify-center"
            >
              <div className="text-center bg-white p-12 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <Settings className="w-10 h-10 text-slate-300 animate-spin" />
                </div>
                <h2 className="text-2xl font-black text-[#1A365D] mb-2 capitalize">{activeTab} Module</h2>
                <p className="text-slate-500 font-medium leading-relaxed">This section of the dashboard is currently under construction and will be available soon.</p>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
