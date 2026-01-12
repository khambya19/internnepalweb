
import React, { useState } from 'react';
import RegisterSelector from '../../components/forms/RegisterSelector';
import registerIllustration from '../../assets/images/register-illustration.svg';
import { Link } from 'react-router-dom';

const Register = () => {
  const [userType, setUserType] = useState('student');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-cyan-100">
      <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full mx-auto my-16 min-h-[650px]">
        {/* Left: Registration Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-10 py-16 bg-white">
          <RegisterSelector userType={userType} setUserType={setUserType} />
        </div>
        {/* Right: Illustration & Marketing */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-[#4f46e5] to-[#6366f1] p-10 relative" style={{marginLeft: '2.5rem'}}>
          <div className="text-white text-2xl font-semibold mb-4 text-left w-full max-w-md">
            {userType === 'student'
              ? 'Kickstart your IT career with real internships in Nepal.'
              : 'Find top student talent and grow your company with InternNepal.'}
          </div>
          <div className="text-white text-base font-normal mb-8 w-full max-w-md">
            {userType === 'student'
              ? 'Sign up to discover, apply, and track IT internships from leading companies across Nepal.'
              : 'Log in to post internships, manage applicants, and connect with the next generation of IT professionals.'}
          </div>
          <img
            src={registerIllustration}
            alt="Register Illustration"
            className={`rounded-xl shadow-lg transition-all duration-300 ${userType === 'student' ? 'w-[340px]' : 'w-[260px]'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default Register;