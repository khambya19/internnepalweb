import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Shield,
  TrendingUp,
  Eye
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [viewStats, setViewStats] = useState({ totalJobViews: 0, totalProfileViews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setError(null);
    try {
      const [dashboardRes, viewsRes] = await Promise.all([
        api.get('/superadmin/dashboard'),
        api.get('/superadmin/views/stats'),
      ]);

      const dashboardData = dashboardRes?.data;
      if (dashboardData?.success && dashboardData?.data) {
        setStats(dashboardData.data);
      } else {
        setStats({ stats: {}, recentActivities: {} });
      }

      const viewsData = viewsRes?.data;
      if (viewsData?.success && viewsData?.data) {
        setViewStats({
          totalJobViews: Number(viewsData.data.totalJobViews ?? 0),
          totalProfileViews: Number(viewsData.data.totalProfileViews ?? 0),
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      setStats(prev => prev || { stats: {}, recentActivities: {} });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  const statsData = stats?.stats ?? {};
  const recentActivities = stats?.recentActivities ?? {};

  const statCards = [
    { 
      label: 'Total Users', 
      value: statsData.totalUsers ?? 0, 
      icon: Users, 
      color: 'bg-blue-500',
      subtext: 'Registered users'
    },
    { 
      label: 'Companies', 
      value: statsData.totalCompanies ?? 0, 
      icon: Building2, 
      color: 'bg-purple-500',
      subtext: 'Registered companies'
    },
    { 
      label: 'Students', 
      value: statsData.totalStudents ?? 0, 
      icon: GraduationCap, 
      color: 'bg-green-500',
      subtext: 'Active students'
    },
    { 
      label: 'Jobs', 
      value: statsData.totalJobs ?? 0, 
      icon: Briefcase, 
      color: 'bg-orange-500',
      subtext: `${statsData.activeJobs ?? 0} active`
    },
    { 
      label: 'Applications', 
      value: statsData.totalApplications ?? 0, 
      icon: FileText, 
      color: 'bg-pink-500',
      subtext: `${statsData.pendingApplications ?? 0} pending`
    },
    {
      label: 'Total Job Views',
      value: viewStats.totalJobViews || 0,
      icon: Eye,
      color: 'bg-indigo-500',
      subtext: 'Across all job posts'
    },
    {
      label: 'Total Profile Views',
      value: viewStats.totalProfileViews || 0,
      icon: Eye,
      color: 'bg-cyan-500',
      subtext: 'Across all student profiles'
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full min-w-0">
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-5 sm:p-6 lg:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Shield size={40} className="shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2">Super Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-yellow-100">Complete system control and monitoring</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white`}>
                  <Icon size={22} />
                </div>
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 break-all">{stat.value}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">{stat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Recent Users
          </h2>
          <div className="space-y-3">
            {recentActivities.recentUsers?.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.role === 'student' ? 'bg-green-100 text-green-700' :
                    user.role === 'company' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-orange-500" />
            Recent Jobs
          </h2>
          <div className="space-y-3">
            {recentActivities.recentJobs?.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{job.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                  job.status === 'active' ? 'bg-green-100 text-green-700' :
                  job.status === 'closed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
