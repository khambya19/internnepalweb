
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, Phone, Globe, Lock } from 'lucide-react';

const passwordRequirements =
  'Password must be at least 8 characters and contain at least 3 of these 4 categories: lowercase letters, uppercase letters, numbers, special characters.';

const companySchema = z
  .object({
    companyName: z.string().min(2, 'Company Name is required'),
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .regex(/^[0-9]{9}$/, 'Contact number must be a 9-digit landline number'),
    website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((val) => {
        const categories = [
          /[a-z]/.test(val),
          /[A-Z]/.test(val),
          /[0-9]/.test(val),
          /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/~`\\]/.test(val),
        ];
        return categories.filter(Boolean).length >= 3;
      }, { message: passwordRequirements }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match!",
    path: ['confirmPassword'],
  });

const CompanyRegisterForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(companySchema),
    mode: 'onTouched',
  });

  const password = watch('password', '');

  // Real-time password strength
  useEffect(() => {
    if (!password) {
      setPasswordValid(false);
      return;
    }

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/~`\\]/.test(password),
    };

    const categoryCount = [
      checks.lowercase,
      checks.uppercase,
      checks.number,
      checks.special,
    ].filter(Boolean).length;

    setPasswordValid(checks.length && categoryCount >= 3);
  }, [password]);

  const onSubmit = async (data) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.companyName.trim(),
          email: data.email.trim(),
          password: data.password,
          role: 'company',
          phone: '+977' + data.phone,
          website: data.website || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (result.success) {
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        alert(result.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Server error. Please try again.');
    }
  };

  // Helper to decide input border style
  const getBorderClass = (fieldError, isTouched, isValid = true) => {
    if (fieldError) return 'border-red-500 bg-red-50';
    if (isTouched && isValid) return 'border-green-500 bg-green-50';
    return 'border-gray-300';
  };

  const companyName = watch('companyName', '');
  const email = watch('email', '');
  const phone = watch('phone', '');
  const website = watch('website', '');
  const confirmPassword = watch('confirmPassword', '');

  return (
    <div className="w-full h-full flex flex-col flex-1">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Create Company Account</h2>
      <p className="text-gray-600 mb-4 text-sm">
        Post IT internships and connect with talented students in Nepal.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-2 flex-1">
        {/* Company Name */}
        <div className="mb-6">
          <div
            className={`flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.companyName,
              touchedFields.companyName,
              companyName.trim().length >= 2
            )}`}
          >
            <Building2 className="text-gray-400 mr-2" size={20} />
            <input
              type="text"
              {...register('companyName')}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Company Name"
              autoComplete="organization"
            />
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.companyName?.message}
          </span>
        </div>

        {/* Email */}
        <div className="mb-6">
          <div
            className={`flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.email,
              touchedFields.email,
              !!email && !errors.email
            )}`}
          >
            <Mail className="text-gray-400 mr-2" size={20} />
            <input
              type="email"
              {...register('email')}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Official Email"
              autoComplete="email"
            />
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.email?.message}
          </span>
        </div>

        {/* Phone */}
        <div className="mb-6">
          <div
            className={`flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.phone,
              touchedFields.phone,
              phone.length === 9 && !errors.phone
            )}`}
          >
            <Phone className="text-gray-400 mr-2" size={20} />
            <span className="text-gray-500 font-medium select-none">+977</span>
            <input
              type="text"
              {...register('phone', {
                onChange: (e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                  setValue('phone', digits, { shouldValidate: true });
                },
              })}
              className="flex-1 bg-transparent outline-none text-sm ml-2"
              placeholder="9-digit Landline (e.g. 123456789)"
              autoComplete="tel"
              maxLength={9}
              inputMode="numeric"
            />
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.phone?.message}
          </span>
        </div>

        {/* Website (optional) */}
        <div className="mb-6">
          <div
            className={`flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.website,
              touchedFields.website,
              website && !errors.website
            )}`}
          >
            <Globe className="text-gray-400 mr-2" size={20} />
            <input
              type="url"
              {...register('website')}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Website (optional)"
              autoComplete="url"
            />
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.website?.message}
          </span>
        </div>

        {/* Password */}
        <div className="mb-6">
          <div
            className={`flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
              errors.password
                ? 'border-red-500 bg-red-50'
                : passwordValid
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300'
            }`}
          >
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
              className="ml-2 text-gray-500 hover:text-blue-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.928-7.072m1.414 1.414A7.963 7.963 0 0012 5c4.418 0 8 3.582 8 8 0 1.657-.507 3.197-1.378 4.472M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378" />
                </svg>
              )}
            </button>
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.password?.message}
          </span>

         
          <div className="mt-3 p-3 bg-gray-50 rounded-md border text-xs">
            <p className="font-medium text-gray-700 mb-2">Password must:</p>
            <ul className="space-y-1.5">
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400' : password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>At least 8 characters</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400' : /[a-z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Lowercase letter</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400' : /[A-Z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Uppercase letter</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400' : /[0-9]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Number</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400' : /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/~`\\]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Special character</li>
            </ul>
            <p className="mt-2 text-gray-500 text-[11px]">
              Need <strong>at least 3</strong> of the last 4 categories
            </p>
          </div>
        </div>

       
        <div className="mb-10">
          <div
            className={`flex items-center bg-white border rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.confirmPassword,
              touchedFields.confirmPassword,
              confirmPassword && !errors.confirmPassword
            )}`}
          >
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
              className="ml-2 text-gray-500 hover:text-blue-600 focus:outline-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.928-7.072m1.414 1.414A7.963 7.963 0 0012 5c4.418 0 8 3.582 8 8 0 1.657-.507 3.197-1.378 4.472M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.617-1.1 2.336M15.536 15.536A5.978 5.978 0 0112 17c-1.657 0-3.197-.507-4.472-1.378" />
                </svg>
              )}
            </button>
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.confirmPassword?.message}
          </span>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors mt-6 text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Company Account'}
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

export default CompanyRegisterForm;