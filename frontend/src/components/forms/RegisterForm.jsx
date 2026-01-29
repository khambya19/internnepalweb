import { useState } from 'react';
import { z } from 'zod';
import { z } from 'zod';

const RegisterForm = ({ onSuccess, switchToLogin }) => {
    // State to hold the input values
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });


        // Zod schema for strong password
        const passwordRequirements =
            'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';
        const registerSchema = z.object({
            name: z.string().min(2, 'Full Name is required'),
            email: z.string().email('Enter a valid email'),
            phone: z.string().regex(/^\+977[0-9]{10}$/, 'Phone number must be in +977XXXXXXXXXX format'),
            password: z
                .string()
                .min(8, passwordRequirements)
                .regex(/[A-Z]/, passwordRequirements)
                .regex(/[a-z]/, passwordRequirements)
                .regex(/[0-9]/, passwordRequirements)
                .regex(/[^A-Za-z0-9]/, passwordRequirements),
            confirmPassword: z.string(),
        }).refine((data) => data.password === data.confirmPassword, {
            message: "Passwords don't match!",
            path: ['confirmPassword'],
        });

        // Password strength calculation (for UI only)
        const calculateStrength = (password) => {
                let strength = 0;
                if (password.length >= 8) strength++;
                if (/[A-Z]/.test(password)) strength++;
                if (/[0-9]/.test(password)) strength++;
                if (/[^A-Za-z0-9]/.test(password)) strength++;
                return strength;
        };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedForm = {
            ...formData,
            [name]: value
        };
        setFormData(updatedForm);
        if (name === 'password') {
            setPasswordStrength(calculateStrength(value));
            setPasswordChecks({
                length: value.length >= 8,
                uppercase: /[A-Z]/.test(value),
                lowercase: /[a-z]/.test(value),
                number: /[0-9]/.test(value),
                special: /[^A-Za-z0-9]/.test(value),
            });
        }
        // Trim password fields before validation
        const trimmedForm = {
            ...updatedForm,
            password: updatedForm.password.trim(),
            confirmPassword: updatedForm.confirmPassword.trim(),
        };
        // Real-time zod validation for all fields
        const result = registerSchema.safeParse(trimmedForm);
        if (!result.success) {
            // Set all field errors at once
            const newErrors = {};
            result.error.errors.forEach(err => {
                newErrors[err.path[0]] = err.message;
            });
            setErrors(newErrors);
        } else {
            setErrors({});
        }
    };

    // Validate phone number (+977 format)
    const isValidPhone = (phone) => {
        return /^\+977[0-9]{10}$/.test(phone);
    };

    // Handle form submission with zod validation
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Trim password fields before validation
        const trimmedForm = {
            ...formData,
            password: formData.password.trim(),
            confirmPassword: formData.confirmPassword.trim(),
        };

        // Zod validation
        const result = registerSchema.safeParse(trimmedForm);
        if (!result.success) {
            // Show all errors
            const newErrors = {};
            result.error.errors.forEach(err => {
                newErrors[err.path[0]] = err.message;
            });
            setErrors(newErrors);
            setLoading(false);
            return;
        }
        setErrors({});

        try {
            // Pointing to the REGISTER endpoint on port 5050
            const response = await fetch('http://localhost:5050/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // --- JWT STORAGE LOGIC (Same as Login) ---
            // We auto-login the user after registration
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            alert('Registration Successful! Welcome to InternNepal.');
            // Close the modal
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setErrors({ general: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 py-8 px-2">
            <form className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-blue-100" onSubmit={handleSubmit}>
                <h2 className="text-3xl font-extrabold text-blue-600 mb-6 text-center tracking-tight">Create Account</h2>
                {errors.general && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
                        {errors.general}
                    </div>
                )}
                <div className="mb-4 text-left">
                    <label className="block text-slate-900 text-sm font-bold mb-2" htmlFor="name">
                        Full Name
                    </label>
                    <input 
                        className="border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        type="text" 
                        id="name" 
                        name="name" 
                        value={formData.name}
                        onChange={handleChange}
                        required 
                        placeholder="John Doe"
                    />
                    <span className="text-xs text-red-500">{errors.name}</span>
                </div>
                <div className="mb-4 text-left">
                    <label className="block text-slate-900 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input 
                        className="border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email}
                        onChange={handleChange}
                        required 
                        placeholder="you@example.com"
                    />
                    <span className="text-xs text-red-500">{errors.email}</span>
                </div>
                <div className="mb-4 text-left">
                    <label className="block text-slate-900 text-sm font-bold mb-2" htmlFor="phone">
                        Phone Number
                    </label>
                    <input
                        className="border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+97798XXXXXXXX"
                        pattern="\+977[0-9]{10}"
                    />
                    <span className="text-xs text-red-500">{errors.phone}</span>
                </div>
                <div className="mb-4 text-left">
                    <label className="block text-slate-900 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input 
                        className="border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        type="password" 
                        id="password" 
                        name="password" 
                        value={formData.password}
                        onChange={handleChange}
                        required 
                        minLength="8"
                        placeholder="••••••••"
                    />
                    <span className="text-xs text-red-500">{errors.password}</span>
                    {/* Password requirements checklist */}
                    <ul className="mt-2 mb-2 text-xs">
                        <li className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{passwordChecks.length ? '✔️' : '❌'}</span>
                            At least 8 characters
                        </li>
                        <li className={`flex items-center gap-2 ${passwordChecks.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{passwordChecks.uppercase ? '✔️' : '❌'}</span>
                            One uppercase letter
                        </li>
                        <li className={`flex items-center gap-2 ${passwordChecks.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{passwordChecks.lowercase ? '✔️' : '❌'}</span>
                            One lowercase letter
                        </li>
                        <li className={`flex items-center gap-2 ${passwordChecks.number ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{passwordChecks.number ? '✔️' : '❌'}</span>
                            One number
                        </li>
                        <li className={`flex items-center gap-2 ${passwordChecks.special ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{passwordChecks.special ? '✔️' : '❌'}</span>
                            One special character
                        </li>
                    </ul>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                                passwordStrength === 0 ? 'bg-gray-300 w-1/6' :
                                passwordStrength === 1 ? 'bg-red-400 w-1/4' :
                                passwordStrength === 2 ? 'bg-yellow-400 w-2/4' :
                                passwordStrength === 3 ? 'bg-blue-400 w-3/4' :
                                'bg-green-500 w-full'
                            }`}
                        ></div>
                    </div>
                    <span className="text-xs text-slate-500">
                        {passwordStrength === 0 && 'Too short'}
                        {passwordStrength === 1 && 'Weak'}
                        {passwordStrength === 2 && 'Medium'}
                        {passwordStrength === 3 && 'Strong'}
                        {passwordStrength === 4 && 'Very Strong'}
                    </span>
                </div>
                <div className="mb-6 text-left">
                    <label className="block text-slate-900 text-sm font-bold mb-2" htmlFor="confirmPassword">
                        Confirm Password
                    </label>
                    <input
                        className="border border-blue-100 rounded-lg w-full py-3 px-4 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength="8"
                        placeholder="Re-enter password"
                    />
                    <span className="text-xs text-red-500">{errors.confirmPassword}</span>
                </div>
                <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full w-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-600 text-base"
                    type="submit" 
                    disabled={loading}
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">
                        Already have an account?{' '}
                        <button 
                            type="button"
                            onClick={switchToLogin}
                            className="text-cyan-500 hover:text-cyan-600 font-bold"
                        >
                            Login
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
}

export default RegisterForm;