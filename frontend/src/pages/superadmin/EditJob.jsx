import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Save,
  ArrowLeft,
  Trash2,
  Briefcase,
  Building2,
  Mail,
  MapPin,
  Users,
  CalendarDays,
  Tag,
  CircleDollarSign,
} from 'lucide-react';
import api from '../../services/api';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const defaultFormData = {
  title: '',
  category: '',
  description: '',
  responsibilities: '',
  requirements: '',
  skillsInput: '',
  perksInput: '',
  minEducation: '',
  experienceLevel: '',
  openings: '1',
  duration: '',
  startDate: '',
  locationsInput: '',
  location: '',
  workMode: '',
  type: 'internship',
  deadline: '',
  isPaid: false,
  stipend: '',
  stipendNote: '',
  salary: '',
  status: 'active',
};

const normalizeToText = (value) => {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join('\n');
  return String(value);
};

const normalizeToCsv = (value) => {
  if (!value) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value);
};

const parseCommaList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toOptionalString = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

const statusChipClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return 'bg-green-600 text-white';
  if (normalized === 'closed') return 'bg-red-600 text-white';
  return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [formData, setFormData] = useState(defaultFormData);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/superadmin/jobs/${id}`);
      const payload = res.data?.data;
      const jobData = payload?.job || payload;
      const appCount = Number(payload?.applicationCount || payload?.applicationsCount || 0);

      if (!jobData) {
        toast.error('Job not found');
        navigate('/superadmin/jobs');
        return;
      }

      setJob(jobData);
      setApplicationCount(appCount);
      setFormData({
        title: jobData.title || '',
        category: jobData.category || '',
        description: normalizeToText(jobData.description),
        responsibilities: normalizeToText(jobData.responsibilities),
        requirements: normalizeToText(jobData.requirements),
        skillsInput: normalizeToCsv(jobData.skills),
        perksInput: normalizeToCsv(jobData.perks),
        minEducation: jobData.minEducation || '',
        experienceLevel: jobData.experienceLevel || '',
        openings: String(jobData.openings ?? 1),
        duration: jobData.duration != null ? String(jobData.duration) : '',
        startDate: jobData.startDate || '',
        locationsInput: normalizeToCsv(jobData.locations),
        location: jobData.location || '',
        workMode: jobData.workMode || '',
        type: jobData.type || 'internship',
        deadline: jobData.deadline || '',
        isPaid: Boolean(jobData.isPaid),
        stipend: jobData.stipend != null ? String(jobData.stipend) : '',
        stipendNote: jobData.stipendNote || '',
        salary: jobData.salary || '',
        status: jobData.status || 'active',
      });
    } catch (error) {
      console.error('Failed to load job details:', error);
      toast.error('Failed to load job details');
      navigate('/superadmin/jobs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Job title and description are required');
      return;
    }

    const openingsNumber = Number(formData.openings || 1);
    if (!Number.isFinite(openingsNumber) || openingsNumber < 1) {
      toast.error('Number of openings must be at least 1');
      return;
    }

    const durationNumber = formData.duration === '' ? null : Number(formData.duration);
    if (durationNumber != null && (!Number.isFinite(durationNumber) || durationNumber < 0)) {
      toast.error('Duration must be a valid non-negative number');
      return;
    }

    const stipendNumber = formData.stipend === '' ? null : Number(formData.stipend);
    if (stipendNumber != null && (!Number.isFinite(stipendNumber) || stipendNumber < 0)) {
      toast.error('Stipend must be a valid non-negative number');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: toOptionalString(formData.category),
      description: formData.description.trim(),
      responsibilities: toOptionalString(formData.responsibilities),
      requirements: toOptionalString(formData.requirements),
      skills: parseCommaList(formData.skillsInput),
      perks: parseCommaList(formData.perksInput),
      minEducation: toOptionalString(formData.minEducation),
      experienceLevel: toOptionalString(formData.experienceLevel),
      openings: openingsNumber,
      duration: durationNumber,
      startDate: toOptionalString(formData.startDate),
      locations: parseCommaList(formData.locationsInput),
      location: toOptionalString(formData.location),
      workMode: toOptionalString(formData.workMode),
      type: formData.type || 'internship',
      deadline: toOptionalString(formData.deadline),
      isPaid: Boolean(formData.isPaid),
      stipend: formData.isPaid ? stipendNumber : null,
      stipendNote: formData.isPaid ? toOptionalString(formData.stipendNote) : null,
      salary: formData.isPaid ? toOptionalString(formData.salary) : null,
      status: formData.status || 'active',
    };

    try {
      setSaving(true);
      await api.put(`/superadmin/jobs/${id}`, payload);
      toast.success('Job updated successfully.');
      navigate('/superadmin/jobs');
    } catch (error) {
      console.error('Failed to update job:', error);
      toast.error(error.response?.data?.message || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/superadmin/jobs/${id}`);
      toast.success('Job deleted successfully.');
      navigate('/superadmin/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
      toast.error('Failed to delete job');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/superadmin/jobs/${id}/status`, { status });
      setFormData((prev) => ({ ...prev, status }));
      toast.success(`Job status updated to "${status}".`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update job status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Job not found.</p>
      </div>
    );
  }

  const company = job.company || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Job?"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmLabel="Delete Job"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/superadmin/jobs')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="text-blue-600" size={24} />
              Edit Job
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All fields are prefilled from database.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 size={16} />
          Delete Job
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Building2 size={14} /> Company</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1 break-words">{company.companyName || 'Unknown company'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Mail size={14} /> Company Email</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1 break-words">{company.User?.email || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin size={14} /> Location</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1 break-words">{job.location || company.location || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users size={14} /> Applications</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">{applicationCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Status</label>
        <div className="flex flex-wrap gap-2">
          {['active', 'closed', 'draft'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                formData.status === status
                  ? statusChipClass(status)
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Basic Information</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work Mode</label>
              <select
                name="workMode"
                value={formData.workMode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              >
                <option value="">Select work mode</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Responsibilities</label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Skills and Requirements</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills (comma-separated)</label>
              <input
                type="text"
                name="skillsInput"
                value={formData.skillsInput}
                onChange={handleChange}
                placeholder="React, Node.js, Figma"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Perks (comma-separated)</label>
              <input
                type="text"
                name="perksInput"
                value={formData.perksInput}
                onChange={handleChange}
                placeholder="Certificate, Mentorship, Flexible hours"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Education</label>
              <input
                type="text"
                name="minEducation"
                value={formData.minEducation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience Level</label>
              <input
                type="text"
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Posting Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Openings</label>
              <input
                type="number"
                name="openings"
                min="1"
                value={formData.openings}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (months)</label>
              <input
                type="number"
                name="duration"
                min="0"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="text"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="Immediately / June 2026"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Locations (comma-separated)</label>
              <input
                type="text"
                name="locationsInput"
                value={formData.locationsInput}
                onChange={handleChange}
                placeholder="Kathmandu, Pokhara, Remote"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CircleDollarSign size={18} className="text-green-600" />
            Compensation
          </h2>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="isPaid"
              checked={formData.isPaid}
              onChange={handleChange}
              className="rounded border-gray-300 dark:border-gray-700"
            />
            This is a paid role
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stipend (NPR)</label>
              <input
                type="number"
                name="stipend"
                min="0"
                value={formData.stipend}
                onChange={handleChange}
                disabled={!formData.isPaid}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Salary Label</label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                disabled={!formData.isPaid}
                placeholder="e.g. 30,000 - 40,000 / month"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compensation Note</label>
              <input
                type="text"
                name="stipendNote"
                value={formData.stipendNote}
                onChange={handleChange}
                disabled={!formData.isPaid}
                placeholder="Any additional note"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/superadmin/jobs')}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditJob;
