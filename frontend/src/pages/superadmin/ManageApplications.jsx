import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  FileText,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Briefcase,
  Clock,
  CalendarDays,
  Video,
  Navigation,
  ExternalLink,
  MapPin,
  DollarSign,
  GraduationCap,
  Award,
  Building2,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchWithHistory } from '../../components/ui/SearchWithHistory';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const formatExactDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatInterviewDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NP', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const parseInterviewMessage = (msg) => {
  if (!msg) return { mode: null, link: null, extra: '' };
  const lines = String(msg).split('\n');
  let mode = null;
  let link = null;
  const extraLines = [];
  lines.forEach((line) => {
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

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobModalLoading, setJobModalLoading] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState({ open: false, applicationId: null });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([key, v]) => key && v !== ''))
      });
      const res = await api.get(`/superadmin/applications?${params}`);
      const data = res?.data;
      if (data?.success && data?.data) {
        setApplications(Array.isArray(data.data.applications) ? data.data.applications : []);
        setPagination(prev => ({ ...prev, ...(data.data.pagination || {}) }));
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdrawApplication = async (id) => {
    try {
      await api.delete(`/superadmin/applications/${id}`);
      toast.success('✓ Applicant withdrawn successfully. The application record has been removed.');
      fetchApplications();
    } catch {
      toast.error('Failed to withdraw applicant');
    }
  };

  const openWithdrawConfirm = (applicationId) => {
    setWithdrawConfirm({ open: true, applicationId });
  };

  const closeWithdrawConfirm = () => {
    setWithdrawConfirm({ open: false, applicationId: null });
  };

  const handleViewApplication = async (app) => {
    try {
      const res = await api.get(`/superadmin/applications/${app.id}`);
      const detail = res?.data?.data?.application || app;
      setSelectedApplication(detail);
    } catch {
      // fallback to row data if detail fetch fails
      setSelectedApplication(app);
      toast.error('Loaded basic details only');
    }
  };

  const handleViewJobFromApplication = async (jobId) => {
    setShowJobModal(true);
    setSelectedJob(null);
    setJobModalLoading(true);
    try {
      const res = await api.get(`/superadmin/jobs/${jobId}`);
      if (res?.data?.success && res?.data?.data?.job) {
        setSelectedJob(res.data.data.job);
      } else {
        toast.error('Job data not found');
        setShowJobModal(false);
      }
    } catch {
      toast.error('Failed to load job details');
      setShowJobModal(false);
    } finally {
      setJobModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={withdrawConfirm.open}
        onClose={closeWithdrawConfirm}
        onConfirm={() => handleWithdrawApplication(withdrawConfirm.applicationId)}
        title="Withdraw Applicant?"
        message="Are you sure you want to withdraw this applicant from this job?"
        confirmLabel="Withdraw"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Applications</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <SearchWithHistory
              historyKey="superadmin-manage-applications"
              placeholder="Search by student name, job title, or company..."
              value={filters.search}
              onChange={(val) => setFilters({ ...filters, search: val })}
            />
          </div>
          <select
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="Applied">Applied</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Offered">Offered</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="lg:hidden p-3 sm:p-4 space-y-3">
              {applications.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No applications found.</div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{app.student?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{app.student?.email || 'N/A'}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                        app.status === 'shortlisted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                        app.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}>{app.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">{app.job?.title || 'N/A'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{app.job?.company?.companyName || 'N/A'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                    <div className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white text-sm">
                      Status: <span className="font-semibold capitalize">{app.status}</span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <button type="button" onClick={() => handleViewApplication(app)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        <Eye size={16} /> View
                      </button>
                      <button type="button" onClick={() => openWithdrawConfirm(app.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                        <Trash2 size={16} /> Withdraw
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Applicant</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Job</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Applied</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{app.student?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{app.student?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="text-pink-500" size={20} />
                          <p className="text-sm text-gray-900 dark:text-white">{app.job?.title || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{app.job?.company?.companyName || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          app.status === 'shortlisted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                          app.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"
                            title="View application"
                            onClick={() => handleViewApplication(app)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openWithdrawConfirm(app.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400"
                            title="Withdraw applicant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>

            <div className="px-3 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {pagination.total > 0
                  ? `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} applications`
                  : 'Showing 0 applications'}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Page {pagination.page} of {pagination.pages || 1}</span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages || pagination.pages === 0}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={() => setSelectedApplication(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full my-4 p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button type="button" className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl" onClick={() => setSelectedApplication(null)} aria-label="Close"><X size={24} /></button>
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white pr-8">Application Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Applicant</h3>
                <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.student?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedApplication.student?.email || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Job & Company</h3>
                <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.job?.title || 'N/A'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedApplication.job?.company?.companyName || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                  selectedApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                  selectedApplication.status === 'shortlisted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                  selectedApplication.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}>{selectedApplication.status}</span>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Applied</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(selectedApplication.createdAt).toLocaleString()}</p>
              </div>
              {selectedApplication.coverLetter && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Cover Letter</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line rounded-lg bg-gray-50 dark:bg-slate-800 p-3">{selectedApplication.coverLetter}</p>
                </div>
              )}
              {Array.isArray(selectedApplication.statusHistory) && selectedApplication.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Status History</h3>
                  <div className="space-y-2">
                    {[...selectedApplication.statusHistory]
                      .sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0))
                      .map((entry, index) => (
                        <div
                          key={`${entry.label || entry.status || 'status'}-${entry.changedAt || 'no-date'}-${index}`}
                          className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-2.5"
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{entry.label || entry.status || 'Status updated'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatExactDateTime(entry.changedAt)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {(() => {
                const interview = parseInterviewMessage(selectedApplication.interviewMessage);
                const hasInterviewDetails =
                  !!(selectedApplication.interviewDate || selectedApplication.interviewTime || selectedApplication.interviewMessage || interview.link || interview.mode);

                if (!hasInterviewDetails) return null;

                return (
                  <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-3">
                    <h3 className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase mb-2">Interview Schedule</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {selectedApplication.interviewDate && (
                        <div className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                          <CalendarDays size={15} className="mt-0.5 text-teal-600 dark:text-teal-400" />
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Interview Date</p>
                            <p className="font-medium">{formatInterviewDate(selectedApplication.interviewDate)}</p>
                          </div>
                        </div>
                      )}
                      {selectedApplication.interviewTime && (
                        <div className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                          <Clock size={15} className="mt-0.5 text-teal-600 dark:text-teal-400" />
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Interview Time</p>
                            <p className="font-medium">{selectedApplication.interviewTime}</p>
                          </div>
                        </div>
                      )}
                      {interview.mode && (
                        <div className="flex items-start gap-2 text-gray-700 dark:text-gray-200">
                          {String(interview.mode).toLowerCase().includes('online') ? (
                            <Video size={15} className="mt-0.5 text-teal-600 dark:text-teal-400" />
                          ) : (
                            <Navigation size={15} className="mt-0.5 text-teal-600 dark:text-teal-400" />
                          )}
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Mode</p>
                            <p className="font-medium">{interview.mode}</p>
                          </div>
                        </div>
                      )}
                      {interview.link && (
                        <div className="sm:col-span-2">
                          <a
                            href={interview.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline break-all text-sm"
                          >
                            <ExternalLink size={14} />
                            {interview.link}
                          </a>
                        </div>
                      )}
                    </div>
                    {interview.extra && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{interview.extra}</p>
                    )}
                  </div>
                );
              })()}

              {selectedApplication.job?.id && (
                <button
                  type="button"
                  onClick={() => handleViewJobFromApplication(selectedApplication.job.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700"
                >
                  <Briefcase size={16} /> View full job
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal — responsive, full data from DB */}
      {showJobModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-hidden"
          onClick={() => { setShowJobModal(false); setSelectedJob(null); }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl my-2 sm:my-6 mx-auto relative max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="sticky top-0 right-0 float-right m-2 sm:m-3 p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 z-10 touch-manipulation"
              onClick={() => { setShowJobModal(false); setSelectedJob(null); }}
              aria-label="Close"
            >
              <X size={22} className="sm:w-6 sm:h-6" />
            </button>

            {jobModalLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[280px] gap-4 p-6 sm:p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-yellow-500 border-t-transparent" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading job details…</p>
              </div>
            ) : selectedJob ? (
              <div className="p-3 sm:p-6 pt-1 sm:pt-2 space-y-5 sm:space-y-6">
                {/* Title & meta */}
                <div className="pr-10 sm:pr-12 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 break-words">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500 dark:text-gray-400">
                    {(selectedJob.category || selectedJob.type) && (
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {selectedJob.category || selectedJob.type || 'Job'}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded font-medium ${selectedJob.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : selectedJob.status === 'closed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>

                {/* Company */}
                {(selectedJob.company || selectedJob.Company) && (
                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <Building2 size={14} /> Company
                    </h3>
                    <p className="font-semibold text-gray-900 dark:text-white break-words">{(selectedJob.company || selectedJob.Company)?.companyName || '—'}</p>
                    {((selectedJob.company || selectedJob.Company)?.User?.email) && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-0.5 break-all">
                        <Mail size={12} className="shrink-0" /> {(selectedJob.company || selectedJob.Company).User.email}
                      </p>
                    )}
                  </div>
                )}

                {/* Quick info pills — responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {(selectedJob.locations?.length > 0 || selectedJob.location) && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 p-2.5 sm:p-3 min-w-0">
                      <MapPin size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">Location</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-words" title={Array.isArray(selectedJob.locations) ? selectedJob.locations.join(', ') : selectedJob.location}>
                          {Array.isArray(selectedJob.locations) && selectedJob.locations.length > 0 ? selectedJob.locations.join(', ') : selectedJob.location || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                  {(selectedJob.workMode || selectedJob.type) && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 p-2.5 sm:p-3 min-w-0">
                      <Briefcase size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">Work mode</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{selectedJob.workMode || selectedJob.type || '—'}</p>
                      </div>
                    </div>
                  )}
                  {(selectedJob.duration != null || selectedJob.openings != null) && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 p-2.5 sm:p-3 min-w-0">
                      <Clock size={16} className="text-violet-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">Duration / Openings</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                          {selectedJob.duration != null ? `${selectedJob.duration} mo` : '—'}
                          {selectedJob.openings != null ? ` · ${selectedJob.openings} opening(s)` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                  {(selectedJob.stipend != null || selectedJob.salary || selectedJob.stipendNote) && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 p-2.5 sm:p-3 min-w-0">
                      <DollarSign size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">Compensation</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                          {selectedJob.stipend != null && selectedJob.stipend !== '' && Number(selectedJob.stipend) > 0
                            ? `NPR ${Number(selectedJob.stipend).toLocaleString()}/mo`
                            : selectedJob.salary || selectedJob.stipendNote || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedJob.deadline && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 p-2.5 sm:p-3 min-w-0">
                      <CalendarDays size={16} className="text-rose-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">Deadline</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedJob.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {(selectedJob.minEducation || selectedJob.experienceLevel) && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 p-2.5 sm:p-3 min-w-0">
                      <GraduationCap size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">Education / Experience</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                          {[selectedJob.minEducation, selectedJob.experienceLevel].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <section className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">Description</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words rounded-lg bg-gray-50 dark:bg-slate-800 p-3 sm:p-4 overflow-x-hidden">{selectedJob.description || 'No description provided.'}</p>
                </section>

                {/* Responsibilities */}
                {selectedJob.responsibilities && (
                  <section className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Responsibilities</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words rounded-lg bg-gray-50 dark:bg-slate-800 p-3 sm:p-4 overflow-x-hidden">{selectedJob.responsibilities}</p>
                  </section>
                )}

                {/* Requirements */}
                {selectedJob.requirements && (
                  <section className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words rounded-lg bg-gray-50 dark:bg-slate-800 p-3 sm:p-4 overflow-x-hidden">{selectedJob.requirements}</p>
                  </section>
                )}

                {/* Skills */}
                <section className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Award size={14} /> Required skills</h3>
                  <ul className="flex flex-wrap gap-2">
                    {(selectedJob.skills && selectedJob.skills.length > 0) ? selectedJob.skills.map((skill, idx) => (
                      <li key={idx} className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium break-words">{skill}</li>
                    )) : <li className="text-sm text-gray-500 dark:text-gray-400">No skills listed.</li>}
                  </ul>
                </section>

                {/* Perks */}
                <section className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Perks & benefits</h3>
                  <ul className="flex flex-wrap gap-2">
                    {(selectedJob.perks && selectedJob.perks.length > 0) ? selectedJob.perks.map((perk, idx) => (
                      <li key={idx} className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium break-words">{perk}</li>
                    )) : <li className="text-sm text-gray-500 dark:text-gray-400">No perks listed.</li>}
                  </ul>
                </section>

                {/* Extra meta */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-slate-700 break-words">
                  {selectedJob.startDate && <span>Start: {selectedJob.startDate}</span>}
                  {selectedJob.isPaid != null && <span>Paid: {selectedJob.isPaid ? 'Yes' : 'No'}</span>}
                </div>
              </div>
            ) : !jobModalLoading && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Unable to load job details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;
