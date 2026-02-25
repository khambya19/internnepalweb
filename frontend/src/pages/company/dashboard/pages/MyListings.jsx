import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  Edit,
  Eye,
  XCircle,
  RotateCcw,
  Trash2,
  Filter,
  FileText,
  Inbox,
  MapPin,
  DollarSign,
  Calendar,
  Pause,
  Play,
  Briefcase,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { SearchWithHistory } from '../../../../components/ui/SearchWithHistory';
import { formatNPR } from '../../../../lib/utils';
import { toast } from 'sonner';
import axios from 'axios';
import { useEffect } from 'react';
import { ConfirmModal } from '../../../../components/ui/ConfirmModal';
import { getDaysLeft } from '../../../../utils/dateUtils';
import EmptyState from '../../../../components/EmptyState';

// Check if job was posted within last 24 hours
const isNewJob = (createdAt) => {
  if (!createdAt) return false;
  const now = new Date();
  const posted = new Date(createdAt);
  const diffHours = (now - posted) / (1000 * 60 * 60);
  return diffHours <= 24;
};

const MyListings = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'close'|'repost'|'delete', posting }
  const [pauseLoading, setPauseLoading] = useState({});

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:6060/api/jobs/my-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      if (error?.response?.data?.code === 'PROFILE_INCOMPLETE') {
        toast.error('Please complete your company profile first.');
      } else {
        toast.error('Failed to load your jobs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle actions
  const handleEdit = (posting) => {
    navigate('/company/dashboard/post-internship', { state: { posting } });
  };

  const handleDelete = (posting) => {
    setConfirmAction({ type: 'delete', posting });
  };

  const handlePublish = (posting) => {
    setConfirmAction({ type: 'publish', posting });
  };

  const handleToggleHiringPause = async (posting) => {
    setPauseLoading({ ...pauseLoading, [posting.id]: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:6060/api/jobs/${posting.id}/pause`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const newStatus = res.data.data.hiringPaused;
        toast.success(
          newStatus 
            ? '⏸️ Hiring paused. Students cannot apply until you resume.' 
            : '▶️ Hiring resumed. Students can now apply for this position.'
        );
        fetchJobs();
      }
    } catch (error) {
      if (error?.response?.data?.code === 'PROFILE_INCOMPLETE') {
        toast.error('Please complete your company profile first.');
      } else {
        toast.error('Failed to update hiring status. Please try again.');
      }
    } finally {
      setPauseLoading({ ...pauseLoading, [posting.id]: false });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, posting } = confirmAction;
    setConfirmAction(null);
    try {
      const token = localStorage.getItem('token');
      if (type === 'close') {
        const res = await axios.put(`http://localhost:6060/api/jobs/${posting.id}`, { status: 'closed' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          toast.success(`✓ "${posting.title}" has been closed. It is no longer visible to students.`);
          fetchJobs();
        }
      } else if (type === 'repost') {
        const res = await axios.put(`http://localhost:6060/api/jobs/${posting.id}`, { status: 'active' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          toast.success(`✓ "${posting.title}" has been reposted! It is now visible to students again.`);
          fetchJobs();
        }
      } else if (type === 'publish') {
        const res = await axios.put(`http://localhost:6060/api/jobs/${posting.id}`, { status: 'active' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          toast.success(`✓ "${posting.title}" has been published! It is now visible to students.`);
          fetchJobs();
        }
      } else if (type === 'delete') {
        const res = await axios.delete(`http://localhost:6060/api/jobs/${posting.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          toast.success('✓ Job posting deleted successfully. All associated data has been removed.');
          fetchJobs();
        }
      }
    } catch {
      toast.error('Failed to update. Please try again.');
    }
  };

  const getConfirmConfig = () => {
    if (!confirmAction) return null;
    const title = confirmAction.posting?.title || 'this listing';
    if (confirmAction.type === 'close') {
      return { title: 'Close listing?', message: `"${title}" will no longer accept applications.`, confirmLabel: 'Close', variant: 'default' };
    }
    if (confirmAction.type === 'repost') {
      return { title: 'Repost listing?', message: `"${title}" will be visible to candidates again.`, confirmLabel: 'Repost', variant: 'default' };
    }
    if (confirmAction.type === 'publish') {
      return { title: 'Publish listing?', message: `"${title}" will be published and visible to students.`, confirmLabel: 'Publish', variant: 'default' };
    }
    return { title: 'Delete listing?', message: `Are you sure you want to delete "${title}"? This cannot be undone.`, confirmLabel: 'Delete', variant: 'danger' };
  };

  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(posting => posting.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Apply search filter
    if (globalFilter) {
      filtered = filtered.filter(posting =>
        posting.title?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        posting.category?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        posting.location?.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [data, statusFilter, globalFilter]);

  const confirmConfig = getConfirmConfig();

  return (
    <div className="space-y-6">
      {confirmConfig && (
        <ConfirmModal
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          cancelLabel="Cancel"
          variant={confirmConfig.variant}
        />
      )}
      {/* Header - black text for visibility */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            My Postings
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-700 dark:text-gray-200">
            Manage all your internship listings
          </p>
        </div>
        <Button
          onClick={() => navigate('/company/dashboard/post-internship')}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          Post New Internship
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex-1">
              <SearchWithHistory
                historyKey="company-my-listings"
                placeholder="Search postings..."
                value={globalFilter ?? ''}
                onChange={setGlobalFilter}
                className="w-full"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={18} className="text-gray-400 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 min-w-[130px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-16">
            <span className="text-gray-500 dark:text-gray-400">Loading your jobs...</span>
          </CardContent>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Briefcase}
              title="No postings found"
              description="Get started by creating your first internship posting."
              actionLabel="Post New Internship"
              onAction={() => navigate('/company/dashboard/post-internship')}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredData.map((posting) => {
            const daysLeft = getDaysLeft(posting.deadline);
            const postedDate = posting.createdAt ? new Date(posting.createdAt) : null;
            const showNewBadge = isNewJob(posting.createdAt);

            return (
              <Card key={posting.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 flex flex-col relative overflow-visible">
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
                    {posting.CompanyProfile?.logo ? (
                      <img
                        src={posting.CompanyProfile.logo.startsWith('http') || posting.CompanyProfile.logo.startsWith('data:') ? posting.CompanyProfile.logo : `/${posting.CompanyProfile.logo}`}
                        alt="Company Logo"
                        className="h-10 w-10 object-cover rounded-full border border-gray-300 dark:border-gray-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {(posting.CompanyProfile?.companyName || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-slate-900 dark:text-white text-base sm:text-lg line-clamp-2 break-all" title={posting.title}>{posting.title}</CardTitle>
                      
                      {/* Deadline Warning Badge */}
                      {posting.deadline && (() => {
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-200 text-xs">{posting.category}</Badge>
                    {(() => {
                      const status = (posting.status || '').toLowerCase();
                      if (status === 'draft') {
                        return <Badge className="bg-gray-400 text-white dark:bg-gray-600 dark:text-gray-100 text-xs font-semibold">📝 Draft</Badge>;
                      }
                      if (status === 'active' || status === 'live') {
                        return <Badge className="bg-green-500 text-white dark:bg-green-600 dark:text-white text-xs font-semibold">✓ Active</Badge>;
                      }
                      if (status === 'closed') {
                        return <Badge className="bg-red-500 text-white dark:bg-red-600 dark:text-white text-xs font-semibold">✕ Closed</Badge>;
                      }
                      if (status === 'expired') {
                        return <Badge className="bg-gray-500 text-white dark:bg-gray-700 dark:text-gray-200 text-xs font-semibold">⏰ Expired</Badge>;
                      }
                      return null;
                    })()}
                    {posting.hiringPaused && (
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">⏸ Paused</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-3 pb-4">
                  <div className="text-gray-900 dark:text-white space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-300 dark:text-slate-500 shrink-0" />
                      <span className="truncate">
                        {Array.isArray(posting.locations) && posting.locations.length > 0
                          ? posting.locations.join(', ')
                          : posting.location || posting.CompanyProfile?.location || 'Not Specified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>
                        {posting.stipend != null && posting.stipend !== '' && Number(posting.stipend) > 0
                          ? formatNPR(posting.stipend)
                          : 'Unpaid'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                      {daysLeft !== null ? (
                        <span>{daysLeft} days left</span>
                      ) : postedDate ? (
                        <span>Posted {postedDate.toLocaleDateString()}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <Eye size={16} className="text-slate-500 dark:text-slate-400" />
                      <span>{Number(posting.viewCount ?? posting.views ?? 0)} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Inbox size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>{typeof posting.applicationsCount === 'number' ? posting.applicationsCount : 0} applications</span>
                    </div>
                  </div>

                  {/* Hiring Toggle */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {posting.hiringPaused ? (
                        <Pause size={14} className="text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Play size={14} className="text-green-600 dark:text-green-400" />
                      )}
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {posting.hiringPaused ? 'Hiring Paused' : 'Hiring Active'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleHiringPause(posting)}
                      disabled={pauseLoading[posting.id]}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        posting.hiringPaused
                          ? 'bg-gray-300 dark:bg-gray-600'
                          : 'bg-green-500 dark:bg-green-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          posting.hiringPaused ? 'translate-x-0.5' : 'translate-x-4'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  {(posting.status || '').toLowerCase() === 'draft' ? (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <Button
                        onClick={() => handlePublish(posting)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <Send size={14} />
                        <span className="text-xs sm:text-sm">Publish</span>
                      </Button>
                      <Button
                        onClick={() => handleEdit(posting)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Edit size={14} />
                        <span className="text-xs sm:text-sm">Edit</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <Button
                        onClick={() => handleEdit(posting)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Edit size={14} />
                        <span className="text-xs sm:text-sm">Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleDelete(posting)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Trash2 size={14} />
                        <span className="text-xs sm:text-sm">Delete</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyListings;
