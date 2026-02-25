import React, { useState, useEffect, useContext, useCallback } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { AuthContext } from '../../context/authContext';
import { MapPin, Clock, Calendar, Eye, Video, Navigation, ExternalLink, X, CheckCircle, XCircle, AlertCircle, Loader, FileText, Trash2, Briefcase } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';
import EmptyState from '../../components/EmptyState';

const ASSET_ORIGIN = 'http://localhost:6060';

const toAssetUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const normalized = raw.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/^\/+/, '');
  if (!normalized) return '';
  return `${ASSET_ORIGIN}/${normalized}`;
};

const normalizeStatus = (status) => {
  const lower = String(status || '').toLowerCase().trim();
  if (lower === 'applied' || lower === 'pending' || lower === 'under review') return 'pending';
  if (lower === 'shortlisted') return 'shortlisted';
  if (lower === 'interview scheduled' || lower === 'interview') return 'interview';
  if (lower === 'offered') return 'offered';
  if (lower === 'accepted') return 'accepted';
  if (lower === 'hired') return 'hired';
  if (lower === 'rejected') return 'rejected';
  return 'pending';
};

const MyApplications = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null); // for status modal
  const [withdrawingId, setWithdrawingId] = useState(null); // for withdraw loading state
  const [confirmWithdraw, setConfirmWithdraw] = useState(null); // for confirmation dialog


  const fetchApplications = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError('');
      const res = await api.get('/applications/my-applications');
      if (res.data.success) {
        const formattedData = res.data.data.map((app) => {
          const normalized = normalizeStatus(app.status);
          const company = app.Job?.company || app.Job?.CompanyProfile || null;
          return {
            id: app.id,
            jobTitle: app.Job?.title || 'Unknown Job',
            jobId: app.Job?.id,
            company: company?.companyName || 'Unknown Company',
            location: Array.isArray(app.Job?.locations) && app.Job.locations.length > 0
              ? app.Job.locations.join(', ')
              : app.Job?.location || company?.location || 'Not Specified',
            salary: app.Job?.stipend ?? app.Job?.salary ?? 0,
            appliedDate: app.createdAt,
            updatedAt: app.updatedAt,
            status: normalized,
            rawStatus: app.status || 'Applied',
            statusHistory: Array.isArray(app.statusHistory) ? app.statusHistory : [],
            logo: company?.logo || '',
            companyInitial: (company?.companyName || 'C').charAt(0).toUpperCase(),
            jobType: app.Job?.type || 'Internship',
            workMode: app.Job?.workMode || 'Office',
            interviewDate: app.interviewDate || null,
            interviewTime: app.interviewTime || null,
            interviewMessage: app.interviewMessage || null,
            rejectionReason: app.rejectionReason || '',
          };
        });
        setApplications(formattedData);
      }
    } catch (error) {
      // Silently handle profile incomplete errors
      if (error?.response?.data?.code === 'PROFILE_INCOMPLETE') {
        setApplications([]);
        if (!isSilent) setLoading(false);
        return;
      }
      console.error('Error fetching applications:', error);
      const message = error.response?.data?.message || 'Failed to load applications.';
      setError(message);
      toast.error(message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchApplications(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => fetchApplications(true), 5000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [fetchApplications]);

  const handleWithdraw = async (applicationId) => {
    try {
      setWithdrawingId(applicationId);
      const res = await api.delete(`/applications/${applicationId}`);

      if (res.data.success) {
        toast.success('✓ Application withdrawn successfully. The company has been notified.');
        setApplications(prev => prev.filter(app => app.id !== applicationId));
        setConfirmWithdraw(null);
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      const message = error.response?.data?.message || 'Failed to withdraw application';
      toast.error(message);
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'default', label: 'Pending' },
      shortlisted: { variant: 'warning', label: 'Shortlisted' },
      rejected: { variant: 'danger', label: 'Rejected' },
      accepted: { variant: 'success', label: 'Accepted' },
      hired: { variant: 'success', label: 'Hired' },
      offered: { variant: 'default', label: 'Offered', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
      interview: { variant: 'default', label: 'Interview', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
    };
    const v = variants[status] || variants.pending;
    return <Badge variant={v.variant} className={v.className}>{v.label}</Badge>;
  };

  const formatExactDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    accepted: applications.filter(a => a.status === 'accepted' || a.status === 'hired').length,
    offered: applications.filter(a => a.status === 'offered').length,
    interview: applications.filter(a => a.status === 'interview').length,
  };

  // Parse the interviewMessage stored as structured text:
  // "Mode: Online\nMeeting Link: https://...\nAdditional notes"
  const parseInterviewMessage = (msg) => {
    if (!msg) return { mode: null, link: null, extra: '' };
    const lines = String(msg).split('\n');
    let mode = null, link = null;
    const extraLines = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const modeMatch = trimmed.match(/^mode\s*:\s*(.+)$/i);
      const meetingMatch = trimmed.match(/^meeting\s*link\s*:\s*(.+)$/i);
      const locationMatch = trimmed.match(/^location\s*(?:\(maps\))?\s*:\s*(.+)$/i);
      if (modeMatch) mode = modeMatch[1].trim();
      else if (meetingMatch) link = meetingMatch[1].trim();
      else if (locationMatch) link = locationMatch[1].trim();
      else extraLines.push(trimmed);
    });
    return { mode, link, extra: extraLines.join(' ') };
  };

  const formatInterviewDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };


  return (
    <>
    <StudentLayout user={user}>
      <div className="space-y-3 sm:space-y-4 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Applications</h1>
          <p className="mt-0.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4">Track and manage your internship applications</p>
          {error && (
            <p className="text-sm text-red-600 mb-4">
              {error}
            </p>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-white rounded-lg p-4 border border-slate-200 dark:border-slate-200 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Total</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-white rounded-lg p-4 border border-slate-200 dark:border-slate-200 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Pending</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-blue-600">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-white rounded-lg p-4 border border-slate-200 dark:border-slate-200 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Shortlisted</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-amber-600">{stats.shortlisted}</p>
            </div>
            <div className="bg-white dark:bg-white rounded-lg p-4 border border-slate-200 dark:border-slate-200 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-teal-700">Interview</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-teal-700">{stats.interview}</p>
            </div>
            <div className="bg-white dark:bg-white rounded-lg p-4 border border-slate-200 dark:border-slate-200 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Offered/Hired</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="bg-white dark:bg-white rounded-lg p-4 border border-slate-200 dark:border-slate-200 shadow-sm">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Rejected</p>
              <p className="mt-1 text-lg sm:text-xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>

        </div>

        <div className="min-w-0">

          {/* Main Content - Application Cards */}
          <div className="min-w-0 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 text-sm">Loading applications...</p>
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-gray-800 shadow-sm">
                <EmptyState
                  icon={FileText}
                  title="No applications yet"
                  description="Start applying to internships and track your applications here."
                  actionLabel="Browse Internships"
                  onAction={() => navigate('/student/browse-jobs')}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {applications.map((app) => {
                  const interview = parseInterviewMessage(app.interviewMessage);
                  const hasInterviewDetails = !!(app.interviewDate || app.interviewTime || app.interviewMessage || interview.link || interview.mode);
                  const isInterview = app.status === 'interview';
                  return (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-gray-800 flex flex-col rounded-xl shadow-sm hover:shadow-md transition-shadow min-w-0 overflow-hidden"
                    >
                      {/* Interview Alert Banner */}
                      {hasInterviewDetails && (
                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border-b border-teal-200 dark:border-teal-800 px-4 sm:px-5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-800">
                              {interview.mode === 'Online' ? <Video size={13} className="text-teal-600 dark:text-teal-300" /> : <Navigation size={13} className="text-teal-600 dark:text-teal-300" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">{isInterview ? '📅 Interview Scheduled' : '📅 Interview Details'}</p>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {app.interviewDate ? formatInterviewDate(app.interviewDate).split(',')[0] : 'Date TBD'}
                                {app.interviewTime ? ` · ${app.interviewTime}` : ''}
                                {interview.mode ? ` · ${interview.mode}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            {interview.link && (
                              <a
                                href={interview.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 rounded-md bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors shrink-0"
                              >
                                <ExternalLink size={11} />
                                {interview.mode === 'Online' ? 'Join' : 'Location'}
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-between">
                        <div className="flex items-start gap-3 mb-2 min-w-0">
                          <div className="shrink-0">
                            {app.logo ? (
                              <img
                                src={toAssetUrl(app.logo)}
                                alt="Company Logo"
                                className="h-10 w-10 object-cover rounded-full border border-gray-300 dark:border-gray-700"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                {app.companyInitial}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-slate-900 dark:text-white text-base sm:text-lg line-clamp-2 break-all" title={app.jobTitle}>{app.jobTitle}</h3>
                            <div className="mt-2 flex items-center gap-2">
                              {getStatusBadge(app.status)}
                              <span className="text-xs text-slate-500 dark:text-slate-400">Real: {app.rawStatus || 'Applied'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-200 text-xs">{app.jobType}</Badge>
                        </div>
                        <div className="text-gray-900 dark:text-white space-y-2 text-sm mt-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                            <span className="truncate">{app.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>Applied {formatExactDateTime(app.appliedDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>{app.jobType}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200">{app.workMode}</span>
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200">{app.salary ? `Rs ${Number(app.salary).toLocaleString()}/month` : 'Unpaid'}</span>
                        </div>
                        {/* Extra interview notes */}
                        {isInterview && interview.extra && (
                          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">💬 {interview.extra}</p>
                        )}
                        {app.status === 'rejected' && app.rejectionReason && (
                          <div className="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                              Reason from company
                            </p>
                            <p className="mt-1 text-xs text-red-700 dark:text-red-200 leading-relaxed">
                              {app.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className={`grid ${app.status === 'pending' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 pt-3 mt-2 border-t border-gray-200 dark:border-gray-800`}>
                          <button
                            onClick={() => app.jobId && navigate(`/student/job/${app.jobId}`, { state: { from: '/student/applications' } })}
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 py-2 text-xs font-semibold transition-colors"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors border ${
                              (app.status === 'accepted' || app.status === 'hired')
                                ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : app.status === 'offered'
                                ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                                : app.status === 'rejected'
                                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : app.status === 'interview'
                                ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                                : app.status === 'shortlisted'
                                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            <AlertCircle size={14} />
                            Status
                          </button>
                          
                          {/* Withdraw Button - Only for pending applications */}
                          {app.status === 'pending' && (
                            <button
                              onClick={() => setConfirmWithdraw(app)}
                              disabled={withdrawingId === app.id}
                              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-300 dark:border-red-600 bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {withdrawingId === app.id ? (
                                <Loader size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Withdraw
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>

      {/* Status Modal */}
      {selectedApp && <StatusModal app={selectedApp} user={user} onClose={() => setSelectedApp(null)} parseInterviewMessage={parseInterviewMessage} formatInterviewDate={formatInterviewDate} formatExactDateTime={formatExactDateTime} />}

      {/* Withdraw Confirmation Dialog */}
      {confirmWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-300">Withdraw Application</h3>
                  <p className="text-sm text-red-700 dark:text-red-400">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-5">
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Are you sure you want to withdraw your application for <span className="font-semibold text-slate-900 dark:text-white">{confirmWithdraw.jobTitle}</span> at <span className="font-semibold text-slate-900 dark:text-white">{confirmWithdraw.company}</span>?
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ You will need to re-apply if you change your mind later.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setConfirmWithdraw(null)}
                disabled={withdrawingId === confirmWithdraw.id}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdraw(confirmWithdraw.id)}
                disabled={withdrawingId === confirmWithdraw.id}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {withdrawingId === confirmWithdraw.id ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Withdraw Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ── Status Modal Component ── */
const StatusModal = ({ app, user, onClose, parseInterviewMessage, formatInterviewDate, formatExactDateTime }) => {
  const interview = parseInterviewMessage(app.interviewMessage);
  const isInterview = app.status === 'interview';
  const hasInterviewDetails =
    !!(app.interviewDate || app.interviewTime || app.interviewMessage || interview.link || interview.mode);
  const statusHistory = Array.isArray(app.statusHistory) ? [...app.statusHistory] : [];
  const sortedHistory = statusHistory.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0));

  const formatDateTime = (value) => {
    if (!value) return 'Unknown time';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const statusConfig = {
    accepted:    { label: 'Accepted 🎉',         color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-300 dark:border-green-700',  Icon: CheckCircle, iconColor: 'text-green-600' },
    hired:       { label: 'Hired 🎉',            color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-300 dark:border-green-700',  Icon: CheckCircle, iconColor: 'text-green-600' },
    offered:     { label: 'Offer Received',      color: 'text-teal-700 dark:text-teal-400',   bg: 'bg-teal-50 dark:bg-teal-900/30',    border: 'border-teal-300 dark:border-teal-700',    Icon: CheckCircle, iconColor: 'text-teal-600' },
    rejected:    { label: 'Not Selected',        color: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/30',      border: 'border-red-300 dark:border-red-700',      Icon: XCircle,     iconColor: 'text-red-600' },
    interview:   { label: 'Interview Scheduled', color: 'text-teal-700 dark:text-teal-400',   bg: 'bg-teal-50 dark:bg-teal-900/30',    border: 'border-teal-300 dark:border-teal-700',    Icon: Video,       iconColor: 'text-teal-600' },
    shortlisted: { label: 'Shortlisted ⭐',      color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30',  border: 'border-amber-300 dark:border-amber-700',  Icon: CheckCircle, iconColor: 'text-amber-600' },
    pending:     { label: 'Under Review',        color: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30',    border: 'border-blue-300 dark:border-blue-700',    Icon: Loader,      iconColor: 'text-blue-600' },
  };
  const sc = statusConfig[app.status] || statusConfig.pending;
  const { Icon } = sc;

  const statusDesc = {
    pending:     'Your application is being reviewed by the company.',
    shortlisted: 'Great news! You have been shortlisted. Wait for the next steps.',
    interview:   'You have been invited to an interview. See the details below.',
    offered:     'You received an offer update from the company.',
    accepted:    'Congratulations! Your application has been accepted.',
    hired:       'Congratulations! You have been hired by the company.',
    rejected:    'Unfortunately you were not selected for this position.',
  };
  const hasRejectionReason = app.status === 'rejected' && String(app.rejectionReason || '').trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">{app.jobTitle}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {app.company} &middot; Applied {formatExactDateTime(app.appliedDate)}
            </p>
            {app.updatedAt && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                Last updated {formatExactDateTime(app.updatedAt)}
              </p>
            )}
            {/* Open to Work Badge */}
            {user?.StudentProfile?.openToWork && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                <Briefcase size={12} className="text-green-600 dark:text-green-400" />
                <span className="text-[11px] font-semibold text-green-700 dark:text-green-400">Open to Work</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Status banner */}
          <div className={`flex items-start gap-3 rounded-xl border ${sc.border} ${sc.bg} px-4 py-3.5`}>
            <Icon size={22} className={`${sc.iconColor} shrink-0 mt-0.5`} />
            <div>
              <p className={`text-sm font-bold ${sc.color}`}>{sc.label}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Current status: <span className="font-semibold">{app.rawStatus || 'Applied'}</span>
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Display status: <span className="font-semibold">{sc.label.replace(' 🎉', '').replace(' ⭐', '')}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {statusDesc[app.status] || statusDesc.pending}
              </p>
            </div>
          </div>

          {hasRejectionReason && (
            <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
                Rejection Reason
              </p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-200 leading-relaxed">
                {app.rejectionReason}
              </p>
            </div>
          )}

          {/* Status history timeline */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Status History
            </p>
            {sortedHistory.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                No status history recorded yet in database.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
                {sortedHistory.map((item, idx) => (
                  <div key={`${item.changedAt || 'no-date'}-${item.status || 'status'}-${idx}`} className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.label || item.status || 'Status updated'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(item.changedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interview details — keep visible even after status changes (e.g. Hired) */}
          {hasInterviewDetails && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {isInterview ? '📅 Interview Details' : '📅 Interview Details (Previous)'}
              </p>

              {/* Primary CTA button - Show at top for better visibility */}
              {interview.link && (
                <a
                  href={interview.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg ${
                    interview.mode === 'Online'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                  }`}
                >
                  {interview.mode === 'Online' ? (
                    <>
                      <Video size={18} />
                      Join Google Meet / Video Call
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      Open in Google Maps
                    </>
                  )}
                </a>
              )}

              {/* Detail rows */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                {app.interviewDate && (
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-900/10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                      <Calendar size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Interview Date</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatInterviewDate(app.interviewDate)}
                      </p>
                    </div>
                  </div>
                )}
                {app.interviewTime && (
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Interview Time</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{app.interviewTime}</p>
                    </div>
                  </div>
                )}
                {interview.mode && (
                  <div className={`flex items-center gap-3 px-4 py-3.5 ${
                    interview.mode === 'Online'
                      ? 'bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10'
                      : 'bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/10'
                  }`}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      interview.mode === 'Online'
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {interview.mode === 'Online'
                        ? <Video size={16} className="text-purple-600 dark:text-purple-400" />
                        : <Navigation size={16} className="text-orange-600 dark:text-orange-400" />}
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Interview Mode</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{interview.mode}</p>
                    </div>
                  </div>
                )}
                {interview.link && (
                  <div className="flex items-start gap-3 px-4 py-3.5 bg-gradient-to-r from-teal-50/50 to-transparent dark:from-teal-900/10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 shrink-0">
                      <ExternalLink size={16} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                        {interview.mode === 'Online' ? '🔗 Meeting Link' : '📍 Office Location'}
                      </p>
                      <a
                        href={interview.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 break-all underline"
                      >
                        {interview.link}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional message from company */}
              {interview.extra && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3.5">
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wide font-semibold mb-1.5">💬 Message from Company</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{interview.extra}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
