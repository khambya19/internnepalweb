import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Building2,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldOff,
  Save,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Github,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { SearchWithHistory } from '../../components/ui/SearchWithHistory';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const defaultEditForm = {
  name: '',
  email: '',
  phone: '',
  isActive: true,
  companyName: '',
  description: '',
  website: '',
  industry: '',
  location: '',
  tagline: '',
  about: '',
  companySize: '',
  foundedYear: '',
  companyPhone: '',
  companyEmail: '',
  linkedin: '',
  twitter: '',
  facebook: '',
  instagram: '',
  github: '',
  logo: '',
  banner: '',
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

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search, setSearch] = useState('');

  const [viewData, setViewData] = useState(null);
  const [editCompany, setEditCompany] = useState(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [assetLoadErrors, setAssetLoadErrors] = useState({});
  const [statusConfirm, setStatusConfirm] = useState({ open: false, company: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, companyId: null });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
      });

      const res = await axios.get(`http://localhost:6060/api/superadmin/companies?${params}`, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setCompanies(res.data.data.companies);
        setPagination((prev) => ({ ...prev, ...res.data.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.page, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchCompanyById = async (id) => {
    const res = await axios.get(`http://localhost:6060/api/superadmin/companies/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:6060/api/superadmin/companies/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Company deleted successfully.');
      fetchCompanies();
    } catch (error) {
      console.error('Delete company failed:', error);
      toast.error('Failed to delete company');
    }
  };

  const handleView = async (id) => {
    try {
      const data = await fetchCompanyById(id);
      setAssetLoadErrors({});
      setViewData(data || null);
    } catch (error) {
      console.error('Fetch company details failed:', error);
      toast.error('Failed to load company details');
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
      const data = await fetchCompanyById(id);
      const company = data?.company;
      const profile = company?.companyProfile || {};
      if (!company) {
        toast.error('Company not found');
        return;
      }

      setEditCompany(company);
      setEditForm({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        isActive: company.isActive !== false,
        companyName: profile.companyName || '',
        description: profile.description || '',
        website: profile.website || '',
        industry: profile.industry || '',
        location: profile.location || '',
        tagline: profile.tagline || '',
        about: profile.about || '',
        companySize: profile.companySize || '',
        foundedYear: profile.foundedYear || '',
        companyPhone: profile.phone || '',
        companyEmail: profile.email || '',
        linkedin: profile.linkedin || '',
        twitter: profile.twitter || '',
        facebook: profile.facebook || '',
        instagram: profile.instagram || '',
        github: profile.github || '',
        logo: profile.logo || '',
        banner: profile.banner || '',
      });
    } catch (error) {
      console.error('Open edit company failed:', error);
      toast.error('Failed to load company for edit');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editCompany) return;

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      toast.error('Name, email and phone are required');
      return;
    }

    setSavingEdit(true);
    try {
      const valueOrNull = (value) => {
        const normalized = String(value ?? '').trim();
        return normalized ? normalized : null;
      };

      await axios.put(
        `http://localhost:6060/api/superadmin/companies/${editCompany.id}`,
        {
          name: editForm.name.trim(),
          userEmail: editForm.email.trim(),
          userPhone: editForm.phone.trim(),
          isActive: Boolean(editForm.isActive),
          companyName: valueOrNull(editForm.companyName),
          description: valueOrNull(editForm.description),
          website: valueOrNull(editForm.website),
          industry: valueOrNull(editForm.industry),
          location: valueOrNull(editForm.location),
          tagline: valueOrNull(editForm.tagline),
          about: valueOrNull(editForm.about),
          companySize: valueOrNull(editForm.companySize),
          foundedYear: valueOrNull(editForm.foundedYear),
          companyPhone: valueOrNull(editForm.companyPhone),
          companyEmail: valueOrNull(editForm.companyEmail),
          linkedin: valueOrNull(editForm.linkedin),
          twitter: valueOrNull(editForm.twitter),
          facebook: valueOrNull(editForm.facebook),
          instagram: valueOrNull(editForm.instagram),
          github: valueOrNull(editForm.github),
          logo: valueOrNull(editForm.logo),
          banner: valueOrNull(editForm.banner),
        },
        { headers: getAuthHeaders() }
      );

      toast.success('Company updated successfully.');
      setEditCompany(null);
      setEditForm(defaultEditForm);
      fetchCompanies();
    } catch (error) {
      console.error('Save company edit failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to update company');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (company) => {
    if (!company) return;
    const nextStatus = !(company.isActive !== false);

    setStatusUpdatingId(company.id);
    try {
      await axios.put(
        `http://localhost:6060/api/superadmin/companies/${company.id}`,
        { isActive: nextStatus },
        { headers: getAuthHeaders() }
      );

      toast.success(`Company account ${nextStatus ? 'activated' : 'deactivated'}.`);
      fetchCompanies();
    } catch (error) {
      console.error('Toggle company active failed:', error);
      toast.error(error?.response?.data?.message || 'Failed to update account status');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const openStatusConfirm = (company) => {
    setStatusConfirm({ open: true, company });
  };

  const closeStatusConfirm = () => {
    setStatusConfirm({ open: false, company: null });
  };

  const openDeleteConfirm = (companyId) => {
    setDeleteConfirm({ open: true, companyId });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, companyId: null });
  };

  const confirmIsActive = statusConfirm.company?.isActive !== false;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={statusConfirm.open}
        onClose={closeStatusConfirm}
        onConfirm={() => handleToggleActive(statusConfirm.company)}
        title={`Set ${confirmIsActive ? 'Inactive' : 'Active'}?`}
        message={`Are you sure you want to ${confirmIsActive ? 'deactivate' : 'activate'} this company account?`}
        confirmLabel={confirmIsActive ? 'Set Inactive' : 'Set Active'}
        cancelLabel="Cancel"
        variant={confirmIsActive ? 'danger' : 'default'}
      />
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={closeDeleteConfirm}
        onConfirm={() => handleDelete(deleteConfirm.companyId)}
        title="Delete Company?"
        message="Are you sure you want to delete this company? This action cannot be undone."
        confirmLabel="Delete Company"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Companies</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <SearchWithHistory
          historyKey="superadmin-manage-companies"
          placeholder="Search companies..."
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
              {companies.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No company users found.</div>
              ) : (
                companies.map((company) => (
                  <div key={company.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 className="text-purple-500 shrink-0" size={24} />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{company.companyProfile?.companyName || company.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{company.companyProfile?.location || 'N/A'}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${company.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {company.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{company.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{company.email || 'N/A'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{company.companyProfile?.industry || 'N/A'}</p>
                    <button onClick={() => openStatusConfirm(company)} disabled={statusUpdatingId === company.id} className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg disabled:opacity-50 ${company.isActive !== false ? 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                      {statusUpdatingId === company.id ? 'Updating...' : company.isActive !== false ? 'Set Inactive' : 'Set Active'}
                    </button>
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <button onClick={() => handleView(company.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        <Eye size={16} /> View
                      </button>
                      <button onClick={() => handleOpenEdit(company.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => openDeleteConfirm(company.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Industry</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Login</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="text-purple-500" size={24} />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{company.companyProfile?.companyName || company.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{company.companyProfile?.location || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{company.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{company.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{company.companyProfile?.industry || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-bold ${
                              company.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {company.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => openStatusConfirm(company)}
                            disabled={statusUpdatingId === company.id}
                            className={`inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                              company.isActive !== false
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            } disabled:opacity-60`}
                          >
                            {company.isActive !== false ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                            {statusUpdatingId === company.id ? 'Updating...' : company.isActive !== false ? 'Set Inactive' : 'Set Active'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleView(company.id)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleOpenEdit(company.id)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => openDeleteConfirm(company.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No company users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-3 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {pagination.total > 0
                  ? `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} companies`
                  : 'Showing 0 companies'}
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Company Details</h2>
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
                  <div><p className="text-gray-500 dark:text-gray-400">User Name</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.name || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">User Email</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.email || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">User Phone</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.phone || 'N/A'}</p></div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Login Status</p>
                    <p className={`font-semibold ${viewData.company?.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                      {viewData.company?.isActive !== false ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Created At</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewData.company?.createdAt ? new Date(viewData.company.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Company Profile Preview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500 dark:text-gray-400">Company Name</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.companyName || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Industry</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.industry || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Location</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.location || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Tagline</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.tagline || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Company Email</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.email || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Company Phone</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.phone || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Website</p>{renderExternalLink(viewData.company?.companyProfile?.website)}</div>
                  <div><p className="text-gray-500 dark:text-gray-400">Company Size</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.companySize || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Founded Year</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.company?.companyProfile?.foundedYear || 'N/A'}</p></div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Social Media</p>
                    {renderSocialLinks(viewData.company?.companyProfile)}
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="relative h-40 sm:h-48 bg-gradient-to-r from-blue-600 to-cyan-500">
                    {viewData.company?.companyProfile?.banner && !assetLoadErrors.companyBanner ? (
                      <img
                        src={toPublicAssetUrl(viewData.company.companyProfile.banner)}
                        alt="Company banner"
                        onError={() => markAssetBroken('companyBanner')}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white/90">
                        {viewData.company?.companyProfile?.banner ? 'Banner unavailable' : 'No banner uploaded'}
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="-mt-10 flex items-end gap-3">
                      <div className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 overflow-hidden shadow">
                        {viewData.company?.companyProfile?.logo && !assetLoadErrors.companyLogo ? (
                          <img
                            src={toPublicAssetUrl(viewData.company.companyProfile.logo)}
                            alt="Company logo"
                            onError={() => markAssetBroken('companyLogo')}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300">
                            {(viewData.company?.companyProfile?.companyName || viewData.company?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {viewData.company?.companyProfile?.companyName || viewData.company?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {viewData.company?.companyProfile?.tagline || viewData.company?.companyProfile?.industry || 'No tagline yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
                  <div><p className="text-gray-500 dark:text-gray-400">Description</p><p className="font-semibold text-gray-900 dark:text-white whitespace-pre-wrap">{viewData.company?.companyProfile?.description || 'N/A'}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">About</p><p className="font-semibold text-gray-900 dark:text-white whitespace-pre-wrap">{viewData.company?.companyProfile?.about || 'N/A'}</p></div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Job Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500 dark:text-gray-400">Total Jobs</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.jobsCount ?? 0}</p></div>
                  <div><p className="text-gray-500 dark:text-gray-400">Active Jobs</p><p className="font-semibold text-gray-900 dark:text-white">{viewData.activeJobsCount ?? 0}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editCompany && (
        <div className="fixed inset-0 z-[70] bg-black/50 p-4 sm:p-6 flex items-center justify-center">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Company</h2>
              <button type="button" onClick={() => setEditCompany(null)} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">User Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">User Name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">User Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">User Phone</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
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
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Company Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Company Name</label>
                    <input
                      value={editForm.companyName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, companyName: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Industry</label>
                    <input
                      value={editForm.industry}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, industry: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Location</label>
                    <input
                      value={editForm.location}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Tagline</label>
                    <input
                      value={editForm.tagline}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, tagline: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Company Email</label>
                    <input
                      type="email"
                      value={editForm.companyEmail}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, companyEmail: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Company Phone</label>
                    <input
                      value={editForm.companyPhone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, companyPhone: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Website</label>
                    <input
                      value={editForm.website}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Company Size</label>
                    <input
                      value={editForm.companySize}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, companySize: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Founded Year</label>
                    <input
                      value={editForm.foundedYear}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, foundedYear: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">LinkedIn</label>
                    <input
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Twitter</label>
                    <input
                      value={editForm.twitter}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, twitter: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Facebook</label>
                    <input
                      value={editForm.facebook}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, facebook: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Instagram</label>
                    <input
                      value={editForm.instagram}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, instagram: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">GitHub</label>
                    <input
                      value={editForm.github}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, github: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Company Logo</label>
                    <div className="rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 p-3">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                          {editForm.logo ? (
                            <img
                              src={toPublicAssetUrl(editForm.logo)}
                              alt="Company logo preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">
                              No logo
                            </div>
                          )}
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                          <Upload size={14} />
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageSelect('logo', e.target.files?.[0])}
                          />
                        </label>
                        {editForm.logo ? (
                          <button
                            type="button"
                            onClick={() => setEditForm((prev) => ({ ...prev, logo: '' }))}
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
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Company Banner</label>
                    <div className="rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 p-3">
                      <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        {editForm.banner ? (
                          <img
                            src={toPublicAssetUrl(editForm.banner)}
                            alt="Company banner preview"
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

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">About</label>
                    <textarea
                      rows={4}
                      value={editForm.about}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, about: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditCompany(null)}
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

export default ManageCompanies;
