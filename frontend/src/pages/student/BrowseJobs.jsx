import React, { useState, useContext, useEffect } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { AuthContext } from '../../context/authContext';
import { Search, Filter, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SearchWithHistory } from '../../components/ui/SearchWithHistory';
import BackToTop from '../../components/BackToTop';
import { formatFullDate, timeAgo } from '../../utils/dateUtils';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/EmptyState';

const CATEGORY_OPTIONS = [
  'Frontend Development',
  'Backend Development',
  'Full-Stack Development',
  'Mobile App Development',
  'UI/UX Design',
  'Data Science',
  'AI/ML',
  'DevOps',
  'Cybersecurity',
  'QA/Testing',
  'Blockchain',
  'Cloud Computing',
  'Game Development'
];

const EXPERIENCE_OPTIONS = [
  'Entry Level (No experience)',
  'Some Experience (6+ months)',
  'Intermediate (1+ years)'
];

const WORK_MODE_OPTIONS = ['On-site', 'Remote', 'Hybrid'];

const LOCATION_OPTIONS = [
  'Kathmandu',
  'Lalitpur',
  'Bhaktapur',
  'Pokhara',
  'Chitwan',
  'Biratnagar',
  'Butwal',
  'Dharan',
  'Birgunj',
  'Hetauda',
  'Remote'
];

const PERK_OPTIONS = [
  'Certificate',
  'Letter of Recommendation',
  'Pre-Placement Offer (PPO)',
  'Flexible Hours',
  'Meal Allowance',
  'Transport Allowance',
  'Work from Home',
  'Mentorship'
];

const normalize = (value) => String(value || '').trim().toLowerCase();

const toTokens = (value) =>
  normalize(value)
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9+]+/g, ' ')
    .split(' ')
    .filter(Boolean);

const normalizeWorkMode = (value) => {
  const base = normalize(value).replace(/\s+/g, '');
  if (base === 'onsite') return 'on-site';
  if (base === 'wfh' || base === 'workfromhome') return 'remote';
  return normalize(value);
};

const normalizeExperienceLevel = (value) => {
  const base = normalize(value);
  if (!base) return '';
  if (base.includes('entry') || base.includes('no experience') || base.includes('fresher')) {
    return 'entry level (no experience)';
  }
  if (base.includes('6+ months') || base.includes('6 months') || base.includes('some experience')) {
    return 'some experience (6+ months)';
  }
  if (base.includes('intermediate') || base.includes('1+ years') || base.includes('1 years')) {
    return 'intermediate (1+ years)';
  }
  return base;
};

const normalizeLocation = (value) => {
  const base = normalize(value);
  if (base.includes('work from home') || base === 'wfh' || base === 'home') return 'remote';
  return base;
};

const includesAllTokens = (source, target) => {
  const sourceTokens = toTokens(source);
  const targetTokens = toTokens(target);
  if (!sourceTokens.length || !targetTokens.length) return false;
  return targetTokens.every((token) => sourceTokens.includes(token));
};

const BrowseJobs = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    experienceLevels: [],
    workModes: [],
    locations: [],
    paidOnly: false,
    perks: []
  });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [applyCoverLetter, setApplyCoverLetter] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [confirmUnsave, setConfirmUnsave] = useState(null);
  const [showRecentJobs, setShowRecentJobs] = useState(true);
  const { recentJobs, clearRecentJobs } = useRecentlyViewed();

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const scrollY = window.scrollY;
    const originalBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      touchAction: document.body.style.touchAction
    };
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyStyles.overflow;
      document.body.style.position = originalBodyStyles.position;
      document.body.style.top = originalBodyStyles.top;
      document.body.style.left = originalBodyStyles.left;
      document.body.style.right = originalBodyStyles.right;
      document.body.style.width = originalBodyStyles.width;
      document.body.style.touchAction = originalBodyStyles.touchAction;
      window.scrollTo(0, scrollY);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/jobs', { params: { sortBy } });
        if (res.data.success) {
          setJobs(res.data.data.map((job) => ({
            id: job.id,
            title: job.title,
            companyId: job.company?.id || null,
            company: job.company?.companyName || '',
            logo: job.company?.logo || null,
            companyInitial: (job.company?.companyName || 'C').charAt(0).toUpperCase(),
            companyResponseRate: job.company?.responseRate || null,
            // Use locations array (DB field), fall back to location string, then company location
            location: Array.isArray(job.locations) && job.locations.length > 0
              ? job.locations.join(', ')
              : job.location || job.company?.location || '',
            stipend: job.stipend || null,         // real DB stipend amount
            isPaid: job.isPaid,                   // real DB isPaid flag
            category: job.category || null,
            experienceLevel: job.experienceLevel || null,
            workMode: job.workMode || null,
            locations: Array.isArray(job.locations) ? job.locations : [],
            perks: Array.isArray(job.perks) ? job.perks : [],
            type: job.type || null,
            deadline: job.deadline || null,       // real DB deadline
            createdAt: job.createdAt,
            viewCount: Number(job.viewCount ?? job.views ?? 0),
            applicationsCount: job.applicationsCount || 0, // now returned by backend
            applicantCount: Number(job.applicantCount ?? job.applicationsCount ?? 0),
            hiringPaused: job.hiringPaused || false,
          })));
        }
      } catch {
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [sortBy]);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        if (user?.role !== 'student') return;
        const res = await api.get('/student/saved-jobs');
        if (res.data.success) setSavedJobIds(res.data.data.map((item) => item.jobId));
      } catch (err) {
        // Silently handle profile incomplete - expected for new users
        if (err?.response?.data?.code !== 'PROFILE_INCOMPLETE') {
          console.error('Error fetching saved jobs:', err);
        }
      }
    };
    fetchSavedJobs();
  }, [user]);

  useEffect(() => {
    const fetchAppliedIds = async () => {
      try {
        if (user?.role !== 'student') {
          setAppliedJobIds([]);
          return;
        }
        const res = await api.get('/applications/my-applications');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const ids = res.data.data
            .map((a) => a.jobId || a.Job?.id)
            .filter(Boolean);
          setAppliedJobIds(Array.from(new Set(ids)));
        }
      } catch (err) {
        // Silently handle profile incomplete - expected for new users
        if (err?.response?.data?.code !== 'PROFILE_INCOMPLETE') {
          console.error('Error fetching applications:', err);
        }
      }
    };
    fetchAppliedIds();
  }, [user]);

  const normalizeSet = (values) => new Set((values || []).map(normalize).filter(Boolean));

  const selectedCategories = normalizeSet(filters.categories);
  const selectedExperienceLevels = normalizeSet(filters.experienceLevels);
  const selectedWorkModes = normalizeSet(filters.workModes);
  const selectedLocations = normalizeSet(filters.locations);
  const selectedPerks = normalizeSet(filters.perks);

  const toggleFilterValue = (key, value) => {
    setFilters((prev) => {
      const list = prev[key];
      const exists = list.includes(value);
      return {
        ...prev,
        [key]: exists ? list.filter((item) => item !== value) : [...list, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      experienceLevels: [],
      workModes: [],
      locations: [],
      paidOnly: false,
      perks: []
    });
  };

  const activeFilterCount =
    filters.categories.length +
    filters.experienceLevels.length +
    filters.workModes.length +
    filters.locations.length +
    filters.perks.length +
    (filters.paidOnly ? 1 : 0);

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    const jobCategory = normalize(job.category);
    if (
      selectedCategories.size > 0 &&
      !Array.from(selectedCategories).some((selected) =>
        includesAllTokens(jobCategory, selected) || includesAllTokens(selected, jobCategory)
      )
    ) return false;

    const jobExperience = normalizeExperienceLevel(job.experienceLevel);
    if (
      selectedExperienceLevels.size > 0 &&
      !Array.from(selectedExperienceLevels).some((selected) => normalizeExperienceLevel(selected) === jobExperience)
    ) return false;

    const jobWorkMode = normalizeWorkMode(job.workMode);
    if (
      selectedWorkModes.size > 0 &&
      !Array.from(selectedWorkModes).some((selected) => normalizeWorkMode(selected) === jobWorkMode)
    ) return false;

    const jobLocationCandidates = Array.from(new Set([
      ...job.locations,
      ...String(job.location || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    ])).map(normalizeLocation);
    if (
      selectedLocations.size > 0 &&
      !jobLocationCandidates.some((loc) =>
        Array.from(selectedLocations).some((selected) => normalizeLocation(selected) === loc)
      )
    ) return false;

    if (filters.paidOnly && !job.isPaid) return false;

    const jobPerks = (job.perks || []).map(normalize);
    if (
      selectedPerks.size > 0 &&
      !jobPerks.some((perk) =>
        Array.from(selectedPerks).some((selected) =>
          includesAllTokens(perk, selected) || includesAllTokens(selected, perk)
        )
      )
    ) return false;

    return true;
  });

  const openApplyModal = (job) => {
    if (user?.role !== 'student') { toast.error('Please log in as a student to apply'); return; }
    if (appliedJobIds.includes(job.id)) { toast.info('You have already applied for this job.'); return; }
    setApplyModalJob(job);
    setApplyCoverLetter('');
  };

  const closeApplyModal = () => { setApplyModalJob(null); setApplyCoverLetter(''); };

  const handleApplySubmit = async () => {
    if (!applyModalJob) return;
    const jobId = applyModalJob.id;
    try {
      setActionLoading((p) => ({ ...p, [jobId]: true }));
      await api.post(`/applications/${jobId}`, { coverLetter: applyCoverLetter || undefined });
      toast.success('✓ Application submitted successfully! Track your progress in My Applications.');
      setAppliedJobIds((p) => (p.includes(jobId) ? p : [...p, jobId]));
      closeApplyModal();
    } catch (error) {
      const message = error.response?.data?.message || '';
      if (error.response?.status === 400 && message.toLowerCase().includes('already applied')) {
        setAppliedJobIds((p) => (p.includes(jobId) ? p : [...p, jobId]));
        closeApplyModal();
        toast.info('You have already applied for this job.');
      } else {
        toast.error(message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setActionLoading((p) => ({ ...p, [jobId]: false }));
    }
  };

  const handleToggleSave = async (jobId) => {
    if (user?.role !== 'student') { toast.error('Please log in as a student to save jobs'); return; }
    const isSaved = savedJobIds.includes(jobId);
    if (isSaved) { setConfirmUnsave({ jobId }); return; }
    try {
      setActionLoading((p) => ({ ...p, [`save-${jobId}`]: true }));
      await api.post(`/student/saved-jobs/${jobId}`, {});
      setSavedJobIds((p) => [...p, jobId]);
      toast.success('Job saved successfully! You can find it in your Saved Jobs.');
    } catch { toast.error('Failed to save job. Please try again.'); }
    finally { setActionLoading((p) => ({ ...p, [`save-${jobId}`]: false })); }
  };

  const handleConfirmUnsave = async () => {
    if (!confirmUnsave) return;
    const jobId = confirmUnsave.jobId;
    setConfirmUnsave(null);
    try {
      setActionLoading((p) => ({ ...p, [`save-${jobId}`]: true }));
      await api.delete(`/student/saved-jobs/${jobId}`);
      setSavedJobIds((p) => p.filter((id) => id !== jobId));
      toast.success('Job removed from your saved list successfully.');
    } catch { toast.error('Failed to remove job from saved list. Please try again.'); }
    finally { setActionLoading((p) => ({ ...p, [`save-${jobId}`]: false })); }
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return null;
    return Math.max(0, Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const recentLogoSrc = (logo) => {
    if (!logo) return null;
    if (logo.startsWith('http') || logo.startsWith('data:')) return logo;
    return `/${String(logo).replace(/^\//, '')}`;
  };

  const openJobDetails = (jobId) => {
    navigate(`/student/job/${jobId}`, { state: { from: location.pathname } });
  };

  return (
    <StudentLayout user={user}>
      <ConfirmModal
        open={!!confirmUnsave}
        onClose={() => setConfirmUnsave(null)}
        onConfirm={handleConfirmUnsave}
        title="Remove from saved list?"
        message="This job will be removed from your saved list. You can save it again anytime."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Browse Internships</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-700 dark:text-gray-200">Search and apply for internships</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <SearchWithHistory
                  historyKey="student-browse-jobs"
                  placeholder="Search by title or company..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-52">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="deadline">Deadline (Soonest)</option>
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className="w-full sm:w-auto gap-2"
              >
                <Filter size={16} />
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {recentJobs.length > 0 && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Viewed</h2>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRecentJobs((prev) => !prev)}
                  >
                    {showRecentJobs ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearRecentJobs}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {showRecentJobs && (
                <div className="mt-4 -mx-1 flex gap-3 overflow-x-auto pb-1">
                  {recentJobs.map((recentJob) => (
                    <button
                      key={recentJob.id}
                      type="button"
                      onClick={() => openJobDetails(recentJob.id)}
                      className="mx-1 w-64 shrink-0 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-slate-900 dark:hover:border-blue-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-slate-100 dark:border-gray-700 dark:bg-slate-800">
                          {recentJob.logo ? (
                            <img
                              src={recentLogoSrc(recentJob.logo)}
                              alt={recentJob.company || 'Company'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                              {(recentJob.company || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
                            {recentJob.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {recentJob.company}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grid */}
        {loading ? (
          <Card><CardContent className="flex justify-center items-center py-16"><span className="text-gray-500 dark:text-gray-400">Loading internships...</span></CardContent></Card>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Search}
                title="No internships found"
                description="Try adjusting your search terms or filters to find more opportunities."
                actionLabel="Clear Filters"
                onAction={clearFilters}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredJobs.map((job) => {
              const daysLeft = getDaysLeft(job.deadline);
              const postedAgo = timeAgo(job.createdAt);
              const postedFullDate = formatFullDate(job.createdAt);
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  appliedJobIds={appliedJobIds}
                  isSaved={savedJobIds.includes(job.id)}
                  isApplying={!!actionLoading[job.id]}
                  isSaving={!!actionLoading[`save-${job.id}`]}
                  daysLeft={daysLeft}
                  postedAgo={postedAgo}
                  postedFullDate={postedFullDate}
                  onOpenDetails={() => openJobDetails(job.id)}
                  onOpenCompany={() => job.companyId && navigate(`/student/company/${job.companyId}`)}
                  onOpenApply={() => openApplyModal(job)}
                  onToggleSave={() => handleToggleSave(job.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden overscroll-none bg-black/70 dark:bg-black/80" onClick={() => setIsFilterOpen(false)}>
          <div
            className="absolute inset-0 min-h-dvh w-full overflow-y-auto overscroll-y-contain bg-white p-4 dark:bg-slate-900 sm:inset-x-4 sm:inset-y-10 sm:mx-auto sm:min-h-0 sm:max-w-6xl sm:rounded-2xl sm:border sm:border-gray-200 sm:p-6 sm:shadow-xl dark:sm:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 pb-3 pt-1 dark:border-gray-700 dark:bg-slate-900 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Search filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 pb-24 sm:grid-cols-2 xl:grid-cols-3 overflow-auto px-1">
              <div className="space-y-3">
                <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">Category</h3>
                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map((category) => (
                    <label key={category} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => toggleFilterValue('categories', category)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">Experience</h3>
                <div className="space-y-2">
                  {EXPERIENCE_OPTIONS.map((experience) => (
                    <label key={experience} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={filters.experienceLevels.includes(experience)}
                        onChange={() => toggleFilterValue('experienceLevels', experience)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{experience}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">Work Mode</h3>
                <div className="space-y-2">
                  {WORK_MODE_OPTIONS.map((mode) => (
                    <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={filters.workModes.includes(mode)}
                        onChange={() => toggleFilterValue('workModes', mode)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">Location(s)</h3>
                <div className="space-y-2">
                  {LOCATION_OPTIONS.map((location) => (
                    <label key={location} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={filters.locations.includes(location)}
                        onChange={() => toggleFilterValue('locations', location)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">Paid Internship</h3>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={filters.paidOnly}
                    onChange={(e) => setFilters((prev) => ({ ...prev, paidOnly: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show only paid internships</span>
                </label>
              </div>

              <div className="space-y-3">
                <h3 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">Perks & Benefits</h3>
                <div className="space-y-2">
                  {PERK_OPTIONS.map((perk) => (
                    <label key={perk} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={filters.perks.includes(perk)}
                        onChange={() => toggleFilterValue('perks', perk)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{perk}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3 sm:static sm:mx-0 sm:mt-6 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 dark:border-gray-700 dark:bg-slate-900 dark:sm:bg-transparent">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear all
              </Button>
              <Button type="button" onClick={() => setIsFilterOpen(false)} className="bg-blue-600 text-white hover:bg-blue-700">
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}

      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeApplyModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Apply for {applyModalJob.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{applyModalJob.company}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Letter (optional)</label>
                <textarea
                  value={applyCoverLetter}
                  onChange={(e) => setApplyCoverLetter(e.target.value)}
                  placeholder="Why are you a good fit?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={closeApplyModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button type="button" onClick={handleApplySubmit} disabled={!!actionLoading[applyModalJob.id]} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {actionLoading[applyModalJob.id] ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
      <BackToTop />
    </StudentLayout>
  );
};

export default BrowseJobs;
