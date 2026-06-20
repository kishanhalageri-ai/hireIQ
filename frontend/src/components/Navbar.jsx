import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Upload, PlusCircle, LogOut, User, BarChart2 } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Hire<span className="text-violet-500">IQ</span>
              </span>
            </Link>
            
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-slate-900 text-white border-b-2 border-violet-500 rounded-b-none'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>

                {user.role === 'candidate' && (
                  <Link
                    to="/upload"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/upload')
                        ? 'bg-slate-900 text-white border-b-2 border-violet-500 rounded-b-none'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Resume
                  </Link>
                )}

                {user.role === 'recruiter' && (
                  <Link
                    to="/create-job"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/create-job')
                        ? 'bg-slate-900 text-white border-b-2 border-violet-500 rounded-b-none'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Post Job
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <User className="h-4 w-4 text-violet-400" />
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-3">{user.fullName}</div>
                <span className="text-[10px] text-violet-400 font-medium uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-900/50 border border-slate-800 hover:bg-rose-950/20 hover:border-rose-900/50 hover:text-rose-400 text-slate-400 p-2 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
