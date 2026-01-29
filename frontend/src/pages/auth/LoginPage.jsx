import LoginSelector from '../../components/forms/LoginSelector';
import { Link, useLocation } from 'react-router-dom';
import loginIllustration from '../../assets/images/register-illustration.svg'; // Use your own illustration or a blue block

const LoginPage = () => {
  const location = useLocation();
  const successMsg = location.state?.success;
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 py-8">
      <div className="w-full max-w-5xl h-[600px] flex bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left: Login Card */}
        <div className="flex-1 flex flex-col justify-center items-center px-10 py-8">
          {/* Logo and heading */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex flex-col items-center mb-8">
              <span className="text-3xl font-extrabold text-blue-700 tracking-tight block mb-1">InternNepal</span>
              <p className="text-base text-gray-700 font-medium mb-1">Find IT internships. Grow your career.</p>
              <p className="text-sm text-gray-500">Nepal's #1 platform for students and companies to connect for real-world experience.</p>
            </div>
            {successMsg && <div className="text-green-600 text-base mb-4 text-center">{successMsg}</div>}
            <LoginSelector />
          </div>
        </div>
        {/* Right: Illustration or blue panel */}
        <div className="hidden md:flex flex-1 flex-col justify-center items-center bg-blue-600 h-full p-0 relative">
          <div className="text-white text-2xl font-bold mb-4 px-8 text-center">Empowering Nepal's IT Interns & Companies</div>
          <div className="text-white text-base font-medium mb-8 px-8 text-center">Log in to access your dashboard and start your journey.</div>
          <img src={loginIllustration} alt="Login Illustration" className="w-3/4 max-w-xs rounded-xl shadow-lg bg-blue-700/30 p-4" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
