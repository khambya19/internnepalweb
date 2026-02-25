import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Inbox,
  TrendingUp,
  Eye,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { AuthContext } from '../../../../context/authContext';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatRelativeDate } from '../../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

const Overview = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const toNum = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const profileIncomplete = user?.profileCompletion && !user.profileCompletion.completed;

  const [data, setData] = useState({
    stats: {
      activePostings: 0,
      totalApplications: 0,
      newApplicationsToday: 0,
      avgApplicationsPerPosting: 0,
      totalViews: 0,
      conversionRate: 0,
    },
    statusBreakdown: [],
    recentApplications: [],
    applicationsData: [],
    companyName: 'Company'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:6060/api/company/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        toast.error('Failed to load dashboard statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpiCards = [
    {
      title: 'Active Postings',
      value: data.stats.activePostings,
      icon: Briefcase,
      trend: '+0 from last month',
      trendUp: true,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Total Applications',
      value: data.stats.totalApplications,
      icon: Inbox,
      trend: `+${data.stats.newApplicationsToday} today`,
      trendUp: true,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-950',
    },
    {
      title: 'New Today',
      value: data.stats.newApplicationsToday,
      icon: TrendingUp,
      trend: 'latest metrics',
      trendUp: true,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Avg per Posting',
      value: toNum(data.stats.avgApplicationsPerPosting, 0).toFixed(1),
      icon: Target,
      trend: 'overall average',
      trendUp: true,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'Total Views',
      value: toNum(data.stats.totalViews, 0).toLocaleString(),
      icon: Eye,
      trend: 'overall traction',
      trendUp: true,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    },
    {
      title: 'Conversion Rate',
      value: `${toNum(data.stats.conversionRate, 0)}%`,
      icon: TrendingUp,
      trend: 'applications / views',
      trendUp: toNum(data.stats.conversionRate, 0) > 0,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950',
    },
  ];

  const statusColors = {
    Applied: 'bg-blue-100 text-blue-800',
    'Under Review': 'bg-amber-100 text-amber-800',
    Shortlisted: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    'Interview Scheduled': 'bg-violet-100 text-violet-800',
    Hired: 'bg-teal-100 text-teal-800',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="text-slate-600">Loading overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 min-w-0 pt-0">
      {/* Profile Incomplete Banner */}
      {profileIncomplete && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Complete Your Company Profile
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Please complete your company profile to unlock all features including posting internships, viewing applications, and browsing candidates.
              </p>
              <div className="mt-3">
                <Button 
                  onClick={() => navigate('/company/dashboard/profile')}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Complete Profile Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white break-words leading-tight">
            Welcome back, {data.companyName}! 👋
          </h1>
          <p className="mt-0.5 text-sm sm:text-base text-gray-700 dark:text-gray-200">
            Here&apos;s what&apos;s happening with your internship postings today.
          </p>
        </div>
        <Button
          onClick={() => !profileIncomplete && navigate('/company/dashboard/post-internship')}
          disabled={profileIncomplete}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title={profileIncomplete ? 'Complete your profile to post internships' : ''}
        >
          <PlusCircle size={18} />
          Post New Internship
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 min-w-0">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-w-0 overflow-hidden">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
                  <kpi.icon className={kpi.color} size={20} />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                  {kpi.title}
                </p>
                <p className="mt-1 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {kpi.value}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {kpi.trendUp ? (
                    <ArrowUpRight size={14} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownRight size={14} className="text-red-600 dark:text-red-400" />
                  )}
                  <span className={kpi.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Applications Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.applicationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Applications"
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Application Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusBreakdown.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                No application status data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-white">Recent Applications</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/company/dashboard/applications')}
              className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Student</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Applied For</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Date</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => navigate('/company/dashboard/applications')}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {app.avatar}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{app.studentName}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-700 dark:text-slate-300">{app.postingTitle}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Clock size={14} />
                        <span className="text-sm">{formatRelativeDate(app.appliedDate)}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge className={statusColors[app.status]}>{app.status}</Badge>
                    </td>
                  </tr>
                ))}
                {data.recentApplications.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No recent applications yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
