import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Eye,
  Trash2,
  Shield,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  X,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Github,
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchWithHistory } from '../../components/ui/SearchWithHistory';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

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

const renderExternalLink = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return <p className="font-semibold text-gray-900 dark:text-white">N/A</p>;
  return (
    <a
      href={toExternalHref(raw)}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all"
    >
      {raw}
    </a>
  );
};

const renderSocialLinks = (profile) => {
  const items = [
    { key: 'website', label: 'Website', icon: Globe, value: profile?.website },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, value: profile?.linkedin },
    { key: 'twitter', label: 'Twitter', icon: Twitter, value: profile?.twitter },
    { key: 'facebook', label: 'Facebook', icon: Facebook, value: profile?.facebook },
    { key: 'instagram', label: 'Instagram', icon: Instagram, value: profile?.instagram },
    { key: 'github', label: 'GitHub', icon: Github, value: profile?.github },
  ].filter((item) => String(item.value || '').trim());

  if (items.length === 0) {
    return <p className="font-semibold text-gray-900 dark:text-white">No social links</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <a
          key={item.key}
          href={toExternalHref(item.value)}
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

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const roleBadgeClass = (role) => {
  if (role === 'student') return 'bg-green-100 text-green-700';
  if (role === 'company') return 'bg-purple-100 text-purple-700';
  if (role === 'admin') return 'bg-blue-100 text-blue-700';
  return 'bg-yellow-100 text-yellow-700';
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [viewData, setViewData] = useState(null);
  const [viewLoadingId, setViewLoadingId] = useState('');
  const [assetLoadErrors, setAssetLoadErrors] = useState({});
  const [statusConfirm, setStatusConfirm] = useState({ open: false, user: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => key && value !== '')),
      });

      const res = await axios.get(`http://localhost:6060/api/superadmin/users?${params}`, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setUsers(res.data.data.users);
        setPagination((prev) => ({ ...prev, ...res.data.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserById = async (id) => {
    const res = await axios.get(`http://localhost:6060/api/superadmin/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  };

  const closeViewModal = () => {
    setViewData(null);
    setAssetLoadErrors({});
  };

  const markAssetBroken = (key) => {
    setAssetLoadErrors((prev) => ({ ...prev, [key]: true }));
  };

  const handleViewUser = async (userId) => {
    setViewLoadingId(userId);
    try {
      const data = await fetchUserById(userId);
      setAssetLoadErrors({});
      setViewData(data || null);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setViewLoadingId('');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await axios.delete(`http://localhost:6060/api/superadmin/users/${userId}`, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        toast.success('User deleted successfully.');
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (user) => {
    if (!user) return;
    const nextStatus = !(user.isActive !== false);

    setStatusUpdatingId(user.id);
    try {
      const res = await axios.put(
        `http://localhost:6060/api/superadmin/users/${user.id}`,
        { isActive: nextStatus },
        { headers: getAuthHeaders() }
      );

      if (res.data.success) {
        toast.success(`User account ${nextStatus ? 'activated' : 'deactivated'}.`);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update account status:', error);
      toast.error(error.response?.data?.message || 'Failed to update account status');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const openStatusConfirm = (user) => {
    setStatusConfirm({ open: true, user });
  };

  const closeStatusConfirm = () => {
    setStatusConfirm({ open: false, user: null });
  };

  const openDeleteConfirm = (userId) => {
    setDeleteConfirm({ open: true, userId });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, userId: null });
  };

  const confirmIsActive = statusConfirm.user?.isActive !== false;

  const detailUser = viewData?.user || null;
  const detailStats = viewData?.stats || {};
  const studentProfile = detailUser?.studentProfile || null;
  const companyProfile = detailUser?.companyProfile || null;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={statusConfirm.open}
        onClose={closeStatusConfirm}
        onConfirm={() => handleToggleActive(statusConfirm.user)}
        title={`Set ${confirmIsActive ? 'Inactive' : 'Active'}?`}
        message={`Are you sure you want to ${confirmIsActive ? 'deactivate' : 'activate'} this user account?`}
        confirmLabel={confirmIsActive ? 'Set Inactive' : 'Set Active'}
        cancelLabel="Cancel"
        variant={confirmIsActive ? 'danger' : 'default'}
      />
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={closeDeleteConfirm}
        onConfirm={() => handleDeleteUser(deleteConfirm.userId)}
        title="Delete User?"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
          <SearchWithHistory
            historyKey="superadmin-manage-users"
            placeholder="Search users..."
            value={filters.search}
            onChange={(val) => setFilters({ ...filters, search: val })}
          />
          </div>
          <select
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => setFilters({ role: '', search: '' })}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-all"
          >
            Clear Filters
          </button>
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
              {users.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No users found.</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{user.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email || 'N/A'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone || '—'}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-bold ${roleBadgeClass(user.role)}`}>{user.role}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {user.role === 'student' && (user.studentProfile?.university || user.studentProfile?.major) && (
                        <p>{[user.studentProfile?.university, user.studentProfile?.major].filter(Boolean).join(' · ')}</p>
                      )}
                      {user.role === 'company' && (user.companyProfile?.companyName || user.companyProfile?.industry) && (
                        <p>{[user.companyProfile?.companyName, user.companyProfile?.industry].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                    {user.role !== 'superadmin' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => openStatusConfirm(user)}
                          disabled={statusUpdatingId === user.id}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50"
                        >
                          {statusUpdatingId === user.id ? 'Updating...' : user.isActive !== false ? 'Set Inactive' : 'Set Active'}
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <button onClick={() => handleViewUser(user.id)} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium" disabled={viewLoadingId === user.id}>
                        <Eye size={16} /> {viewLoadingId === user.id ? 'Loading...' : 'View'}
                      </button>
                      {user.role !== 'superadmin' && (
                        <button onClick={() => openDeleteConfirm(user.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                          <Trash2 size={16} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profile Info</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{user.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {user.role === 'student' ? (
                          <div>
                            <p>{user.studentProfile?.university || 'N/A'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.studentProfile?.major || 'N/A'}</p>
                          </div>
                        ) : user.role === 'company' ? (
                          <div>
                            <p>{user.companyProfile?.companyName || 'N/A'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.companyProfile?.industry || 'N/A'}</p>
                          </div>
                        ) : (
                          <span>N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'superadmin' ? (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Shield size={16} />
                            <span className="text-xs font-medium">Protected</span>
                          </span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <span
                              className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-bold ${
                                user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {user.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => openStatusConfirm(user)}
                              disabled={statusUpdatingId === user.id}
                              className={`inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                                user.isActive !== false
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              } disabled:opacity-60`}
                            >
                              {user.isActive !== false ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                              {statusUpdatingId === user.id ? 'Updating...' : user.isActive !== false ? 'Set Inactive' : 'Set Active'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-all text-blue-600"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {user.role !== 'superadmin' && (
                            <button
                              onClick={() => openDeleteConfirm(user.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-all text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {viewLoadingId === user.id && <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-3 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {pagination.total > 0
                  ? `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} users`
                  : 'Showing 0 users'}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Page {pagination.page} of {pagination.pages || 1}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages || pagination.pages === 0}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {viewData && (
        <div className="fixed inset-0 z-[70] bg-black/50 p-2 sm:p-4 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-5xl my-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate pr-8">User Details</h2>
              <button onClick={closeViewModal} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">User Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500 dark:text-gray-400">Name</p><p className="font-semibold text-gray-900 dark:text-white">{detailUser?.name || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Email</p><p className="font-semibold text-gray-900 dark:text-white">{detailUser?.email || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Phone</p><p className="font-semibold text-gray-900 dark:text-white">{detailUser?.phone || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Role</p><p className="font-semibold text-gray-900 dark:text-white">{detailUser?.role || 'N/A'}</p></div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Login Status</p>
                    <p className={`font-semibold ${detailUser?.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                      {detailUser?.isActive !== false ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div><p className="text-gray-500 dark:text-gray-400">Created At</p><p className="font-semibold text-gray-900 dark:text-white">{formatDateTime(detailUser?.createdAt)}</p></div>
                </div>
              </div>

              {detailUser?.role === 'student' && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Student Profile (Profile Settings)</h3>
                  {studentProfile ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-500 dark:text-gray-400">University</p><p className="font-semibold text-gray-900 dark:text-white">{studentProfile.university || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Major</p><p className="font-semibold text-gray-900 dark:text-white">{studentProfile.major || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Graduation Year</p><p className="font-semibold text-gray-900 dark:text-white">{studentProfile.graduationYear || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Open To Work</p><p className="font-semibold text-gray-900 dark:text-white">{studentProfile.openToWork ? 'Yes' : 'No'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Skills</p><p className="font-semibold text-gray-900 dark:text-white">{Array.isArray(studentProfile.skills) && studentProfile.skills.length > 0 ? studentProfile.skills.join(', ') : 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Resume URL</p>{renderExternalLink(studentProfile.resumeUrl)}</div>
                        <div><p className="text-gray-500 dark:text-gray-400">GitHub</p>{renderExternalLink(studentProfile.github)}</div>
                        <div><p className="text-gray-500 dark:text-gray-400">LinkedIn</p>{renderExternalLink(studentProfile.linkedin)}</div>
                        <div><p className="text-gray-500 dark:text-gray-400">Portfolio</p>{renderExternalLink(studentProfile.portfolio)}</div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Avatar</p>
                          {studentProfile.avatar ? (
                            <div className="mt-1 space-y-2">
                              {!assetLoadErrors.userStudentAvatar ? (
                                <img
                                  src={toPublicAssetUrl(studentProfile.avatar)}
                                  alt="Student avatar"
                                  onError={() => markAssetBroken('userStudentAvatar')}
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
                          {studentProfile.banner ? (
                            <div className="mt-1 space-y-2">
                              {!assetLoadErrors.userStudentBanner ? (
                                <img
                                  src={toPublicAssetUrl(studentProfile.banner)}
                                  alt="Student banner"
                                  onError={() => markAssetBroken('userStudentBanner')}
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

                      <div className="mt-4 text-sm">
                        <p className="text-gray-500 dark:text-gray-400">Bio</p>
                        <p className="font-semibold text-gray-900 dark:text-white whitespace-pre-wrap">{studentProfile.bio || 'N/A'}</p>
                      </div>

                      <div className="mt-4 text-sm">
                        <p className="text-gray-500 dark:text-gray-400">Applications</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{detailStats.applicationsCount ?? 0}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">No student profile data found yet.</p>
                  )}
                </div>
              )}

              {detailUser?.role === 'company' && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Company Profile (Profile Settings)</h3>
                  {companyProfile ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-500 dark:text-gray-400">Company Name</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.companyName || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Industry</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.industry || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Location</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.location || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Tagline</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.tagline || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Company Email</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.email || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Company Phone</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.phone || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Website</p>{renderExternalLink(companyProfile.website)}</div>
                        <div><p className="text-gray-500 dark:text-gray-400">Company Size</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.companySize || 'N/A'}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Founded Year</p><p className="font-semibold text-gray-900 dark:text-white">{companyProfile.foundedYear || 'N/A'}</p></div>
                        <div className="sm:col-span-2">
                          <p className="text-gray-500 dark:text-gray-400">Social Media</p>
                          {renderSocialLinks(companyProfile)}
                        </div>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <div className="relative h-40 sm:h-48 bg-gradient-to-r from-blue-600 to-cyan-500">
                          {companyProfile.banner && !assetLoadErrors.userCompanyBanner ? (
                            <img
                              src={toPublicAssetUrl(companyProfile.banner)}
                              alt="Company banner"
                              onError={() => markAssetBroken('userCompanyBanner')}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white/90">
                              {companyProfile.banner ? 'Banner unavailable' : 'No banner uploaded'}
                            </div>
                          )}
                        </div>
                        <div className="px-4 pb-4">
                          <div className="-mt-10 flex items-end gap-3">
                            <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 overflow-hidden shadow">
                              {companyProfile.logo && !assetLoadErrors.userCompanyLogo ? (
                                <img
                                  src={toPublicAssetUrl(companyProfile.logo)}
                                  alt="Company logo"
                                  onError={() => markAssetBroken('userCompanyLogo')}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300">
                                  {(companyProfile.companyName || detailUser?.name || 'C').charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="pb-1">
                              <p className="font-bold text-gray-900 dark:text-white">
                                {companyProfile.companyName || detailUser?.name || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {companyProfile.tagline || companyProfile.industry || 'No tagline yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-sm">
                        <p className="text-gray-500 dark:text-gray-400">Description</p>
                        <p className="font-semibold text-gray-900 dark:text-white whitespace-pre-wrap">{companyProfile.description || 'N/A'}</p>
                      </div>
                      <div className="mt-4 text-sm">
                        <p className="text-gray-500 dark:text-gray-400">About</p>
                        <p className="font-semibold text-gray-900 dark:text-white whitespace-pre-wrap">{companyProfile.about || 'N/A'}</p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-500 dark:text-gray-400">Total Jobs</p><p className="font-semibold text-gray-900 dark:text-white">{detailStats.jobsCount ?? 0}</p></div>
                        <div><p className="text-gray-500 dark:text-gray-400">Active Jobs</p><p className="font-semibold text-gray-900 dark:text-white">{detailStats.activeJobsCount ?? 0}</p></div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">No company profile data found yet.</p>
                  )}
                </div>
              )}

              {detailUser?.role !== 'student' && detailUser?.role !== 'company' && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Profile Settings Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This role does not have Student/Company profile-setting fields.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
