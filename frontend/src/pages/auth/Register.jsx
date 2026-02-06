import React, { useState } from 'react';
import RegisterSelector from '../../components/forms/RegisterSelector';
import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  Search,
  UserPlus,
} from 'lucide-react';

const Register = () => {
  const [userType, setUserType] = useState('student');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-cyan-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto my-16 flex min-h-[650px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:flex-row">
        {/* Left: Registration Form */}
        <div className="flex w-full flex-col justify-center bg-white px-10 py-16 dark:bg-slate-900 md:w-1/2">
          <RegisterSelector userType={userType} setUserType={setUserType} />
        </div>
        {/* Right: Icons & Marketing */}
        <div className="relative hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#1e293b] via-[#312e81] to-[#1d4ed8] p-10 md:ml-10 md:flex">
          <div className="mb-4 w-full max-w-md text-left text-2xl font-semibold text-white">
            {userType === 'student'
              ? 'Kickstart your IT career with real internships in Nepal.'
              : 'Find top student talent and grow your company with InternNepal.'}
          </div>
          <div className="mb-8 w-full max-w-md text-base font-normal text-slate-100">
            {userType === 'student'
              ? 'Sign up to discover, apply, and track IT internships from leading companies across Nepal.'
              : 'Log in to post internships, manage applicants, and connect with the next generation of IT professionals.'}
          </div>
          <div className="flex gap-4 rounded-xl p-6 bg-white/10 backdrop-blur-sm">
            {userType === 'student' ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-10 h-10 text-white" />
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-10 h-10 text-white" />
                </div>
              </>
            )}
          </div>

          <div className="mt-6 w-full max-w-md space-y-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            {userType === 'student' ? (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <Search size={16} className="text-cyan-300" />
                  Browse latest internship ads
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <FileText size={16} className="text-blue-300" />
                  Track real application status
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <BadgeCheck size={16} className="text-emerald-300" />
                  Build profile and get discovered
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <Briefcase size={16} className="text-cyan-300" />
                  Post internships in minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <UserPlus size={16} className="text-blue-300" />
                  Review and shortlist candidates
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-100">
                  <BarChart3 size={16} className="text-emerald-300" />
                  Track hiring metrics in dashboard
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
