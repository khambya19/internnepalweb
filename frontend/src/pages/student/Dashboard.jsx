import React, { useContext, useEffect, useState } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { AuthContext } from '../../context/authContext';
import {
  Briefcase,
  FileText,
  BookmarkCheck,
  TrendingUp,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';
import ProfileCompletion from '../../components/ProfileCompletion';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const [dashboardRes, profileRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/profile').catch((err) => {
            if (err.response?.status === 404) {
              return { data: { success: true, data: null } };
            }
            throw err;
          }),
        ]);

        if (dashboardRes.data.success) {
          setDashboardData(dashboardRes.data.data);
          setProfileData(profileRes?.data?.data || null);
        } else {
          setError('Failed to load dashboard data.');
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load dashboard data.';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = dashboardData
    ? [
        {
          label: 'Applied',
          value: String(dashboardData.stats.totalApplications || 0),
          sub: `${dashboardData.stats.pending || 0} pending`,
          icon: FileText,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          label: 'Saved Jobs',
          value: String(dashboardData.stats.savedJobs || 0),
          sub: `${dashboardData.stats.savedJobs || 0} total`,
          icon: BookmarkCheck,
          color: 'text-violet-600',
          bg: 'bg-violet-50',
        },
        {
          label: 'Interviews',
          value: String(dashboardData.stats.upcomingInterviews || 0),
          sub: 'Upcoming',
          icon: Briefcase,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          label: 'Profile Views',
          value: String(Number(profileData?.viewCount || 0)),
          sub: Number(profileData?.viewCount || 0) > 0 ? 'People viewed your profile' : 'No views yet',
          icon: TrendingUp,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
        },
      ]
    : [];

  const recentApplications = dashboardData?.recentApplications || [];
  const recommendedJobs = dashboardData?.recommendedJobs || [];
  const completionProfile = {
    ...(profileData || {}),
    name: profileData?.User?.name || user?.name || '',
    phone: profileData?.User?.phone || user?.phone || '',
    email: profileData?.User?.email || user?.email || '',
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  };

  const statusStyle = (status) => {
    if (status === 'shortlisted') return 'bg-emerald-100 text-emerald-700';
    if (status === 'rejected')    return 'bg-red-100 text-red-700';
    if (status === 'accepted')    return 'bg-blue-100 text-blue-700';
    if (status === 'interview')   return 'bg-violet-100 text-violet-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <StudentLayout user={user}>
      <div className="w-full space-y-3 sm:space-y-4 min-w-0">
        {/* ── Header - match company Overview ── */}
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white break-words leading-tight">
              Welcome back, {user?.name || 'Student'} 👋
            </h1>
            <p className="mt-0.5 text-sm sm:text-base text-slate-600 dark:text-gray-300">
              Track your applications and discover new opportunities.
            </p>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
          <Link
            to="/student/browse-jobs"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shrink-0 w-full sm:w-auto"
          >
            <Search size={18} />
            Browse Internships
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Stats - match company KPI cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg p-4 sm:p-5 min-w-0 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg p-2 ${stat.bg} ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-gray-300 truncate">{stat.label}</p>
                    <p className="mt-1 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{stat.value}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Recent Applications - match company card style */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden min-w-0">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Applications</h2>
                  <Link
                    to="/student/applications"
                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold flex items-center gap-1 shrink-0"
                  >
                    View All <ArrowUpRight size={14} />
                  </Link>
                </div>

                {recentApplications.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-gray-400">
                    You haven&apos;t applied to any internships yet.
                  </p>
                ) : (
                  <>
                    {/* Mobile: stacked cards (< md) */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {recentApplications.map((app) => (
                        <div key={app.id} className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white break-all line-clamp-2 mb-0.5">
                            {app.jobTitle}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-gray-300 truncate mb-2">{app.companyName}</p>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${statusStyle(app.status)}`}>
                              {app.status}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-gray-400">{formatDate(app.appliedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table (md+) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-gray-300 uppercase text-xs font-medium tracking-wide">
                            <th className="px-5 py-3 w-[40%]">Position</th>
                            <th className="px-5 py-3 w-[25%]">Company</th>
                            <th className="px-5 py-3 w-[20%]">Status</th>
                            <th className="px-5 py-3 w-[15%]">Applied</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {recentApplications.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                              <td className="px-5 py-3 max-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={app.jobTitle}>
                                  {app.jobTitle}
                                </p>
                              </td>
                              <td className="px-5 py-3 max-w-0">
                                <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{app.companyName}</p>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase whitespace-nowrap ${statusStyle(app.status)}`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                {formatDate(app.appliedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-4">
                <ProfileCompletion
                  compact
                  profile={completionProfile}
                  onCompleteProfileClick={() => navigate('/student/profile')}
                />

                {/* Career Tip - match company card style */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg p-4 sm:p-5">
                  <h2 className="font-semibold text-base text-slate-900 dark:text-white mb-1.5">Career Tip 💡</h2>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed mb-4">
                    Keep your profile updated with your latest projects and skills. Companies in Nepal value practical experience over grades.
                  </p>
                  <Link
                    to="/student/profile"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm text-center transition-colors"
                  >
                    Update Profile
                  </Link>
                </div>

                {/* Recommended Jobs */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 sm:p-5 min-w-0">
                  <h2 className="font-semibold text-base text-slate-900 mb-3">Recommended For You</h2>
                  {recommendedJobs.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      We&apos;ll show recommended internships here as you start applying.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {recommendedJobs.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => navigate(`/student/job/${job.id}`)}
                          className="text-left w-full p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-slate-900 truncate" title={job.title}>
                            {job.title}
                          </p>
                          <p className="text-xs text-slate-600 truncate mt-0.5">
                            {job.companyName}{job.location ? ` • ${job.location}` : ''}
                          </p>
                          <p className="text-xs font-semibold text-emerald-600 mt-1.5">
                            {job.stipend
                              ? `Rs ${Number(job.stipend).toLocaleString()}/mo`
                              : 'Unpaid'}

                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
