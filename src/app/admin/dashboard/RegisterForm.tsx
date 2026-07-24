import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, Image as ImageIcon, Users, BookOpen, 
  Plus, Trash2, CheckCircle2, Save
} from "lucide-react";

type Course = {
  name: string;
  college: string;
  fee: string;
};

type Blog = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  authorId: string;
  category: string;
  tags: string;
  status: string;
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
};

type Event = {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  organizer: string;
  registrationLink: string;
  status: string;
};

type Award = {
  title: string;
  issuingAuthority: string;
  year: string;
  description: string;
  imageUrl: string;
  category: string;
  referenceLink: string;
};

export default function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeDelete, setActiveDelete] = useState<string | null>(null);

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

  const [blogs, setBlogs] = useState<Blog[]>([{ 
    title: "", slug: "", content: "", excerpt: "", imageUrl: "", 
    authorId: "", category: "", tags: "", status: "Draft", 
    publishedAt: "", metaTitle: "", metaDescription: "" 
  }]);
  const [events, setEvents] = useState<Event[]>([{ 
    title: "", slug: "", description: "", imageUrl: "", startDate: "", 
    endDate: "", location: "", category: "", organizer: "", 
    registrationLink: "", status: "Upcoming" 
  }]);
  const [awards, setAwards] = useState<Award[]>([{ 
    title: "", issuingAuthority: "", year: "", description: "", 
    imageUrl: "", category: "", referenceLink: "" 
  }]);

  const addBlog = () => setBlogs([...blogs, { 
    title: "", slug: "", content: "", excerpt: "", imageUrl: "", 
    authorId: "", category: "", tags: "", status: "Draft", 
    publishedAt: "", metaTitle: "", metaDescription: "" 
  }]);
  const updateBlog = (index: number, field: keyof Blog, value: string) => {
    const newBlogs = [...blogs];
    newBlogs[index][field] = value;
    setBlogs(newBlogs);
  };
  const removeBlog = (index: number) => {
    if (blogs.length > 1) setBlogs(blogs.filter((_, i) => i !== index));
  };

  const addEvent = () => setEvents([...events, { 
    title: "", slug: "", description: "", imageUrl: "", startDate: "", 
    endDate: "", location: "", category: "", organizer: "", 
    registrationLink: "", status: "Upcoming" 
  }]);
  const updateEvent = (index: number, field: keyof Event, value: string) => {
    const newEvents = [...events];
    newEvents[index][field] = value;
    setEvents(newEvents);
  };
  const removeEvent = (index: number) => {
    if (events.length > 1) setEvents(events.filter((_, i) => i !== index));
  };

  const addAward = () => setAwards([...awards, { 
    title: "", issuingAuthority: "", year: "", description: "", 
    imageUrl: "", category: "", referenceLink: "" 
  }]);
  const updateAward = (index: number, field: keyof Award, value: string) => {
    const newAwards = [...awards];
    newAwards[index][field] = value;
    setAwards(newAwards);
  };
  const removeAward = (index: number) => {
    if (awards.length > 1) setAwards(awards.filter((_, i) => i !== index));
  };

  // Validation
  const isFormValid = () => {
    if (!basicInfo.name || !basicInfo.description || !basicInfo.registrationNumber || !basicInfo.rankingScore) return false;
    if (!demographics.students || !demographics.staff) return false;
    if (colleges.some(c => !c.trim())) return false;
    if (courses.some(c => !c.name.trim() || !c.college.trim() || !c.fee.trim())) return false;
    
    // Allow blogs, events, and awards to be completely skipped if left empty
    const activeBlogs = blogs.filter(b => b.title.trim() || b.content.trim());
    if (activeBlogs.some(b => !b.title.trim() || !b.content.trim())) return false;

    const activeEvents = events.filter(e => e.title.trim() || e.startDate.trim() || e.description.trim());
    if (activeEvents.some(e => !e.title.trim() || !e.startDate.trim() || !e.description.trim())) return false;

    const activeAwards = awards.filter(a => a.title.trim() || a.year.trim());
    if (activeAwards.some(a => !a.title.trim() || !a.year.trim())) return false;

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmitting(true);
    // Mock submission
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 w-full text-slate-900">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A365D] mb-2 tracking-tight">University Registration</h1>
        <p className="text-slate-500 font-medium">Add a new university profile to the platform.</p>
      </div>

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
                <div key={index} className="flex items-start space-x-3" onDoubleClick={() => setActiveDelete(activeDelete === `college-${index}` ? null : `college-${index}`)} onMouseLeave={() => setActiveDelete(null)}>
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
                  {colleges.length > 1 && activeDelete === `college-${index}` && (
                    <button 
                      type="button" 
                      onClick={() => removeCollege(index)}
                      className="mt-1 p-2.5 px-4 text-white bg-[#1A365D] hover:bg-[#122540] rounded-xl transition-colors font-bold text-xs shadow-sm"
                    >
                      Delete
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
                <div key={index} className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm" onDoubleClick={() => setActiveDelete(activeDelete === `course-${index}` ? null : `course-${index}`)} onMouseLeave={() => setActiveDelete(null)}>
                  {courses.length > 1 && activeDelete === `course-${index}` && (
                    <button 
                      type="button" 
                      onClick={() => removeCourse(index)}
                      className="absolute top-2 right-2 px-3 py-1.5 text-white bg-[#1A365D] hover:bg-[#122540] rounded-lg transition-colors shadow-sm font-bold text-xs"
                    >
                      Delete
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

        {/* Section 5: Blogs */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#1A365D] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">5. Blogs</h2>
            </div>
            <button 
              type="button" 
              onClick={addBlog}
              className="text-white hover:text-slate-200 text-sm font-bold flex items-center bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {blogs.map((blog, index) => (
              <div key={index} className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm" onDoubleClick={() => setActiveDelete(activeDelete === `blog-${index}` ? null : `blog-${index}`)} onMouseLeave={() => setActiveDelete(null)}>
                {blogs.length > 1 && activeDelete === `blog-${index}` && (
                  <button 
                    type="button" 
                    onClick={() => removeBlog(index)}
                    className="absolute top-2 right-2 px-3 py-1.5 text-white bg-[#1A365D] hover:bg-[#122540] rounded-lg transition-colors shadow-sm font-bold text-xs z-10"
                  >
                    Delete
                  </button>
                )}
                <div className="space-y-4 pt-1">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Title</label>
                      <input
                        type="text"
                        required
                        value={blog.title}
                        onChange={(e) => updateBlog(index, 'title', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="Blog title..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Slug</label>
                      <input
                        type="text"
                        required
                        value={blog.slug}
                        onChange={(e) => updateBlog(index, 'slug', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. my-first-blog"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Category</label>
                      <input
                        type="text"
                        required
                        value={blog.category}
                        onChange={(e) => updateBlog(index, 'category', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. Tech, Events"
                      />
                    </div>
                  </div>
                  
                  {/* Publishing & Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Status</label>
                      <select
                        value={blog.status}
                        onChange={(e) => updateBlog(index, 'status', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Published At</label>
                      <input
                        type="datetime-local"
                        value={blog.publishedAt}
                        onChange={(e) => updateBlog(index, 'publishedAt', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Author ID</label>
                      <input
                        type="text"
                        value={blog.authorId}
                        onChange={(e) => updateBlog(index, 'authorId', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="User ID..."
                      />
                    </div>
                  </div>

                  {/* Content & Excerpt */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 ml-1">Excerpt / Summary</label>
                    <textarea
                      value={blog.excerpt}
                      onChange={(e) => updateBlog(index, 'excerpt', e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D] min-h-[60px] resize-y"
                      placeholder="Short 2-3 line preview..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 ml-1">Full Content</label>
                    <textarea
                      required
                      value={blog.content}
                      onChange={(e) => updateBlog(index, 'content', e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D] min-h-[120px] resize-y"
                      placeholder="Blog content..."
                    />
                  </div>

                  {/* Media & Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Tags</label>
                      <input
                        type="text"
                        value={blog.tags}
                        onChange={(e) => updateBlog(index, 'tags', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. tech, college, event (comma separated)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Cover Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateBlog(index, 'imageUrl', e.target.files?.[0]?.name || '')}
                        className="w-full bg-white border border-slate-300 text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1A365D]/10 file:text-[#1A365D] hover:file:bg-[#1A365D]/20 cursor-pointer"
                      />
                      {blog.imageUrl && <p className="text-xs text-slate-500 mt-1 ml-1 truncate">Selected: {blog.imageUrl}</p>}
                    </div>
                  </div>

                  {/* SEO Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Meta Title</label>
                      <input
                        type="text"
                        value={blog.metaTitle}
                        onChange={(e) => updateBlog(index, 'metaTitle', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="SEO Title..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Meta Description</label>
                      <input
                        type="text"
                        value={blog.metaDescription}
                        onChange={(e) => updateBlog(index, 'metaDescription', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="SEO Description..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Events */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#1A365D] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">6. Events</h2>
            </div>
            <button 
              type="button" 
              onClick={addEvent}
              className="text-white hover:text-slate-200 text-sm font-bold flex items-center bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {events.map((event, index) => (
              <div key={index} className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm" onDoubleClick={() => setActiveDelete(activeDelete === `event-${index}` ? null : `event-${index}`)} onMouseLeave={() => setActiveDelete(null)}>
                {events.length > 1 && activeDelete === `event-${index}` && (
                  <button 
                    type="button" 
                    onClick={() => removeEvent(index)}
                    className="absolute top-2 right-2 px-3 py-1.5 text-white bg-[#1A365D] hover:bg-[#122540] rounded-lg transition-colors shadow-sm font-bold text-xs z-10"
                  >
                    Delete
                  </button>
                )}
                <div className="space-y-4 pt-1">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Event Title</label>
                      <input
                        type="text"
                        required
                        value={event.title}
                        onChange={(e) => updateEvent(index, 'title', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. Annual Tech Fest 2026"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Slug</label>
                      <input
                        type="text"
                        required
                        value={event.slug}
                        onChange={(e) => updateEvent(index, 'slug', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. tech-fest-2026"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Category</label>
                      <input
                        type="text"
                        required
                        value={event.category}
                        onChange={(e) => updateEvent(index, 'category', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. Hackathon, Seminar"
                      />
                    </div>
                  </div>
                  
                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={event.startDate}
                        onChange={(e) => updateEvent(index, 'startDate', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">End Date & Time</label>
                      <input
                        type="datetime-local"
                        value={event.endDate}
                        onChange={(e) => updateEvent(index, 'endDate', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Status</label>
                      <select
                        value={event.status}
                        onChange={(e) => updateEvent(index, 'status', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Location</label>
                      <input
                        type="text"
                        value={event.location}
                        onChange={(e) => updateEvent(index, 'location', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. Main Auditorium or Meet link"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Organizer</label>
                      <input
                        type="text"
                        value={event.organizer}
                        onChange={(e) => updateEvent(index, 'organizer', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="Department or Club"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Registration Link</label>
                      <input
                        type="text"
                        value={event.registrationLink}
                        onChange={(e) => updateEvent(index, 'registrationLink', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Description & Media */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 ml-1">Description</label>
                    <textarea
                      required
                      value={event.description}
                      onChange={(e) => updateEvent(index, 'description', e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D] min-h-[100px] resize-y"
                      placeholder="Full details, schedule, and rules..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 ml-1">Banner Image Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateEvent(index, 'imageUrl', e.target.files?.[0]?.name || '')}
                      className="w-full bg-white border border-slate-300 text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1A365D]/10 file:text-[#1A365D] hover:file:bg-[#1A365D]/20 cursor-pointer"
                    />
                    {event.imageUrl && <p className="text-xs text-slate-500 mt-1 ml-1 truncate">Selected: {event.imageUrl}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 7: Awards */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#1A365D] p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">7. Awards</h2>
            </div>
            <button 
              type="button" 
              onClick={addAward}
              className="text-white hover:text-slate-200 text-sm font-bold flex items-center bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {awards.map((award, index) => (
              <div key={index} className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm" onDoubleClick={() => setActiveDelete(activeDelete === `award-${index}` ? null : `award-${index}`)} onMouseLeave={() => setActiveDelete(null)}>
                {awards.length > 1 && activeDelete === `award-${index}` && (
                  <button 
                    type="button" 
                    onClick={() => removeAward(index)}
                    className="absolute top-2 right-2 px-3 py-1.5 text-white bg-[#1A365D] hover:bg-[#122540] rounded-lg transition-colors shadow-sm font-bold text-xs z-10"
                  >
                    Delete
                  </button>
                )}
                <div className="space-y-4 pt-1">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Award Title</label>
                      <input
                        type="text"
                        required
                        value={award.title}
                        onChange={(e) => updateAward(index, 'title', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. Ranked #1 for Infrastructure"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Issuing Authority</label>
                      <input
                        type="text"
                        required
                        value={award.issuingAuthority}
                        onChange={(e) => updateAward(index, 'issuingAuthority', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. Ministry of Education"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Year Received</label>
                      <input
                        type="number"
                        required
                        value={award.year}
                        onChange={(e) => updateAward(index, 'year', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. 2026"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Category</label>
                      <input
                        type="text"
                        value={award.category}
                        onChange={(e) => updateAward(index, 'category', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="e.g. Academics, Sports"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 ml-1">Reference Link</label>
                      <input
                        type="text"
                        value={award.referenceLink}
                        onChange={(e) => updateAward(index, 'referenceLink', e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Description & Media */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 ml-1">Description</label>
                    <textarea
                      required
                      value={award.description}
                      onChange={(e) => updateAward(index, 'description', e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D] min-h-[60px] resize-y"
                      placeholder="Short summary of the recognition..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 ml-1">Badge/Icon Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateAward(index, 'imageUrl', e.target.files?.[0]?.name || '')}
                      className="w-full bg-white border border-slate-300 text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A365D] focus:border-[#1A365D] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1A365D]/10 file:text-[#1A365D] hover:file:bg-[#1A365D]/20 cursor-pointer"
                    />
                    {award.imageUrl && <p className="text-xs text-slate-500 mt-1 ml-1 truncate">Selected: {award.imageUrl}</p>}
                  </div>
                </div>
              </div>
            ))}
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
