import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  GraduationCap,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldOff,
  Save,
  Upload,
  FileText,
  Linkedin,
  Github,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchWithHistory } from '../../components/ui/SearchWithHistory';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const defaultEditForm = {
  name: '',
  email: '',
  phone: '',
  isActive: true,
  university: '',
  major: '',
  graduationYear: '',
  skillsText: '',
  resumeUrl: '',
  github: '',
  linkedin: '',
  portfolio: '',
  bio: '',
  avatar: '',
  banner: '',
  openToWork: false,
};

const ASSET_ORIGIN = 'http://localhost:6060';

const toPublicAssetUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const normalized = raw.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/^\/+/, '');
  if (!normalized) return '';
  return `${ASSET_ORIGIN}/${normalized}`;
};

const toExternalHref = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|mailto:|tel:|data:|blob:)/i.test(raw)) return raw;
  const embeddedHttp = raw.match(/https?:\/\/.+/i);
  if (embeddedHttp) return embeddedHttp[0];
  if (raw.startsWith('//')) return `https:${raw}`;
  return `https://${raw}`;
};

const toDocumentHref = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(raw)) return raw;
  if (raw.startsWith('/') || raw.startsWith('./') || raw.includes('\\')) {
    return toPublicAssetUrl(raw);
  }
  const embeddedHttp = raw.match(/https?:\/\/.+/i);
  if (embeddedHttp) return embeddedHttp[0];
  return `https://${raw}`;
};

const renderLinkIcons = (profile) => {
  const items = [
    { key: 'resumeUrl', label: 'Resume', icon: FileText, value: profile?.resumeUrl, hrefBuilder: toDocumentHref },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, value: profile?.linkedin, hrefBuilder: toExternalHref },
    { key: 'github', label: 'GitHub', icon: Github, value: profile?.github, hrefBuilder: toExternalHref },
    { key: 'portfolio', label: 'Portfolio', icon: Globe, value: profile?.portfolio, hrefBuilder: toExternalHref },
  ].filter((item) => String(item.value || '').trim());

  if (items.length === 0) {
    return <p className="font-semibold text-gray-900 dark:text-white">No links provided</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.hrefBuilder(item.value)}
          target="_blank"
          rel="noopener noreferrer"
          title={item.label}
          aria-label={item.label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
        >
          {React.createElement(item.icon, { size: 16 })}
        </a>
      ))}
    </div>
  );
};

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');

  const [viewData, setViewData] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [assetLoadErrors, setAssetLoadErrors] = useState({});
  const [statusConfirm, setStatusConfirm] = useState({ open: false, student: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, studentId: null });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
      });

      const res = await axios.get(`http://localhost:6060/api/superadmin/students?${params}`, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setStudents(res.data.data.students);
        setPagination((prev) => ({ ...prev, ...res.data.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.page, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const fetchStudentById = async (id) => {
    const res = await axios.get(`http://localhost:6060/api/superadmin/students/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:6060/api/superadmin/students/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Student deleted successfully.');
      fetchStudents();
    } catch (error) {
      console.error('Delete student failed:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleView = async (id) => {
    try {
      const data = await fetchStudentById(id);
      setAssetLoadErrors({});
      setViewData(data || null);
    } catch (error) {
      console.error('Fetch student details failed:', error);
      toast.error('Failed to load student details');
    }
  };

  const markAssetBroken = (key) => {
    setAssetLoadErrors((prev) => ({ ...prev, [key]: true }));
  };

  const readImageAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select an image file.'));
        return;
      }

      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) {
        reject(new Error('Image size must be 5MB or less.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });

  const handleImageSelect = async (field, file) => {
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setEditForm((prev) => ({ ...prev, [field]: String(dataUrl || '') }));
    } catch (error) {
      toast.error(error.message || 'Invalid image file');
    }
  };

  const handleOpenEdit = async (id) => {
    try {
      const data = await fetchStudentById(id);
      const student = data?.student;
      const profile = student?.studentProfile || {};
      if (!student) {
        toast.error('Student not found');
        return;
      }

      setEditStudent(student);
      setEditForm({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        isActive: student.isActive !== false,
        university: profile.university || '',
        major: profile.major || '',
        graduationYear: profile.graduationYear ? String(profile.graduationYear) : '',
        skillsText: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
        resumeUrl: profile.resumeUrl || '',
        github: profile.github || '',
        linkedin: profile.linkedin || '',
        portfolio: profile.portfolio || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        banner: profile.banner || '',
        openToWork: Boolean(profile.openToWork),
      });
    } catch (error) {
      console.error('Open edit student failed:', error);
      toast.error('Failed to load student for edit');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      toast.error('Name, email and phone are required');
      return;
    }

    const graduationYear = editForm.graduationYear.trim();
    if (graduationYear && !/^\d{4}$/.test(graduationYear)) {
      toast.error('Graduation year must be a 4-digit number');
      return;
    }

    const valueOrNull = (value) => {
      const normalized = String(value ?? '').trim();
      return normalized ? normalized : null;
    };

    const normalizeUrlOrNull = (value, label) => {
      const normalized = String(value ?? '').trim();
      if (!normalized) return null;
      if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized;
      if (normalized.startsWith('/') || normalized.startsWith('./') || normalized.includes('\\')) {
        return normalized;
      }
      const embeddedHttp = normalized.match(/https?:\/\/.+/i);
      if (embeddedHttp) return embeddedHttp[0];
      toast.error(`${label} must start with http:// or https://`);
      throw new Error(`${label} validation failed`);
    };

    const parsedSkills = String(editForm.skillsText || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    setSavingEdit(true);
    try {
      await axios.put(
        `http://localhost:6060/api/superadmin/students/${editStudent.id}`,
        {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          isActive: Boolean(editForm.isActive),
          university: valueOrNull(editForm.university),
          major: valueOrNull(editForm.major),
          graduationYear: graduationYear ? Number.parseInt(graduationYear, 10) : null,
          skills: parsedSkills,
          resumeUrl: normalizeUrlOrNull(editForm.resumeUrl, 'Resume URL'),
          github: normalizeUrlOrNull(editForm.github, 'GitHub URL'),
          linkedin: normalizeUrlOrNull(editForm.linkedin, 'LinkedIn URL'),
          portfolio: normalizeUrlOrNull(editForm.portfolio, 'Portfolio URL'),
          bio: valueOrNull(editForm.bio),
          avatar: valueOrNull(editForm.avatar),
          banner: valueOrNull(editForm.banner),
          openToWork: Boolean(editForm.openToWork),
        },
        { headers: getAuthHeaders() }
      );

      toast.success('Student updated successfully.');
      setEditStudent(null);
      setEditForm(defaultEditForm);
      fetchStudents();
    } catch (error) {
      if (String(error?.message || '').includes('validation failed')) {
        return;
      }
      console.error('Save student edit failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to update student');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (student) => {
    if (!student) return;
    const nextStatus = !(student.isActive !== false);

    setStatusUpdatingId(student.id);
    try {
      await axios.put(
        `http://localhost:6060/api/superadmin/students/${student.id}`,
        { isActive: nextStatus },
        { headers: getAuthHeaders() }
      );

      toast.success(`Student account ${nextStatus ? 'activated' : 'deactivated'}.`);
      fetchStudents();
    } catch (error) {
      console.error('Toggle student active failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to update account status');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const openStatusConfirm = (student) => {
    setStatusConfirm({ open: true, student });
  };

  const closeStatusConfirm = () => {
    setStatusConfirm({ open: false, student: null });
  };

  const openDeleteConfirm = (studentId) => {
    setDeleteConfirm({ open: true, studentId });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, studentId: null });
  };

  const confirmIsActive = statusConfirm.student?.isActive !== false;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={statusConfirm.open}
        onClose={closeStatusConfirm}
        onConfirm={() => handleToggleActive(statusConfirm.student)}
        title={`Set ${confirmIsActive ? 'Inactive' : 'Active'}?`}
        message={`Are you sure you want to ${confirmIsActive ? 'deactivate' : 'activate'} this student account?`}
        confirmLabel={confirmIsActive ? 'Set Inactive' : 'Set Active'}
        cancelLabel="Cancel"
        variant={confirmIsActive ? 'danger' : 'default'}
      />
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={closeDeleteConfirm}
        onConfirm={() => handleDelete(deleteConfirm.studentId)}
        title="Delete Student?"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete Student"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Students</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <SearchWithHistory
          historyKey="superadmin-manage-students"
          placeholder="Search students..."
          value={search}
          onChange={setSearch}
        />
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
              {students.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No student users found.</div>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <GraduationCap className="text-green-500 shrink-0" size={24} />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{student.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{student.phone || '—'}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${student.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {student.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{student.studentProfile?.university || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.studentProfile?.major || '—'}</p>
                    <button onClick={() => openStatusConfirm(student)} disabled={statusUpdatingId === student.id} className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 disabled:opacity-50">
                      {statusUpdatingId === student.id ? 'Updating...' : student.isActive !== false ? 'Set Inactive' : 'Set Active'}
                    </button>
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <button onClick={() => handleView(student.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        <Eye size={16} /> View
                      </button>
                      <button onClick={() => handleOpenEdit(student.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => openDeleteConfirm(student.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                        <Trash2 size={16} /> Delete
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">University</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Major</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Login</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="text-green-500" size={24} />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{student.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{student.studentProfile?.graduationYear || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{student.email || 'N/A'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.phone || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{student.studentProfile?.university || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{student.studentProfile?.major || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-bold ${
                              student.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {student.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => openStatusConfirm(student)}
                            disabled={statusUpdatingId === student.id}
                            className={`inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                              student.isActive !== false
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            } disabled:opacity-60`}
                          >
                            {student.isActive !== false ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                            {statusUpdatingId === student.id ? 'Updating...' : student.isActive !== false ? 'Set Inactive' : 'Set Active'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleView(student.id)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleOpenEdit(student.id)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => openDeleteConfirm(student.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No student users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-3 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {pagination.total > 0
                  ? `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} students`
                  : 'Showing 0 students'}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Page {pagination.page} of {pagination.pages || 1}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {viewData && (
        <div className="fixed inset-0 z-[70] bg-black/50 p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Details</h2>
              <button
                onClick={() => {
                  setViewData(null);
                  setAssetLoadErrors({});
                }}
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">User Profile Preview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500 dark:text-gray-400">User Name</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.student?.name || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">User Email</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.student?.email || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">User Phone</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.student?.phone || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Applications</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.applicationsCount ?? 0}</p></div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Login Status</p>
                    <p className={`font-semibold ${viewData.student?.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                      {viewData.student?.isActive !== false ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Created At</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewData.student?.createdAt ? new Date(viewData.student.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Student Profile Preview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500 dark:text-gray-400">University</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.student?.studentProfile?.university || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Major</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.student?.studentProfile?.major || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Graduation Year</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.student?.studentProfile?.graduationYear || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Open To Work</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.student?.studentProfile?.openToWork ? 'Yes' : 'No'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Skills</p><p className="font-semibold text-gray-900 dark:text-white">{Array.isArray(viewData.student?.studentProfile?.skills) && viewData.student.studentProfile.skills.length > 0 ? viewData.student.studentProfile.skills.join(', ') : 'N/A'}</p></div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Profile Links (Resume + Social)</p>
                    {renderLinkIcons(viewData.student?.studentProfile)}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Avatar</p>
                    {viewData.student?.studentProfile?.avatar ? (
                      <div className="mt-1 space-y-2">
                        {!assetLoadErrors.studentAvatar ? (
                          <img
                            src={toPublicAssetUrl(viewData.student.studentProfile.avatar)}
                            alt="Student avatar"
                            onError={() => markAssetBroken('studentAvatar')}
                            className="h-20 w-20 rounded-lg border border-gray-200 dark:border-slate-700 object-cover"
                          />
                        ) : (
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Invalid or unreachable avatar image URL.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-900 dark:text-white">Not uploaded</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Banner</p>
                    {viewData.student?.studentProfile?.banner ? (
                      <div className="mt-1 space-y-2">
                        {!assetLoadErrors.studentBanner ? (
                          <img
                            src={toPublicAssetUrl(viewData.student.studentProfile.banner)}
                            alt="Student banner"
                            onError={() => markAssetBroken('studentBanner')}
                            className="h-20 w-full rounded-lg border border-gray-200 dark:border-slate-700 object-cover"
                          />
                        ) : (
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Invalid or unreachable banner image URL.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold text-gray-900 dark:text-white">Not uploaded</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-500 dark:text-gray-400">Bio</p>
                  <p className="font-semibold text-gray-900 dark:text-white whitespace-pre-wrap">{viewData.student?.studentProfile?.bio || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editStudent && (
        <div className="fixed inset-0 z-[70] bg-black/50 p-4 sm:p-6 flex items-center justify-center">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Student</h2>
              <button type="button" onClick={() => setEditStudent(null)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Graduation Year</label>
                  <input
                    value={editForm.graduationYear}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, graduationYear: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">University</label>
                  <input
                    value={editForm.university}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, university: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Major</label>
                  <input
                    value={editForm.major}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, major: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Skills (comma separated)</label>
                  <input
                    value={editForm.skillsText}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, skillsText: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="React, Node.js, UI/UX"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Resume URL</label>
                  <input
                    value={editForm.resumeUrl}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, resumeUrl: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">LinkedIn</label>
                  <input
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">GitHub</label>
                  <input
                    value={editForm.github}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, github: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Portfolio</label>
                  <input
                    value={editForm.portfolio}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, portfolio: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    placeholder="https://portfolio..."
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Login Active
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={editForm.openToWork}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, openToWork: e.target.checked }))}
                  />
                  Open To Work
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Avatar Image</label>
                  <div className="rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 p-3">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        {editForm.avatar ? (
                          <img
                            src={toPublicAssetUrl(editForm.avatar)}
                            alt="Student avatar preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">
                            No avatar
                          </div>
                        )}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                        <Upload size={14} />
                        Upload Avatar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageSelect('avatar', e.target.files?.[0])}
                        />
                      </label>
                      {editForm.avatar ? (
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, avatar: '' }))}
                          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upload an image file (max 5MB).</p>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Banner Image</label>
                  <div className="rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 p-3">
                    <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      {editForm.banner ? (
                        <img
                          src={toPublicAssetUrl(editForm.banner)}
                          alt="Student banner preview"
                          className="h-24 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                          No banner
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                        <Upload size={14} />
                        Upload Banner
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageSelect('banner', e.target.files?.[0])}
                        />
                      </label>
                      {editForm.banner ? (
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, banner: '' }))}
                          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Upload an image file (max 5MB).</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Bio</label>
                <textarea
                  rows={4}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="rounded-lg border border-gray-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Save size={15} />
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
