import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, ArrowRight, AlertCircle, CheckCircle2, Tags, Trash2, Plus } from 'lucide-react';

const CreateJob = () => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [minEducation, setMinEducation] = useState('Bachelor');
  
  // Skills list state
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleAddSkill = (e) => {
    e.preventDefault();
    const val = skillInput.trim().toLowerCase();
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (skills.length === 0) {
      setErrorMsg('Please specify at least one required skill for the position.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/jobs', {
        title,
        company,
        description,
        required_skills: skills,
        min_experience: Number(minExperience),
        min_education: minEducation
      });
      setSuccess(true);
      // Reset form
      setTitle('');
      setCompany('');
      setDescription('');
      setMinExperience(0);
      setMinEducation('Bachelor');
      setSkills([]);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Post a New <span className="gradient-text">Job Posting</span>
        </h1>
        <p className="text-slate-400">
          Create a job specification to run auto-screenings and match incoming candidate profiles.
        </p>
      </div>

      {success && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>Job listing created successfully! Redirecting to Dashboard...</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-rose-450 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Job Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-4 py-3 glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Company Name
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
              className="w-full px-4 py-3 glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Minimum Experience (Years)
            </label>
            <input
              type="number"
              required
              min={0}
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Minimum Education
            </label>
            <select
              value={minEducation}
              onChange={(e) => setMinEducation(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm bg-slate-950 text-slate-100"
            >
              <option value="None">No Requirement</option>
              <option value="Bachelor">Bachelor's Degree</option>
              <option value="Master">Master's Degree</option>
              <option value="PhD">Doctorate / PhD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Job Description & Project Details
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the job responsibilities, candidate requirements, and context of the projects the candidate will work on."
            className="w-full px-4 py-3 glass-input text-sm font-sans"
          />
        </div>

        {/* Required Skills Segment */}
        <div className="border-t border-slate-800/80 pt-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Required Technical & Soft Skills
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a skill (e.g. Python, Docker) and press Enter or click Add"
              className="flex-1 px-4 py-3 glass-input text-sm"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-3 glass-button-secondary text-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-600/10 border border-violet-500/30 text-violet-400 text-xs font-medium rounded-lg capitalize"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-450 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Tags className="h-4 w-4" />
                No core requirements specified yet. Add skills to enable scoring.
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 glass-button-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Post Job Listing <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateJob;
