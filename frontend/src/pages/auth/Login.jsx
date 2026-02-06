import React from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../../components/forms/LoginForm';
import {
  Bell,
  BookmarkCheck,
  Briefcase,
  Clock3,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const successMsg = location.state?.success;

  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-auto bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 pb-8 pt-20 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:w-[80vw] md:flex-row">
        {/* Left: Icon illustration */}
        <div className="hidden h-full flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 p-8 md:flex">
          <div className="flex w-full max-w-md flex-col items-start gap-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-blue-400" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                <Search className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-violet-400" />
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Sign in to track applications, save roles, and move faster with real-time updates.
            </p>

            <div className="w-full space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Clock3 size={16} className="text-blue-400" />
                Application status updates in one place
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <BookmarkCheck size={16} className="text-cyan-400" />
                Saved jobs synced to your account
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Bell size={16} className="text-violet-400" />
                Notification center for activity
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <ShieldCheck size={16} className="text-emerald-400" />
                Secure account flow with verification
              </div>
            </div>
          </div>
        </div>
        {/* Right: Form */}
        <div className="flex h-full flex-1 flex-col justify-center px-4 py-6 md:px-16 md:py-0">
          <span className="mb-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">INTERNNEPAL</span>
          <h1 className="mb-3 text-4xl font-extrabold leading-tight text-slate-900 dark:text-white">Sign in to your account</h1>
          <p className="mb-8 text-lg text-slate-600 dark:text-slate-300">Access jobs, internships, and career opportunities tailored for you.</p>
          {successMsg && <div className="mb-4 text-base text-green-600 dark:text-green-400">{successMsg}</div>}
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
