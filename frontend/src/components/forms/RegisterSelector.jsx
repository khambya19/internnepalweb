// src/components/forms/RegisterSelector.jsx
import React, { useState } from 'react';
import StudentRegisterForm from './StudentRegisterForm';
import CompanyRegisterForm from './CompanyRegisterForm';

const RegisterSelector = ({ onSuccess, switchToLogin, userType, setUserType }) => {

  return (
    <div className="w-full max-w-[520px] h-auto mx-auto flex flex-col bg-white rounded-2xl shadow-xl p-0 border border-gray-100 transition-all duration-300 sm:max-w-[98vw] sm:rounded-xl sm:shadow-lg sm:border sm:p-0">
      {/* Branding area - can be moved outside if you want split layout */}
      <div className="text-center pt-4 pb-1 px-4 sm:px-2">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">
          InternNepal
        </h1>
        <p className="text-lg text-gray-700 mt-1 font-medium">
          Find IT internships. Grow your career.
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Nepal's #1 platform for students and companies to connect for real-world experience.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-xl bg-gray-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`px-8 py-2 text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none ${
              userType === 'student'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Student
          </button>

          <button
            type="button"
            onClick={() => setUserType('company')}
            className={`px-8 py-2 text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none ${
              userType === 'company'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Company
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