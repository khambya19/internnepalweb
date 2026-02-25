import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  MapPin,
  CalendarDays,
  Clock3,
  Users,
  FileText,
  Tag,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchWithHistory } from '../../components/ui/SearchWithHistory';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const normalizeToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'N/A';
  return `NPR ${amount.toLocaleString()}`;
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const statusChipClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (normalized === 'closed') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300';
};

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });

  const [viewData, setViewData] = useState(null);
  const [viewLoadingId, setViewLoadingId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, jobId: null });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([key, v]) => key && v !== '')),
      });

      const res = await axios.get(`http://localhost:6060/api/superadmin/jobs?${params}`, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setJobs(res.data.data.jobs || []);
        setPagination((prev) => ({ ...prev, ...res.data.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const fetchJobById = async (jobId) => {
    const res = await axios.get(`http://localhost:6060/api/superadmin/jobs/${jobId}`, {
      headers: getAuthHeaders(),
    });
    const payload = res.data?.data;
    if (!payload) return null;

    if (payload.job) {
      return {
        job: payload.job,
        applicationCount: Number(payload.applicationCount || 0),
      };
    }

    return {
      job: payload,
      applicationCount: Number(payload.applicationCount || 0),
    };
  };

  const handleView = async (jobId) => {
    setViewLoadingId(jobId);
    try {
      const data = await fetchJobById(jobId);
      setViewData(data);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setViewLoadingId('');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:6060/api/superadmin/jobs/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Job deleted successfully.');
      fetchJobs();
      if (viewData?.job?.id === id) {
        setViewData(null);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      toast.error('Failed to delete job');
    }
  };

  const openDeleteConfirm = (jobId) => {
    setDeleteConfirm({ open: true, jobId });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, jobId: null });
  };

  const handleChangeStatus = async (id, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:6060/api/superadmin/jobs/${id}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      toast.success(`Job status updated to "${newStatus}".`);
      fetchJobs();
      if (viewData?.job?.id === id) {
        setViewData((prev) =>
          prev
            ? {
                ...prev,
                job: {
                  ...prev.job,
                  status: newStatus,
                },
              }
            : prev
        );
      }
    } catch (error) {
      console.error('Failed to update job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const renderActions = (job, compact = false) => {
    const loadingView = viewLoadingId === job.id;
    const base = compact ? 'w-full justify-center' : '';

    return (
      <div className={`flex ${compact ? 'flex-col' : 'flex-wrap'} items-center gap-2`}>
        <button
          type="button"
          onClick={() => handleView(job.id)}
          className={`p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 ${base}`}
          title="View job"
          disabled={loadingView}
        >
          <Eye size={16} />
          {compact && (loadingView ? 'Loading...' : 'View')}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/superadmin/jobs/${job.id}/edit`)}
          className={`p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 ${base}`}
          title="Edit job"
        >
          <Edit size={16} />
          {compact && 'Edit'}
        </button>

        <button
          type="button"
          onClick={() => openDeleteConfirm(job.id)}
          className={`p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 ${base}`}
          title="Delete job"
        >
          <Trash2 size={16} />
          {compact && 'Delete'}
        </button>
      </div>
    );
  };

  const viewJob = viewData?.job || null;
  const viewCompany = viewJob?.company || null;
  const viewSkills = normalizeToArray(viewJob?.skills);
  const viewPerks = normalizeToArray(viewJob?.perks);

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={closeDeleteConfirm}
        onConfirm={() => handleDelete(deleteConfirm.jobId)}
        title="Delete Job?"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmLabel="Delete Job"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Jobs</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SearchWithHistory
              historyKey="superadmin-manage-jobs"
              placeholder="Search jobs..."
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
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <>
            <div className="lg:hidden p-3 space-y-3">
              {jobs.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No jobs found.</div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white break-words">{job.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.company?.companyName || 'Unknown company'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.location || 'Remote'}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusChipClass(job.status)}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                        <p className="text-gray-500 dark:text-gray-400">Posted</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatDate(job.createdAt)}</p>
                      </div>
                      <div className="rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                        <p className="text-gray-500 dark:text-gray-400">Type</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{job.type || 'N/A'}</p>
                      </div>
                    </div>

                    <select
                      value={job.status}
                      onChange={(e) => handleChangeStatus(job.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-md text-xs font-semibold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="draft">Draft</option>
                    </select>

                    {renderActions(job, true)}
                  </div>
                ))
              )}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Job</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Posted</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No jobs found.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Briefcase className="text-orange-500" size={24} />
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{job.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{job.location || 'Remote'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">{job.company?.companyName || 'Unknown company'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{job.company?.User?.email || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={job.status}
                            onChange={(e) => handleChangeStatus(job.id, e.target.value)}
                            className={`px-2 py-1 rounded-full text-xs font-bold border-0 ${statusChipClass(job.status)}`}
                          >
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                            <option value="draft">Draft</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(job.createdAt)}
                        </td>
                        <td className="px-6 py-4">{renderActions(job)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {pagination.total > 0
                  ? `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} jobs`
                  : 'Showing 0 jobs'}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Page {pagination.page} of {pagination.pages || 1}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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

      {viewData && viewJob && (
        <div className="fixed inset-0 z-[120] bg-black/60 p-2 sm:p-4 overflow-y-auto overflow-x-hidden" role="dialog" aria-modal="true">
          <div className="mx-auto my-2 sm:my-6 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 min-w-0 max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 rounded-t-xl z-10 shrink-0">
              <div className="min-w-0 pr-2">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Job Details</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Read-only preview card from database.</p>
              </div>
              <button
                type="button"
                onClick={() => setViewData(null)}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 touch-manipulation shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-sm">
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Tag size={14} /> Status</p>
                  <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusChipClass(viewJob.status)}`}>
                    {viewJob.status || 'N/A'}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users size={14} /> Applications</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{Number(viewData.applicationCount || 0)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><CalendarDays size={14} /> Posted</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{formatDate(viewJob.createdAt)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock3 size={14} /> Deadline</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{formatDate(viewJob.deadline)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white break-words">{viewJob.title || 'Untitled Job'}</h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1 min-w-0"><Building2 size={14} className="shrink-0" /> <span className="break-words">{viewCompany?.companyName || 'Unknown company'}</span></p>
                  <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1 min-w-0"><MapPin size={14} className="shrink-0" /> <span className="break-words">{viewJob.location || 'Remote'}</span></p>
                  <p className="text-gray-600 dark:text-gray-300 break-words">Type: <span className="font-semibold capitalize">{viewJob.type || 'N/A'}</span></p>
                  <p className="text-gray-600 dark:text-gray-300 break-words">Work Mode: <span className="font-semibold capitalize">{viewJob.workMode || 'N/A'}</span></p>
                  <p className="text-gray-600 dark:text-gray-300 break-words">Category: <span className="font-semibold">{viewJob.category || 'N/A'}</span></p>
                  <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Coins size={14} className="shrink-0" />
                    {viewJob.isPaid && viewJob.stipend != null && Number(viewJob.stipend) > 0
                      ? formatMoney(viewJob.stipend)
                      : 'Unpaid'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-hidden">{viewJob.description || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Requirements</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-hidden">{viewJob.requirements || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Responsibilities</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-hidden">{viewJob.responsibilities || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Skills</p>
                  {viewSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewSkills.map((skill) => (
                        <span key={skill} className="inline-flex px-2 py-1 text-xs rounded-full border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 break-words">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-200">N/A</p>
                  )}
                </div>
              </div>

              {viewPerks.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 sm:p-4 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Perks</p>
                  <div className="flex flex-wrap gap-2">
                    {viewPerks.map((perk) => (
                      <span key={perk} className="inline-flex px-2 py-1 text-xs rounded-full border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 break-words">
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-slate-700 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end shrink-0">
              <button
                type="button"
                onClick={() => setViewData(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedId = viewJob.id;
                  setViewData(null);
                  navigate(`/superadmin/jobs/${selectedId}/edit`);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center gap-2"
              >
                <Edit size={15} />
                Edit Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;
