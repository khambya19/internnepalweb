import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Flag,
  Trash2,
  CheckCircle,
  Filter,
  Eye,
  Undo2,
  X,
  Building2,
  MapPin,
  CalendarDays,
  Clock3,
  Wallet,
  FileText,
  Briefcase
} from 'lucide-react';
import api from '../../services/api';
import { formatFullDate } from '../../utils/dateUtils';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const REPORT_STATUS_OPTIONS = ['pending', 'reviewed', 'dismissed'];

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const getCompensationText = (job) => {
  if (!job) return 'N/A';
  if (!job.isPaid) return 'Unpaid';
  if (job.stipend != null && job.stipend !== '' && Number(job.stipend) > 0) {
    return `NPR ${Number(job.stipend).toLocaleString()} / month`;
  }
  if (job.salary) return job.salary;
  if (job.stipendNote) return job.stipendNote;
  return 'Paid';
};

const DetailsModal = ({ report, onClose, onChangeStatus, statusUpdating }) => {
  if (!report) return null;

  const job = report.Job;
  const companyName = job?.company?.companyName || 'Unknown Company';
  const skills = toArray(job?.skills);
  const perks = toArray(job?.perks);
  const responsibilities = toArray(job?.responsibilities);
  const requirements = toArray(job?.requirements);
  const locations = toArray(job?.locations);

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/60 p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="mx-auto my-2 sm:my-6 w-full max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 rounded-t-xl border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Reported Job Details</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Job information is read-only in Reports.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Report Reason</p>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">{report.reason?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Reported By</p>
                <p className="font-semibold text-slate-900 dark:text-white">{report.User?.name || 'Unknown User'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Reported On</p>
                <p className="font-semibold text-slate-900 dark:text-white">{formatFullDate(report.createdAt) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Action Status</p>
                <select
                  value={report.status}
                  disabled={statusUpdating}
                  onChange={(e) => onChangeStatus(report.id, e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-white"
                >
                  {REPORT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            {report.description && (
              <div className="mt-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Reporter Note</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{report.description}</p>
              </div>
            )}
          </div>

          {!job ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">The reported job no longer exists in the database.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Briefcase size={14} /> Job Title</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words">{job.title || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Building2 size={14} /> Company</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words">{companyName}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Job Status</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1 capitalize">{job.status || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Type</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1 capitalize">{job.type || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Work Mode</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1 capitalize">{job.workMode || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Category</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{job.category || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin size={14} /> Location</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{job.location || locations.join(', ') || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><CalendarDays size={14} /> Posted On</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{formatFullDate(job.createdAt) || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock3 size={14} /> Deadline</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{formatFullDate(job.deadline) || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Wallet size={14} /> Compensation</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{getCompensationText(job)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Openings</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{job.openings || 1}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <p className="text-slate-500 dark:text-slate-400">Admin Removed</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{job.isRemovedByAdmin ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-x-hidden">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 overflow-x-hidden">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Description</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-all">{job.description || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 overflow-x-hidden">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Skills</p>
                  {skills.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No skills listed</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex max-w-full rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 break-all whitespace-normal"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 overflow-x-hidden">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Responsibilities</p>
                  {responsibilities.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No responsibilities listed</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200 list-disc pl-5">
                      {responsibilities.map((item) => (
                        <li key={item} className="break-all">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 overflow-x-hidden">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Requirements</p>
                  {requirements.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No requirements listed</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200 list-disc pl-5">
                      {requirements.map((item) => (
                        <li key={item} className="break-all">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 lg:col-span-2 overflow-x-hidden">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Perks</p>
                  {perks.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No perks listed</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {perks.map((perk) => (
                        <span
                          key={perk}
                          className="inline-flex max-w-full rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 break-all whitespace-normal"
                        >
                          {perk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [processingActionId, setProcessingActionId] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'danger'
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/superadmin/reports${query}`);

      if (res.data.success) {
        const nextReports = Array.isArray(res.data.data) ? res.data.data : [];
        setReports(nextReports);
        setSelectedReport((prev) => {
          if (!prev) return prev;
          return nextReports.find((item) => item.id === prev.id) || prev;
        });
      }
    } catch {
      toast.error('Failed to load job reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (id, status) => {
    try {
      setStatusUpdatingId(id);
      await api.put(`/superadmin/reports/${id}/status`, { status });
      
      // Show success message with status highlight
      const statusMessages = {
        pending: 'Report status changed to Pending - Awaiting review',
        reviewed: 'Report status changed to Reviewed - Action taken',
        dismissed: 'Report status changed to Dismissed - No action needed'
      };
      
      toast.success(statusMessages[status] || `Report status updated to "${status}"`);
      await fetchReports();
    } catch {
      toast.error('Failed to update report status');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const handleRestoreJob = async (reportId) => {
    try {
      setProcessingActionId(reportId);
      const res = await api.post(`/superadmin/reports/${reportId}/job/restore`);
      toast.success(res?.data?.message || 'Job restored successfully.');
      await fetchReports();
    } catch {
      toast.error('Failed to restore job');
    } finally {
      setProcessingActionId('');
    }
  };

  const handleDeleteJob = async (reportId) => {
    try {
      setProcessingActionId(reportId);
      const res = await api.delete(`/superadmin/reports/${reportId}/job`);
      const successMessage = res?.data?.message || 'Job removed successfully.';
      toast.success(successMessage, {
        action: {
          label: 'Undo',
          onClick: () => handleRestoreJob(reportId)
        }
      });
      await fetchReports();
    } catch {
      toast.error('Failed to remove reported job');
    } finally {
      setProcessingActionId('');
      setConfirmModal((prev) => ({ ...prev, open: false }));
    }
  };

  const openDeleteModal = (report) => {
    setConfirmModal({
      open: true,
      title: 'Remove Reported Job',
      message: `Remove "${report.Job?.title || 'this job'}" from listings? You can undo this after removal.`,
      onConfirm: () => handleDeleteJob(report.id),
      variant: 'danger'
    });
  };

  const renderActionButtons = (report, compact = false) => {
    const isMissingJob = !report.Job;
    const isRemoved = Boolean(report.Job?.isRemovedByAdmin);
    const actionBusy = processingActionId === report.id;

    const buttonBase = compact
      ? 'w-full justify-center'
      : '';

    return (
      <div className={`flex ${compact ? 'flex-col' : 'flex-wrap'} items-center ${compact ? '' : 'justify-end'} gap-2`}>
        <button
          type="button"
          onClick={() => setSelectedReport(report)}
          className={`text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${buttonBase}`}
          title="View job details"
        >
          <Eye size={14} />
          View
        </button>

        {!isMissingJob && !isRemoved && (
          <button
            type="button"
            onClick={() => openDeleteModal(report)}
            className={`text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-60 ${buttonBase}`}
            disabled={actionBusy}
          >
            <Trash2 size={14} />
            Remove Job
          </button>
        )}

        {!isMissingJob && isRemoved && (
          <button
            type="button"
            onClick={() => handleRestoreJob(report.id)}
            className={`text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-60 ${buttonBase}`}
            disabled={actionBusy}
          >
            <Undo2 size={14} />
            Undo
          </button>
        )}

        {isMissingJob && (
          <span className={`inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 ${compact ? 'w-full justify-center' : ''}`}>
            <FileText size={13} />
            No job record
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant={confirmModal.variant}
      />

      <DetailsModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onChangeStatus={handleUpdateStatus}
        statusUpdating={statusUpdatingId === selectedReport?.id}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="text-red-500" />
            Reported Jobs
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">View reported jobs, update report status, and remove/undo from listings.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-gray-800 shadow-sm">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-700 dark:text-gray-300 focus:ring-0 outline-none pr-4"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-gray-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No reports found</h3>
          <p className="text-slate-500 dark:text-gray-400">There are currently no job reports matching your filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="lg:hidden p-3 sm:p-4 space-y-3">
            {reports.map((report) => {
              const isMissingJob = !report.Job;
              const isRemoved = Boolean(report.Job?.isRemovedByAdmin);

              return (
                <div
                  key={report.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-3"
                >
                  <div className="space-y-1">
                    {isMissingJob ? (
                      <p className="text-xs italic text-red-500">Job Deleted</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{report.Job.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 size={13} />
                          {report.Job.company?.companyName || 'Unknown Company'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin size={13} />
                          {report.Job.location || 'Remote'}
                        </p>
                        {isRemoved && (
                          <span className="mt-2 inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 px-2 py-0.5 text-[11px] font-medium">
                            Removed by admin
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 capitalize">
                      {report.reason.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      By: {report.User?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatFullDate(report.createdAt) || 'N/A'}
                    </p>
                    {report.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 break-words">
                        {report.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Action Status</p>
                    <select
                      value={report.status}
                      disabled={statusUpdatingId === report.id}
                      onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-2 text-xs"
                    >
                      {REPORT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {renderActionButtons(report, true)}
                </div>
              );
            })}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm text-slate-600 dark:text-gray-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-gray-300 font-medium">
                <tr>
                  <th className="px-6 py-4">Job Info</th>
                  <th className="px-6 py-4">Report Details</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                {reports.map((report) => {
                  const isMissingJob = !report.Job;
                  const isRemoved = Boolean(report.Job?.isRemovedByAdmin);

                  return (
                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors align-top">
                      <td className="px-6 py-4">
                        {isMissingJob ? (
                          <span className="text-red-500 text-xs italic">Job Deleted</span>
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white break-words">{report.Job.title}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                              <Building2 size={13} />
                              {report.Job.company?.companyName || 'Unknown Company'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                              <MapPin size={13} />
                              {report.Job.location || 'Remote'}
                            </p>
                            {isRemoved && (
                              <span className="mt-2 inline-flex items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 px-2 py-0.5 text-[11px] font-medium">
                                Removed by admin
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-gray-200 capitalize">
                          {report.reason.replace('_', ' ')}
                        </p>
                        {report.User && (
                          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                            By: {report.User.name}
                          </p>
                        )}
                        {report.description && (
                          <p className="text-xs text-slate-600 dark:text-gray-400 mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 max-w-md break-words">
                            {report.description}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {formatFullDate(report.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={report.status}
                          disabled={statusUpdatingId === report.id}
                          onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                          className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1.5 text-xs"
                        >
                          {REPORT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {renderActionButtons(report)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReports;
