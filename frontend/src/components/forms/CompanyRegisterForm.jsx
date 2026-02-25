
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, Phone, Globe, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const passwordRequirements =
  'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';

const companySchema = z
  .object({
    companyName: z.string().min(2, 'Company Name is required'),
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .refine(
        (val) => {
          // Must be exactly 9 digits and NOT start with 96, 97, or 98 (those are mobile)
          return /^[0-9]{9}$/.test(val) && !/^(96|97|98)/.test(val);
        },
        {
          message:
            'Contact number must be a 9-digit landline number (must not start with 96, 97, or 98)',
        }
      ),
    website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
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
        toast.error(result.message || 'Registration failed. Please verify your company details and try again.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to register right now. Please try again in a moment.');
    }
  };

  // Helper to decide input border style
  const getBorderClass = (fieldError, isTouched, isValid = true) => {
    if (fieldError) return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    if (isTouched && isValid) return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    return 'border-gray-300 dark:border-slate-600';
  };

  const companyName = watch('companyName', '');
  const email = watch('email', '');
  const phone = watch('phone', '');
  const website = watch('website', '');
  const confirmPassword = watch('confirmPassword', '');

  return (
    <div className="w-full h-full flex flex-col flex-1">
      <h2 className="mb-1 text-lg font-bold text-gray-800 dark:text-white">Create Company Account</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
        Post IT internships and connect with talented students in Nepal.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pb-2 flex-1">
        {/* Company Name */}
        <div className="mb-6">
          <label htmlFor="companyName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Company Name</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.companyName,
              touchedFields.companyName,
              companyName.trim().length >= 2
            )}`}
          >
            <Building2 className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="companyName"
              type="text"
              {...register('companyName')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
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
          <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Official Email</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.email,
              touchedFields.email,
              !!email && !errors.email
            )}`}
          >
            <Mail className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="email"
              type="email"
              {...register('email')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
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
          <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Landline Number</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.phone,
              touchedFields.phone,
              phone.length === 9 && !errors.phone
            )}`}
          >
            <Phone className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <span className="select-none font-medium text-gray-500 dark:text-slate-400">+977</span>
            <input
              id="phone"
              type="text"
              {...register('phone', {
                onChange: (e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                  setValue('phone', digits, { shouldValidate: true });
                },
              })}
              className="ml-2 flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
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
          <label htmlFor="website" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Website (optional)</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.website,
              touchedFields.website,
              website && !errors.website
            )}`}
          >
            <Globe className="mr-2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              id="website"
              type="url"
              {...register('website')}
              className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
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
            {errors.password?.message}
          </span>

         
          <div className="mt-3 rounded-md border bg-gray-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-2 font-medium text-gray-700 dark:text-slate-200">Password must:</p>
            <ul className="space-y-1.5">
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400 dark:text-slate-500' : password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>At least 8 characters</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400 dark:text-slate-500' : /[a-z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Lowercase letter</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400 dark:text-slate-500' : /[A-Z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Uppercase letter</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400 dark:text-slate-500' : /[0-9]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Number</li>
              <li className={`flex items-center gap-2 ${!password ? 'text-gray-400 dark:text-slate-500' : /[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>Special character</li>
            </ul>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">All <strong>five</strong> requirements must be met</p>
          </div>
        </div>

       
        <div className="mb-10">
          <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-slate-200">Confirm Password</label>
          <div
            className={`flex items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${getBorderClass(
              errors.confirmPassword,
              touchedFields.confirmPassword,
              confirmPassword && !errors.confirmPassword
            )}`}
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
          {isSubmitting ? 'Creating Account...' : 'Create Company Account'}
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

export default CompanyRegisterForm;
