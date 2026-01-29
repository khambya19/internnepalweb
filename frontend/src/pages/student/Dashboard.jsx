import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { logout } = useContext(AuthContext);
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>
      <p>Welcome, student! Here you can browse jobs, manage your applications, and update your profile.</p>
      <button
        onClick={logout}
        className="mt-8 px-8 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-all duration-200"
      >
        Log Out
      </button>
    </div>
  );
};

export default StudentDashboard;
