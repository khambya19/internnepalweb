import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const passwordRequirements =
  'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';

const studentSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name is required'),
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .regex(/^(96|97|98)\d{8}$/, 'Phone must be 10 digits starting with 96, 97, or 98'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((val) => {
        return (
          /[a-z]/.test(val) &&
          /[A-Z]/.test(val) &&
          /[0-9]/.test(val) &&
          /[^A-Za-z0-9]/.test(val)
        );
      }, { message: passwordRequirements }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match!",
    path: ['confirmPassword'],
  });

const StudentRegisterForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(studentSchema),
    mode: 'onTouched',
  });

  const password = watch('password', '');

  // Real-time password strength check
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
      special: /[^A-Za-z0-9]/.test(password),
    };

    setPasswordValid(
      checks.length &&
      checks.lowercase &&
      checks.uppercase &&
      checks.number &&
      checks.special
    );
  }, [password]);

  const onSubmit = async (data) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.fullName.trim(),
          email: data.email.trim(),
          password: data.password,
          role: 'student',
          phone: data.phone,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (result.success) {
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        toast.error(result.message || 'Registration failed. Please check your details and try again.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to register right now. Please try again in a moment.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col flex-1">
      <h2 className="mb-1 text-lg font-bold text-gray-800 dark:text-white">Create Student Account</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
        Sign up to find IT internships and grow your career in Nepal.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-2 flex-1">
        {/* Full Name */}
        <div className="mb-6">
          <label htmlFor="fullName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Full Name</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
              ${errors.fullName ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : (watch('fullName') && !errors.fullName ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-gray-300 dark:border-slate-600')}
            `}
          >
            <User className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="fullName"
              type="text"
              {...register('fullName')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Full Name"
              autoComplete="name"
            />
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.fullName?.message}
          </span>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Email</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
              ${errors.email ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : (watch('email') && !errors.email ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-gray-300 dark:border-slate-600')}
            `}
          >
            <Mail className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="email"
              type="email"
              {...register('email')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Email"
              autoComplete="email"
            />
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.email?.message}
          </span>
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Phone Number</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
              ${errors.phone ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : (watch('phone') && !errors.phone ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-gray-300 dark:border-slate-600')}
            `}
          >
            <Phone className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="phone"
              type="text"
              {...register('phone', {
                onChange: (e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setValue('phone', digits, { shouldValidate: true });
                },
              })}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Phone Number (e.g. 9841234567)"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
            />
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
            {errors.phone?.message}
          </span>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Password</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
              errors.password
                ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                : passwordValid
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                : 'border-gray-300 dark:border-slate-600'
            }`}
          >
            <Lock className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="ml-2 text-gray-500 hover:text-blue-600 focus:outline-none dark:text-slate-400 dark:hover:text-blue-400"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <Eye size={20} />
              ) : (
                <EyeOff size={20} />
              )}
            </button>
          </div>
          <span className="block mt-1 min-h-[18px] text-xs text-red-600">
          </span>

          {/* Password checklist */}
          <div className="mt-3 rounded-md border bg-gray-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 font-medium text-gray-700 dark:text-slate-200">Password must:</p>
            <ul className="space-y-1.5">
              <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500 dark:text-slate-400'}`}>At least 8 characters</li>
              <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500 dark:text-slate-400'}`}>Lowercase letter</li>
              <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500 dark:text-slate-400'}`}>Uppercase letter</li>
              <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500 dark:text-slate-400'}`}>Number</li>
              <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-500 dark:text-slate-400'}`}>Special character</li>
            </ul>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">All <strong>five</strong> requirements must be met</p>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-10">
          <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Confirm Password</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
              ${errors.confirmPassword ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : (watch('confirmPassword') && !errors.confirmPassword ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-gray-300 dark:border-slate-600')}
            `}
          >
            <Lock className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Confirm Password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="ml-2 text-gray-500 hover:text-blue-600 focus:outline-none dark:text-slate-400 dark:hover:text-blue-400"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <Eye size={20} />
              ) : (
                <EyeOff size={20} />
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
          {isSubmitting ? 'Creating Account...' : 'Create Student Account'}
        </button>
      </form>

      <div className="flex-grow"></div>
      <p className="mt-3 text-center text-xs text-gray-600 dark:text-slate-300">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Log in
        </button>
      </p>
    </div>
  );
};

export default StudentRegisterForm;
