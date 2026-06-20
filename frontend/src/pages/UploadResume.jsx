import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, BookOpen, Clock, Mail, Phone, Code } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg('');
    setSuccessData(null);
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setErrorMsg('Invalid file format. Please upload a PDF or DOCX file.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessData(response.data);
      setFile(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'An error occurred during resume parsing.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Upload Your <span className="gradient-text">Resume</span>
        </h1>
        <p className="text-slate-400">
          Our AI engine will parse your skills, qualifications, and experience to match you with recruiters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-violet-500 bg-violet-650/10'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.docx"
              />

              <div className="bg-slate-900/80 p-4 rounded-full border border-slate-800 mb-4 text-violet-400">
                <Upload className="h-8 w-8" />
              </div>

              <p className="text-sm font-semibold text-white mb-1">
                Drag and drop your file here
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Supports PDF and DOCX files
              </p>
              <span className="px-3 py-1.5 glass-button-secondary text-xs">
                Browse Files
              </span>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-400" />
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[240px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 glass-button-primary text-xs disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Parse Resume
                    </>
                  )}
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3 rounded-lg text-xs font-medium flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-gradient-to-br from-violet-950/20 to-slate-900">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              NLP Extraction Details
            </h3>
            <ul className="space-y-3 text-xs text-slate-350">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span><strong>Core NLP Mapping:</strong> Custom spaCy entities automatically extract candidate metadata.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span><strong>Skill Dictionary Matching:</strong> Scans for over 100+ mapped technical/soft skill profiles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span><strong>Semantic Scoring:</strong> Job matching engine uses dense sentence embeddings to calculate overall compatibility.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Modal / Parsing Summary */}
      {successData && (
        <div className="mt-8 glass-panel p-6 border-violet-500/30 bg-violet-950/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-violet-500/10">
            <CheckCircle2 className="h-24 w-24" />
          </div>
          
          <div className="flex items-center gap-2 text-emerald-450 mb-6">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Resume Parsed Successfully!</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Contact Details Card */}
            <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Extracted Bio Details</h3>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <div className="h-8 w-8 bg-violet-600/10 rounded-full flex items-center justify-center text-xs text-violet-400">
                  {successData.parsed_name?.charAt(0) || "U"}
                </div>
                {successData.parsed_name}
              </div>
              <div className="text-xs text-slate-350 flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {successData.parsed_email || "N/A"}
              </div>
              <div className="text-xs text-slate-350 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {successData.parsed_phone || "N/A"}
              </div>
            </div>

            {/* Profile Statistics Card */}
            <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Qualifications</h3>
                <div className="flex items-center gap-1.5 text-white">
                  <BookOpen className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-bold">{successData.parsed_education?.length || 0} Listed</span>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Projects / Work</h3>
                <div className="flex items-center gap-1.5 text-white">
                  <Clock className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-bold">{successData.parsed_projects?.length || 0} Projects</span>
                </div>
              </div>
            </div>

            {/* Extracted Skills badges */}
            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Code className="h-4 w-4 text-violet-400" />
                Parsed Technical Skills ({successData.parsed_skills?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {successData.parsed_skills?.length > 0 ? (
                  successData.parsed_skills.map((skill, index) => (
                    <span key={index} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs capitalize">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No core technical skills matches identified in the content.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadResume;
