"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, Image as ImageIcon, Users, BookOpen,
  Plus, Trash2, CheckCircle2, Save, LogOut, ArrowLeft
} from "lucide-react";
import {
  clearAdminToken,
  getAdminToken,
  registerUniversity,
  verifyAdmin,
} from "../../lib/admin-api";

type Course = {
  name: string;
  college: string;
  fee: string;
};

export default function RegisterUniversity() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    description: "",
    registrationNumber: "",
    rankingScore: "",
  });
  const [demographics, setDemographics] = useState({
    students: "",
    staff: "",
  });
  const [colleges, setColleges] = useState<string[]>([""]);
  const [courses, setCourses] = useState<Course[]>([{ name: "", college: "", fee: "" }]);

  // Dummy file state for UI representation
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [galleryCount, setGalleryCount] = useState(0);

  useEffect(() => {
    // Route protection — verify the admin JWT with the backend.
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    verifyAdmin()
      .then(() => setLoading(false))
      .catch(() => {
        clearAdminToken();
        router.replace("/admin/login");
      });
  }, [router]);

  // Handlers for dynamic arrays
  const addCollege = () => setColleges([...colleges, ""]);
  const updateCollege = (index: number, value: string) => {
    const newColleges = [...colleges];
    newColleges[index] = value;
    setColleges(newColleges);
  };
  const removeCollege = (index: number) => {
    if (colleges.length > 1) {
      setColleges(colleges.filter((_, i) => i !== index));
    }
  };

  const addCourse = () => setCourses([...courses, { name: "", college: "", fee: "" }]);
  const updateCourse = (index: number, field: keyof Course, value: string) => {
    const newCourses = [...courses];
    newCourses[index][field] = value;
    setCourses(newCourses);
  };
  const removeCourse = (index: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index));
    }
  };

  // Validation
  const isFormValid = () => {
    if (!basicInfo.name || !basicInfo.description || !basicInfo.registrationNumber || !basicInfo.rankingScore) return false;
    if (!demographics.students || !demographics.staff) return false;
    if (colleges.some(c => !c.trim())) return false;
    if (courses.some(c => !c.name.trim() || !c.college.trim() || !c.fee.trim())) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!isFormValid()) return;

    setSubmitting(true);
    try {
      await registerUniversity({
        name: basicInfo.name.trim(),
        registration_code: basicInfo.registrationNumber.trim(),
        ranking_score: Number(basicInfo.rankingScore),
        description: basicInfo.description.trim(),
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 2000);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to register university."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#1A365D] bg-slate-50">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 w-full bg-slate-50 min-h-screen text-slate-900">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-200 pb-6">
        <div>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#1A365D] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-[#1A365D] mb-2 tracking-tight">University Registration</h1>
          <p className="text-slate-500 font-medium">Add a new university profile to the platform.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-colors text-sm font-semibold border border-slate-200 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 font-semibold text-sm">
          {submitError}
        </div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl mb-8 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <div>
              <h3 className="text-lg font-bold text-emerald-800">Registration Successful</h3>
              <p className="text-emerald-700 text-sm mt-1 font-medium">The university profile has been added to the system. Redirecting...</p>
            </div>
          </div>
          <button 
            onClick={() => router.push("/admin/dashboard")}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Go to Dashboard
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Info */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#1A365D] p-4 flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">1. Basic Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">University Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] shadow-sm"
                  placeholder="e.g. Stanford University"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Registration Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={basicInfo.registrationNumber}
                  onChange={(e) => setBasicInfo({...basicInfo, registrationNumber: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] shadow-sm"
                  placeholder="e.g. REG-2023-XYZ"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Ranking Score <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={basicInfo.rankingScore}
                  onChange={(e) => setBasicInfo({...basicInfo, rankingScore: e.target.value})}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] shadow-sm"
                  placeholder="e.g. 85.5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Description <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={4}
                value={basicInfo.description}
                onChange={(e) => setBasicInfo({...basicInfo, description: e.target.value})}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] resize-y shadow-sm"
                placeholder="Detailed description of the university..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Media Uploads */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#1A365D] p-4 flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">2. Media Uploads</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">University Logo</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0]?.name || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-[#1A365D] transition-colors mb-3" />
                <p className="text-sm text-slate-600 text-center font-medium">
                  {logoFile ? <span className="text-[#1A365D] font-bold">{logoFile}</span> : "Click or drag logo image here"}
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Images / Gallery</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer relative">
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  onChange={(e) => setGalleryCount(e.target.files?.length || 0)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex space-x-[-10px] mb-3">
                  <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-[#1A365D] transition-colors" />
                  <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-[#1A365D]/80 transition-colors" />
                </div>
                <p className="text-sm text-slate-600 text-center font-medium">
                  {galleryCount > 0 ? <span className="text-[#1A365D] font-bold">{galleryCount} files selected</span> : "Click or drag multiple images"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Select multiple files</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Demographics */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#1A365D] p-4 flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">3. Demographics</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Total Number of Students <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min="0"
                value={demographics.students}
                onChange={(e) => setDemographics({...demographics, students: e.target.value})}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] shadow-sm"
                placeholder="e.g. 15000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Total Staff / Faculty <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min="0"
                value={demographics.staff}
                onChange={(e) => setDemographics({...demographics, staff: e.target.value})}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] shadow-sm"
                placeholder="e.g. 2000"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Arrays */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Affiliated Colleges */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-[#1A365D] p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Affiliated Colleges</h2>
              </div>
              <button 
                type="button" 
                onClick={addCollege}
                className="text-white hover:text-slate-200 text-sm font-bold flex items-center bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {colleges.map((college, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => updateCollege(index, e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A365D]/50 focus:border-[#1A365D] shadow-sm"
                      placeholder={`College Name ${index + 1}`}
                    />
                  </div>
                  {colleges.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeCollege(index)}
                      className="mt-1 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Courses & Fees */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-[#1A365D] p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Courses & Fees</h2>
              </div>
              <button 
                type="button" 
                onClick={addCourse}
                className="text-white hover:text-slate-200 text-sm font-bold flex items-center bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>
            <div className="p-6 space-y-6 flex-1">
              {courses.map((course, index) => (
                <div key={index} className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                  {courses.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeCourse(index)}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Course Name</label>
                      <input
                        type="text"
                        required
                        value={course.name}
                        onChange={(e) => updateCourse(index, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. B.Tech Computer Science"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 ml-1">College</label>
                        <input
                          type="text"
                          required
                          value={course.college}
                          onChange={(e) => updateCourse(index, 'college', e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                          placeholder="College offering it"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 ml-1">Fee (per year)</label>
                        <input
                          type="text"
                          required
                          value={course.fee}
                          onChange={(e) => updateCourse(index, 'fee', e.target.value)}
                          className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                          placeholder="e.g. $15,000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 flex items-center justify-end border-t border-slate-200">
          <button
            type="submit"
            disabled={!isFormValid() || submitting}
            className="bg-[#1A365D] hover:bg-[#122540] text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#1A365D]/20"
          >
            <Save className="w-5 h-5" />
            <span>{submitting ? "Saving Profile..." : "Complete Registration"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
