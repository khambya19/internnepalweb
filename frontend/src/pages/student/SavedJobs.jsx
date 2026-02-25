import React, { useState, useEffect, useContext } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { AuthContext } from '../../context/authContext';
import { MapPin, Heart, DollarSign, Calendar, Eye, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SearchWithHistory } from '../../components/ui/SearchWithHistory';
import { formatFullDate, timeAgo, getDaysLeft } from '../../utils/dateUtils';
import EmptyState from '../../components/EmptyState';

// Check if job was posted within last 24 hours
const isNewJob = (createdAt) => {
  if (!createdAt) return false;
  const now = new Date();
  const posted = new Date(createdAt);
  const diffHours = (now - posted) / (1000 * 60 * 60);
  return diffHours <= 24;
};

const formatViewCount = (count) => {
  const value = Number(count || 0);
  if (value <= 0) return '';
  if (value < 1000) return `${value} views`;
  const compact = Math.round((value / 1000) * 10) / 10;
  return `${compact}k views`;
};

const SavedJobs = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmUnsaveJobId, setConfirmUnsaveJobId] = useState(null);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const res = await api.get('/student/saved-jobs');
        if (res.data.success) {
          const formatted = res.data.data.map((item) => {
            const job = item.Job || {};
            const company = job.company || {};
            return {
              id: job.id,
              title: job.title || 'Untitled Role',
              company: company.companyName || '',
              companyInitial: (company.companyName || 'C').charAt(0).toUpperCase(),
              logo: company.logo || null,
              stipend: job.stipend || null,
              isPaid: job.isPaid,
              location: Array.isArray(job.locations) && job.locations.length > 0
                ? job.locations.join(', ')
                : job.location || company.location || '',
              category: job.category || null,
              workMode: job.workMode || null,
              type: job.type || null,
              deadline: job.deadline || null,
              createdAt: job.createdAt,
              viewCount: Number(job.viewCount ?? job.views ?? 0),
              applicationsCount: job.applicationsCount || 0,
              applicantCount: Number(job.applicantCount ?? job.applicationsCount ?? 0),
            };
          });
          setSavedJobs(formatted);
        }
      } catch (err) {
        // Silently handle profile incomplete errors
        if (err?.response?.data?.code !== 'PROFILE_INCOMPLETE') {
          toast.error('Failed to load saved jobs');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSavedJobs();
  }, []);

  const handleConfirmUnsave = async () => {
    if (!confirmUnsaveJobId) return;
    const jobId = confirmUnsaveJobId;
    setConfirmUnsaveJobId(null);
    try {
      await api.delete(`/student/saved-jobs/${jobId}`);
      setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
      toast.success('Job removed from your saved list.');
    } catch {
      toast.error('Failed to remove job from saved list.');
    }
  };

  const filteredJobs = savedJobs.filter((job) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q) || job.location.toLowerCase().includes(q);
  });

  const logoSrc = (logo) =>
    logo?.startsWith('http') || logo?.startsWith('data:') ? logo : `/${logo}`;

  const openJobDetails = (jobId) => {
    navigate(`/student/job/${jobId}`, { state: { from: location.pathname } });
  };

  return (
    <StudentLayout user={user}>
      <ConfirmModal
        open={!!confirmUnsaveJobId}
        onClose={() => setConfirmUnsaveJobId(null)}
        onConfirm={handleConfirmUnsave}
        title="Remove from saved list?"
        message="This job will be removed from your saved list. You can save it again from Browse Jobs."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Saved Jobs</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-700 dark:text-gray-200">Review and manage the internships you've saved for later.</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <SearchWithHistory
              historyKey="student-saved-jobs"
              placeholder="Search saved jobs..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Grid */}
        {loading ? (
          <Card><CardContent className="flex justify-center items-center py-16"><span className="text-gray-500 dark:text-gray-400">Loading saved jobs...</span></CardContent></Card>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Heart}
                title="No saved jobs yet"
                description="Save internships while browsing to quickly find them here."
                actionLabel="Browse Internships"
                onAction={() => navigate('/student/browse-jobs')}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredJobs.map((job) => {
              const daysLeft = getDaysLeft(job.deadline);
              const postedAgo = timeAgo(job.createdAt);
              const postedFullDate = formatFullDate(job.createdAt);
              const showNewBadge = isNewJob(job.createdAt);

              return (
                <Card key={job.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex flex-col hover:shadow-md transition-shadow relative overflow-visible">
                  {/* NEW Badge */}
                  {showNewBadge && (
                    <div className="absolute -top-2 -left-2 z-10">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-md animate-pulse">
                        NEW
                      </span>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3 mb-2 min-w-0">
                      <div className="shrink-0">
                        {job.logo ? (
                          <img src={logoSrc(job.logo)} alt="Logo" className="h-10 w-10 object-cover rounded-full border border-gray-300 dark:border-gray-700" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                            {job.companyInitial}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle
                          className="text-slate-900 dark:text-white text-base sm:text-lg line-clamp-2 break-all cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                          title={job.title}
                          onClick={() => openJobDetails(job.id)}
                        >
                          {job.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.company}</p>
                        
                        {/* Deadline Warning Badge */}
                        {job.deadline && (() => {
                          if (daysLeft < 0) {
                            return (
                              <span className="mt-1 inline-block text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                                Expired
                              </span>
                            );
                          }
                          if (daysLeft === 0) {
                            return (
                              <span className="mt-1 inline-block text-xs font-bold bg-red-500 dark:bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                                Deadline Today!
                              </span>
                            );
                          }
                          if (daysLeft === 1) {
                            return (
                              <span className="mt-1 inline-block text-xs font-bold bg-red-500 dark:bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                                Last Day to Apply!
                              </span>
                            );
                          }
                          if (daysLeft <= 3) {
                            return (
                              <span className="mt-1 inline-block text-xs font-bold bg-orange-500 dark:bg-amber-600 text-white px-2 py-0.5 rounded">
                                Deadline in {daysLeft} days!
                              </span>
                            );
                          }
                          if (daysLeft <= 7) {
                            return (
                              <span className="mt-1 inline-block text-xs font-bold bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-2 py-0.5 rounded">
                                Closing Soon
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.category && <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-200 text-xs">{job.category}</Badge>}
                      {job.workMode && <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-200 text-xs">{job.workMode}</Badge>}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between space-y-3 pb-4">
                    <div className="text-gray-900 dark:text-white space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>
                          {job.stipend != null && job.stipend !== '' && Number(job.stipend) > 0
                            ? `NPR ${Number(job.stipend).toLocaleString()}/month`
                            : 'Unpaid'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                        {daysLeft !== null ? (
                          <span className={daysLeft <= 3 ? 'text-red-600 font-semibold' : ''}>{daysLeft} days left</span>
                        ) : postedAgo ? (
                          <span className="group relative inline-flex items-center">
                            <span>Posted {postedAgo}</span>
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md group-hover:block dark:bg-slate-100 dark:text-slate-900">
                              {postedFullDate}
                            </span>
                          </span>
                        ) : <span>—</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-900 dark:text-white">
                      <div className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {job.type || 'internship'}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Users size={14} />
                        <span>
                          {(job.applicantCount || 0) <= 0
                            ? 'Be the first to apply!'
                            : (job.applicantCount || 0) > 100
                              ? '100+ applicants'
                              : `${job.applicantCount} applicants`}
                        </span>
                      </div>
                      {Number(job.viewCount || 0) > 0 && (
                        <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Eye size={14} className="text-slate-500 dark:text-slate-400" />
                          <span>{formatViewCount(job.viewCount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <Button
                        onClick={() => openJobDetails(job.id)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                      >
                        View & Apply
                      </Button>
                      <Button
                        onClick={() => setConfirmUnsaveJobId(job.id)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        <Heart size={14} className="fill-current" />
                        Unsave
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default SavedJobs;
