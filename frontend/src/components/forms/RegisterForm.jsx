import { useState } from 'react';

const RegisterForm = ({ onSuccess, switchToLogin }) => {
    // State to hold the input values
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Password strength calculation (simple)
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
        setFormData({
            ...formData,
            [name]: value
        });
        if (name === 'password') {
            setPasswordStrength(calculateStrength(value));
        }
    };

    // Validate phone number (+977 format)
    const isValidPhone = (phone) => {
        return /^\+977[0-9]{10}$/.test(phone);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        if (!isValidPhone(formData.phone)) {
            setError('Phone number must be in +977XXXXXXXXXX format');
            setLoading(false);
            return;
        }

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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 py-8 px-2">
            <form className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-blue-100" onSubmit={handleSubmit}>
                <h2 className="text-3xl font-extrabold text-blue-600 mb-6 text-center tracking-tight">Create Account</h2>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
                        {error}
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
                        minLength="6"
                        placeholder="••••••••"
                    />
                    <div className="mt-2">
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
                        minLength="6"
                        placeholder="Re-enter password"
                    />
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