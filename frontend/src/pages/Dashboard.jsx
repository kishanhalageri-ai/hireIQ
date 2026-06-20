import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, FileText, CheckCircle2, AlertCircle, RefreshCw, 
  MapPin, Calendar, Clock, Star, BookOpen, User, Phone, 
  Mail, Code, ChevronRight, Award, PlusCircle, Search, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {user?.role === 'candidate' ? <CandidateDashboard /> : <RecruiterDashboard />}
    </div>
  );
};

// ==========================================
// CANDIDATE VIEW
// ==========================================
const CandidateDashboard = () => {
  const [data, setData] = useState({ resume: null, applications: [] });
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      const dashRes = await axios.get('/api/dashboard/candidate');
      setData(dashRes.data);
      
      const jobsRes = await axios.get('/api/jobs');
      setAvailableJobs(jobsRes.data);
    } catch (err) {
      console.error("Error loading candidate dashboard:", err);
      setErrorMsg("Failed to retrieve dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApply = async (jobId) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await axios.post(`/api/applications/apply/${jobId}`);
      await fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Application failed. Make sure your resume is uploaded.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Find if already applied
  const hasApplied = (jobId) => data.applications.some(app => app.job_id === jobId);
  const getApplication = (jobId) => data.applications.find(app => app.job_id === jobId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Candidate <span className="gradient-text">Workspace</span>
          </h1>
          <p className="text-slate-400">
            Apply to positions and view personalized AI-generated roadmap reviews.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-450 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Jobs & Resume info) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Resume parsed indicator */}
          {!data.resume ? (
            <div className="glass-panel p-8 text-center border-dashed border-violet-500/30 bg-violet-950/5">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No Resume Profile Found</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                You must upload your resume in PDF/DOCX format to parse your skills and enable job matching AI calculations.
              </p>
              <Link to="/upload" className="px-5 py-2.5 glass-button-primary text-sm inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Upload Resume
              </Link>
            </div>
          ) : (
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-violet-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Resume profile active</h2>
                    <p className="text-[10px] text-slate-500">File: {data.resume.filename}</p>
                  </div>
                </div>
                <Link to="/upload" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  Re-upload <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-350">
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-semibold">Name</span>
                  <span className="font-bold text-white">{data.resume.parsed_name || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-semibold">Email</span>
                  <span className="font-bold text-white truncate block">{data.resume.parsed_email || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-semibold">Education</span>
                  <span className="font-bold text-white">{data.resume.parsed_education?.length || 0} Records</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-semibold">Skills Identified</span>
                  <span className="font-bold text-white">{data.resume.parsed_skills?.length || 0} Core skills</span>
                </div>
              </div>
            </div>
          )}

          {/* Job Postings List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-violet-400" />
              Available Jobs & Openings
            </h2>

            {availableJobs.length === 0 ? (
              <div className="glass-panel p-6 text-center text-slate-500 text-xs">
                No active jobs currently available. Check back soon.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableJobs.map((job) => {
                  const applied = hasApplied(job.id);
                  const app = getApplication(job.id);

                  return (
                    <div key={job.id} className="glass-panel p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="text-sm font-bold text-white leading-tight">{job.title}</h3>
                          {applied && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              app.status === 'Shortlisted' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : app.status === 'Rejected'
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                              {app.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-violet-400 font-medium mb-3">{job.company}</p>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">{job.description}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {job.required_skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-350 rounded uppercase">
                              {skill}
                            </span>
                          ))}
                          {job.required_skills.length > 3 && (
                            <span className="text-[9px] text-slate-500 self-center">
                              +{job.required_skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-auto">
                        <div className="text-[10px] text-slate-500">
                          Exp: {job.min_experience}+ Years
                        </div>

                        {applied ? (
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                          >
                            Score: {app.overall_score}% <ArrowUpRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApply(job.id)}
                            disabled={actionLoading || !data.resume}
                            className="px-3.5 py-1.5 glass-button-primary text-xs flex items-center gap-1 disabled:opacity-40"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Personalized Match Details) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 sticky top-20">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              AI Matching Insights
            </h2>

            {selectedApp ? (
              <div className="space-y-6">
                {/* Job Title & Score Dial */}
                <div className="text-center pb-4 border-b border-slate-800/80">
                  <h3 className="text-sm font-bold text-white">{selectedApp.job?.title}</h3>
                  <p className="text-xs text-violet-400 mb-4">{selectedApp.job?.company}</p>
                  
                  {/* Score circle replacement: Radial representation */}
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="#8b5cf6" strokeWidth="6" fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * selectedApp.overall_score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xl font-black text-white">{selectedApp.overall_score}%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-2">Overall Match Fit</div>
                </div>

                {/* Score breakdown bars */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scoring Breakdown</h4>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Skill Match (50%)</span>
                      <span className="font-bold text-white">{selectedApp.skill_match_score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApp.skill_match_score}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Experience (20%)</span>
                      <span className="font-bold text-white">{selectedApp.experience_score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApp.experience_score}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Education (15%)</span>
                      <span className="font-bold text-white">{selectedApp.education_score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApp.education_score}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Projects (15%)</span>
                      <span className="font-bold text-white">{selectedApp.projects_score}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApp.projects_score}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Identified Skill Gaps</h4>
                  {selectedApp.missing_skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.missing_skills.map((skill, index) => (
                        <span key={index} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded text-[10px] uppercase font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">No core skill gaps identified! Perfect match.</p>
                  )}
                </div>

                {/* AI Roadmap recommendations */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Career Roadmap</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {selectedApp.recommendations?.summary}
                  </p>
                  <ul className="space-y-2 text-[10px] text-slate-350 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    {selectedApp.recommendations?.roadmap?.map((step, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                Select an applied job from the openings list to review your compatibility breakdown, gap analysis, and learning roadmap.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


// ==========================================
// RECRUITER VIEW
// ==========================================
const RecruiterDashboard = () => {
  const [stats, setStats] = useState({ total_jobs: 0, total_candidates: 0, shortlisted_candidates: 0, jobs: [] });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/recruiter');
      setStats(response.data);
      if (response.data.jobs?.length > 0 && !selectedJob) {
        setSelectedJob(response.data.jobs[0]);
      }
    } catch (err) {
      console.error("Error loading recruiter stats:", err);
      setErrorMsg("Failed to fetch dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch applicants when selected job changes
  useEffect(() => {
    if (!selectedJob) return;

    const fetchApplicants = async () => {
      setApplicantsLoading(true);
      setSelectedApplicant(null);
      try {
        const response = await axios.get(`/api/applications/job/${selectedJob.id}`);
        setApplicants(response.data);
        if (response.data?.length > 0) {
          setSelectedApplicant(response.data[0]);
        }
      } catch (err) {
        console.error("Error loading job applicants:", err);
      } finally {
        setApplicantsLoading(false);
      }
    };

    fetchApplicants();
  }, [selectedJob]);

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const res = await axios.patch(`/api/applications/${appId}/status`, { status: newStatus });
      // Update local state
      setApplicants(applicants.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      if (selectedApplicant?.id === appId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
      fetchDashboardData(); // Update count stats
    } catch (err) {
      console.error("Error updating application status:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Recruiter <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400">
            Review parsed candidate credentials and screen candidates powered by NLP semantic alignment.
          </p>
        </div>
        <Link to="/create-job" className="px-5 py-2.5 glass-button-primary text-sm inline-flex items-center gap-2 self-start md:self-auto">
          <PlusCircle className="h-4 w-4" /> Post New Job
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-450 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Analytics stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900 to-indigo-950/10">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Job Postings</div>
          <div className="text-3xl font-black text-white mt-2">{stats.total_jobs}</div>
        </div>
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900 to-violet-950/10">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Incoming Candidates</div>
          <div className="text-3xl font-black text-white mt-2">{stats.total_candidates}</div>
        </div>
        <div className="glass-panel p-5 bg-gradient-to-tr from-slate-900 to-emerald-950/10">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Shortlisted Profiles</div>
          <div className="text-3xl font-black text-white mt-2 text-emerald-400">{stats.shortlisted_candidates}</div>
        </div>
      </div>

      {/* Jobs Selector Tab Row */}
      <div className="mb-6 overflow-x-auto pb-2 flex gap-2 border-b border-slate-900">
        {stats.jobs.map((job) => (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border whitespace-nowrap transition-all ${
              selectedJob?.id === job.id
                ? 'bg-violet-600/10 border-violet-500 text-violet-400 shadow-md'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-300'
            }`}
          >
            {job.title} ({job.company})
          </button>
        ))}
      </div>

      {selectedJob ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Ranked Candidates */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Custom SVG Score Distribution Bar Chart */}
            <div className="glass-panel p-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                Applicant Score Distribution
              </h3>
              
              {applicants.length > 0 ? (
                <div className="space-y-4">
                  {/* Custom CSS/SVG chart container */}
                  <div className="h-32 flex items-end gap-1.5 pt-4 border-b border-slate-800">
                    {applicants.slice(0, 10).map((app, index) => {
                      const h = `${app.overall_score}%`;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group cursor-pointer" onClick={() => setSelectedApplicant(app)}>
                          <div className="w-full bg-violet-600 hover:bg-violet-500 rounded-t transition-all relative" style={{ height: h }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              {app.overall_score}%
                            </div>
                          </div>
                          <span className="text-[8px] text-slate-500 mt-2 truncate w-8 text-center">
                            {app.resume?.parsed_name?.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">Showing top 10 candidates by match index</p>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs">No chart metrics available.</div>
              )}
            </div>

            {/* List of Applicants */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-violet-400" />
                Ranked Candidates ({applicants.length})
              </h3>

              {applicantsLoading ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="h-6 w-6 text-violet-500 animate-spin" />
                </div>
              ) : applicants.length === 0 ? (
                <div className="glass-panel p-6 text-center text-slate-500 text-xs">
                  No applications received for this job listing yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {applicants.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApplicant(app)}
                      className={`glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-slate-700 transition-all ${
                        selectedApplicant?.id === app.id ? 'border-violet-500 bg-violet-950/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white">
                          {app.overall_score}%
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{app.resume?.parsed_name}</h4>
                          <p className="text-[10px] text-slate-500">{app.resume?.parsed_email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right hidden sm:block">
                          <span className="block text-[10px] text-slate-500 uppercase font-semibold">Match Score</span>
                          <span className="text-xs font-bold text-white">{app.overall_score}% Match</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          app.status === 'Shortlisted' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : app.status === 'Rejected'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-455'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Applicant Detailed Credentials */}
          <div className="space-y-6">
            <div className="glass-panel p-6 sticky top-20">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                Applicant Assessment
              </h2>

              {selectedApplicant ? (
                <div className="space-y-5">
                  {/* Summary & actions */}
                  <div className="pb-4 border-b border-slate-800/80">
                    <h3 className="text-sm font-bold text-white">{selectedApplicant.resume?.parsed_name}</h3>
                    <p className="text-xs text-slate-500 mb-4">{selectedApplicant.resume?.parsed_email}</p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(selectedApplicant.id, 'Shortlisted')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg active:scale-[0.98] transition-all"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedApplicant.id, 'Rejected')}
                        className="flex-1 py-1.5 bg-slate-900 border border-slate-800 hover:bg-rose-950/20 hover:border-rose-900/50 hover:text-rose-455 text-slate-300 text-xs font-semibold rounded-lg active:scale-[0.98] transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Contact panel */}
                  <div className="space-y-2 text-[11px] text-slate-350 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-500" /> {selectedApplicant.resume?.parsed_email || "N/A"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500" /> {selectedApplicant.resume?.parsed_phone || "N/A"}
                    </div>
                  </div>

                  {/* Scoring progress bars */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alignment Index</h4>
                    
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">Skill alignment (50%)</span>
                        <span className="font-bold text-white">{selectedApplicant.skill_match_score}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApplicant.skill_match_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">Experience mapping (20%)</span>
                        <span className="font-bold text-white">{selectedApplicant.experience_score}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApplicant.experience_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">Education qualifications (15%)</span>
                        <span className="font-bold text-white">{selectedApplicant.education_score}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApplicant.education_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">Project matching (15%)</span>
                        <span className="font-bold text-white">{selectedApplicant.projects_score}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-violet-500 h-full rounded-full" style={{ width: `${selectedApplicant.projects_score}%` }}></div>
                      </div>
                    </div>

                  </div>

                  {/* Skills badges */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Candidate Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApplicant.resume?.parsed_skills?.map((skill, index) => (
                        <span key={index} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[10px] capitalize">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Education Background</h4>
                    <div className="space-y-1.5">
                      {selectedApplicant.resume?.parsed_education?.map((edu, index) => (
                        <div key={index} className="text-[10px] text-slate-350 bg-slate-950/40 p-2 rounded border border-slate-800/80">
                          <span className="font-semibold text-white">{edu.degree}</span> {edu.year ? `(${edu.year})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Select an applicant from the ranked list to review their complete parsed data, qualifications, skills, and status controls.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-panel p-8 text-center border-dashed border-slate-800 bg-slate-950/20 text-slate-500 text-sm">
          No job posting has been created yet. Post a job listing to receive and screen applicant resumes.
        </div>
      )}
    </div>
  );
};

export default Dashboard;
