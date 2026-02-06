// src/components/forms/RegisterSelector.jsx
import React from 'react';
import { Building2, GraduationCap } from 'lucide-react';
import StudentRegisterForm from './StudentRegisterForm';
import CompanyRegisterForm from './CompanyRegisterForm';

const RegisterSelector = ({ onSuccess, switchToLogin, userType, setUserType }) => {

  return (
    <div className="mx-auto flex h-auto w-full max-w-[520px] flex-col rounded-2xl border border-gray-100 bg-white p-0 shadow-xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 sm:max-w-[98vw] sm:rounded-xl sm:border sm:p-0 sm:shadow-lg">
      {/* Branding area - can be moved outside if you want split layout */}
      <div className="text-center pt-4 pb-1 px-4 sm:px-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
          InternNepal
        </h1>
        <p className="mt-1 text-lg font-medium text-gray-700 dark:text-slate-200">
          Find IT internships. Grow your career.
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
          Nepal's #1 platform for students and companies to connect for real-world experience.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-xl bg-gray-100 p-1.5 shadow-inner dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`px-8 py-2 text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none ${
              userType === 'student'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <GraduationCap size={16} />
              Student
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUserType('company')}
            className={`px-8 py-2 text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none ${
              userType === 'company'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Building2 size={16} />
              Company
            </span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex flex-col justify-between px-8 pb-4 sm:px-2">
        {userType === 'student' ? (
          <StudentRegisterForm onSuccess={onSuccess} switchToLogin={switchToLogin} />
        ) : (
          <CompanyRegisterForm onSuccess={onSuccess} switchToLogin={switchToLogin} />
        )}
      </div>
    </div>
  );
};

export default RegisterSelector;
