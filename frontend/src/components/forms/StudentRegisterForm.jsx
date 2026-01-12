import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Lock } from 'lucide-react';


const passwordRequirements =
  'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';

const studentSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name is required'),
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .regex(/^\+977[0-9]{10}$/, 'Phone must be in +977XXXXXXXXXX format'),
    password: z
      .string()
      .min(8, passwordRequirements)
      .regex(/[A-Z]/, passwordRequirements)
      .regex(/[a-z]/, passwordRequirements)
      .regex(/[0-9]/, passwordRequirements)
      .regex(/[^A-Za-z0-9]/, passwordRequirements),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match!",
    path: ['confirmPassword'],
  });

const StudentRegisterForm = ({ onSuccess, switchToLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(studentSchema),
    mode: 'onTouched',
  });

  const onSubmit = (data) => {
    // Here you would call your API
    console.log('Student registration data:', data);
    // onSuccess();
    reset();
  };

  return (
    <div className="w-full h-full flex flex-col flex-1">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Create Student Account</h2>
      <p className="text-gray-600 mb-4 text-sm">
        Sign up to find IT internships and grow your career in Nepal.
      </p>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-2 flex-1">
        <div className="relative mb-6">
            <div className="flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}">
              <User className="text-gray-400 mr-2" size={20} />
              <input
                type="text"
                {...register('fullName')}
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Full Name"
                autoComplete="name"
              />
            </div>
            <span className="block mt-1 min-h-[18px] text-xs text-red-600">
              {errors.fullName && errors.fullName.message}
            </span>
        </div>

        <div className="relative mb-6">
            <div className="flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}">
              <Mail className="text-gray-400 mr-2" size={20} />
              <input
                type="email"
                {...register('email')}
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Email"
                autoComplete="email"
              />
            </div>
            <span className="block mt-1 min-h-[18px] text-xs text-red-600">
              {errors.email && errors.email.message}
            </span>
        </div>

        <div className="relative mb-6">
            <div className="flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}">
              <Phone className="text-gray-400 mr-2" size={20} />
              <input
                type="tel"
                {...register('phone')}
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Phone Number"
                autoComplete="tel"
              />
            </div>
            <span className="block mt-1 min-h-[18px] text-xs text-red-600">
              {errors.phone && errors.phone.message}
            </span>
        </div>

        <div className="relative mb-6">
            <div className="flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}">
              <Lock className="text-gray-400 mr-2" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Password"
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            <span className="block mt-1 min-h-[18px] text-xs text-red-600">
              {errors.password && errors.password.message}
            </span>
        </div>

        <div className="relative mb-10">
            <div className="flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'}">
              <Lock className="text-gray-400 mr-2" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              <button
                type="button"
                tabIndex={-1}
                className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.31-2.687A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            <span className="block mt-1 min-h-[18px] mb-2 text-xs text-red-600">
              {errors.confirmPassword && errors.confirmPassword.message}
            </span>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors mt-6 text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
        </button>
      </form>

      <div className="flex-grow"></div>
      <p className="text-center text-gray-600 mt-3 text-xs">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-blue-600 hover:underline font-medium"
        >
          Log in
        </button>
      </p>
    </div>
  );
};

export default StudentRegisterForm;