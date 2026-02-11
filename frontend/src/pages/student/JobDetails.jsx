import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'sonner';
import { MapPin, Clock, Users, Heart, ArrowLeft, Building2, FileText, Briefcase, GraduationCap, Check, Gift, Award, Mail, Trophy, Timer, UtensilsCrossed, Bus, Home, BookOpen, Globe, Phone, X, Linkedin, Twitter, Facebook, Instagram, Github, CheckCircle2, Pause, Zap, Flag, Star, AlertCircle } from 'lucide-react';

import StudentLayout from '../../components/layout/StudentLayout';
import { AuthContext } from '../../context/authContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { formatFullDate, timeAgo, getDaysLeft } from '../../utils/dateUtils';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';

const ApplicationSuccessModal = ({ open, companyName, onClose, onViewApplications, onBrowseJobs }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition-all duration-200 ease-out dark:border-slate-700 dark:bg-slate-900 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">🎉 Application Submitted!</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Good luck with your application to {companyName || 'the company'}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close success modal"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          We&apos;ll notify you when {companyName || 'the company'} reviews your application.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onViewApplications}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View My Applications
          </button>
          <button
            type="button"
            onClick={onBrowseJobs}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Browse More Jobs
          </button>
        </div>
      </div>
    </div>
  );
};

const CONFETTI_COLORS = ['#2563eb', '#16a34a', '#f59e0b'];

const createConfettiPieces = (count, idRef) =>
  Array.from({ length: count }).map(() => {
    idRef.current += 1;
    const spread = Math.random() * 70 - 35; // top-center spread
    return {
      id: idRef.current,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      left: 50 + Math.random() * 10 - 5,
      tx: spread * 8,
      ty: 260 + Math.random() * 380,
      rot: Math.random() * 900 - 450,
      duration: 2200 + Math.floor(Math.random() * 900),
      delay: Math.floor(Math.random() * 160),
    };
  });

const uniqueStrings = (values = []) => {
  const seen = new Set();
  const result = [];
  values.forEach((item) => {
    const raw = String(item || '').trim();
    if (!raw) return;
    const normalized = raw.toLowerCase();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    result.push(raw);
  });
  return result;
};

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

const stripEmbeddedPreviewText = (value, minCutIndex = 24) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const markerPatterns = [
    /\bPreview\b/i,
    /\bInternship\s+Title\b/i,
    /\bLocation\b/i,
    /\bRequired\s+Skills\b/i,
    /\bPerks\s*&\s*Benefits\b/i,
    /\bQualifications\s*&\s*Skills\b/i,
    /\bRequired\s+Qualifications\b/i,
    /\bKey\s+Responsibilities\b/i,
    /\bReport\s+this\s+job\b/i,
  ];

  let cutIndex = raw.length;
  markerPatterns.forEach((pattern) => {
    const match = pattern.exec(raw);
    if (!match || typeof match.index !== 'number') return;
    if (match.index < minCutIndex) return;
    if (match.index < cutIndex) cutIndex = match.index;
  });

  return raw.slice(0, cutIndex).trim();
};

const cleanSectionText = (value, leadingLabelRegex) => {
  let cleaned = String(value || '').trim();
  if (!cleaned) return '';
  if (leadingLabelRegex) {
    cleaned = cleaned.replace(leadingLabelRegex, '').trim();
  }
  cleaned = stripEmbeddedPreviewText(cleaned);
  return cleaned;
};

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isApplied, setIsApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('');
  
  const [isSaved, setIsSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showConfirmUnsave, setShowConfirmUnsave] = useState(false);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const [showApplySuccessModal, setShowApplySuccessModal] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const confettiIdRef = useRef(0);
  const allowedBackPaths = ['/student/browse-jobs', '/student/saved-jobs', '/student/applications'];
  const requestedBackPath = location.state?.from;
  const backPath = allowedBackPaths.includes(requestedBackPath) ? requestedBackPath : '/student/browse-jobs';
  const { addRecentJob } = useRecentlyViewed();

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('fake_job');
  const [reportDesc, setReportDesc] = useState('');
  const [isReported, setIsReported] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [companyProfileDetails, setCompanyProfileDetails] = useState(null);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);
        const [jobRes, appsRes, savedRes] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get('/applications/my-applications').catch((err) => {
            // Silently handle profile incomplete
            if (err?.response?.data?.code === 'PROFILE_INCOMPLETE') {
              return { data: { success: false, data: [] } };
            }
            return { data: { success: false, data: [] } };
          }),
          api.get('/student/saved-jobs').catch((err) => {
            // Silently handle profile incomplete
            if (err?.response?.data?.code === 'PROFILE_INCOMPLETE') {
              return { data: { success: false, data: [] } };
            }
            return { data: { success: false, data: [] } };
          })
        ]);

        if (jobRes.data.success) {
          setJob(jobRes.data.data);
        } else {
          setError('Job not found');
        }

        if (appsRes.data?.success) {
          const app = appsRes.data.data.find((a) => a.jobId === id || (a.Job && a.Job.id === id));
          if (app) {
            setIsApplied(true);
            setApplicationStatus(app.status || 'pending');
          }
        }

        if (savedRes.data?.success) {
          const saved = savedRes.data.data.find((s) => s.jobId === id || (s.Job && s.Job.id === id));
          if (saved) {
            setIsSaved(true);
          }
        }
      } catch {
        setError('Failed to load job details');
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobData();
    }
  }, [id]);

  useEffect(() => {
    if (!job?.id) return;

    const company = job.company || {};
    const locationText = uniqueStrings([
      ...(Array.isArray(job.locations) ? job.locations : []),
      ...String(job.location || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ]).join(', ') || company.location || '';

    addRecentJob({
      id: job.id,
      title: job.title || 'Untitled Role',
      company: company.companyName || 'Unknown Company',
      logo: company.logo || null,
      type: job.type || null,
      location: locationText,
      createdAt: job.createdAt || new Date().toISOString(),
    });
  }, [job, addRecentJob]);

  useEffect(() => {
    if (!job?.id || !user?.id) return;

    api
      .post('/views/record', { targetType: 'job', targetId: job.id })
      .catch(() => {});
  }, [job?.id, user?.id]);

  useEffect(() => {
    const companyId = job?.company?.id;
    setCompanyProfileDetails(null);
    if (!companyId) return;

    api
      .get(`/company/public/${companyId}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setCompanyProfileDetails(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => {});
  }, [job?.company?.id]);

  const fireConfetti = () => {
    const firstBurst = createConfettiPieces(100, confettiIdRef);
    setConfettiPieces(firstBurst);

    window.setTimeout(() => {
      const secondBurst = createConfettiPieces(50, confettiIdRef);
      setConfettiPieces((prev) => [...prev, ...secondBurst]);
    }, 500);

    window.setTimeout(() => {
      setConfettiPieces([]);
    }, 3200);
  };

  const handleApply = async () => {
    try {
      setActionLoading(true);
      const response = await api.post(`/applications/${id}`, { coverLetter: coverLetter || undefined });
      toast.success('✓ Application submitted successfully! Track your progress in My Applications.');
      setIsApplied(true);
      setApplicationStatus('pending');
      setCoverLetter('');

      if (response?.status === 201) {
        fireConfetti();
        setShowApplySuccessModal(true);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to apply for job';
      const isAlreadyApplied = error.response?.status === 400 && (message || '').toLowerCase().includes('already applied');
      if (isAlreadyApplied) {
        setIsApplied(true);
        setApplicationStatus('pending');
        toast.info('You have already applied for this job. Check My Applications for status.');
      } else {
        toast.error(message || 'Failed to apply. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (isSaved) {
      setShowConfirmUnsave(true);
      return;
    }
    try {
      setSaveLoading(true);
      await api.post(`/student/saved-jobs/${id}`, {});
      setIsSaved(true);
      toast.success('✓ Job saved successfully! You can find it in your Saved Jobs section.');
    } catch {
      toast.error('Failed to save job. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleConfirmUnsave = async () => {
    setShowConfirmUnsave(false);
    try {
      setSaveLoading(true);
      await api.delete(`/student/saved-jobs/${id}`);
      setIsSaved(false);
      toast.success('Job removed from your saved list successfully.');
    } catch {
      toast.error('Failed to remove job from saved list. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReportJob = async () => {
    try {
      setReportLoading(true);
      await api.post('/reports/job', {
        jobId: id,
        reason: reportReason,
        description: reportDesc
      });
      toast.success('✓ Report submitted successfully! Thank you for keeping InternNepal safe.');
      setIsReported(true);
      setShowReportModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout user={user}>
        <div className="flex justify-center items-center h-full min-h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !job) {
    return (
      <StudentLayout user={user}>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center max-w-2xl mx-auto border border-slate-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">{error || 'Job not found'}</h2>
          <button 
            onClick={() => navigate(backPath)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 text-sm font-medium"
          >
            Go back to Browse
          </button>
        </div>
      </StudentLayout>
    );
  }

  const companyData = companyProfileDetails || job.company || {};
  const logoUrl = companyData?.logo?.startsWith('http') || companyData?.logo?.startsWith('data:')
    ? companyData.logo
    : companyData?.logo ? `/${companyData.logo.replace(/^\//, '')}` : null;
  const bannerUrl = companyData?.banner?.startsWith('http') || companyData?.banner?.startsWith('data:')
    ? companyData.banner
    : companyData?.banner ? `/${companyData.banner.replace(/^\//, '')}` : null;
  const companyName = companyData?.companyName || 'Unknown Company';
  const companyTagline = companyData?.tagline || '';
  const companyAbout = companyData?.about || companyData?.description || `${companyName} is an innovative company offering growth and learning opportunities.`;
  const companyLocation = companyData?.location || '';
  const companyEmail = companyData?.email || companyData?.User?.email || '';
  const companyWebsite = companyData?.website || '';
  const companyReviewSummary = companyData?.reviewsSummary || { totalReviews: 0, averageRating: null, reviews: [] };
  const companyReviews = Array.isArray(companyReviewSummary.reviews) ? companyReviewSummary.reviews : [];
  const socialLinks = [
    { key: 'linkedin', label: 'LinkedIn', href: companyData?.linkedin, Icon: Linkedin, color: 'text-blue-600' },
    { key: 'twitter', label: 'Twitter', href: companyData?.twitter, Icon: Twitter, color: 'text-sky-500' },
    { key: 'facebook', label: 'Facebook', href: companyData?.facebook, Icon: Facebook, color: 'text-blue-700' },
    { key: 'instagram', label: 'Instagram', href: companyData?.instagram, Icon: Instagram, color: 'text-pink-500' },
    { key: 'github', label: 'GitHub', href: companyData?.github, Icon: Github, color: 'text-slate-700 dark:text-slate-200' },
  ].filter((item) => !!item.href);
  const salary = job.stipend ?? job.salary;
  const hasSalary = salary != null && salary !== '' && Number(salary) > 0;
  const uniqueJobLocations = uniqueStrings([
    ...(Array.isArray(job.locations) ? job.locations : []),
    ...String(job.location || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ]);
  const uniqueJobSkills = uniqueStrings(Array.isArray(job.skills) ? job.skills : []);
  const uniqueJobPerks = uniqueStrings(Array.isArray(job.perks) ? job.perks : []);
  const descriptionText = cleanSectionText(job.description, /^description\s*[:-]?\s*/i);
  const responsibilitiesText = cleanSectionText(job.responsibilities, /^key\s+responsibilities\s*[:-]?\s*/i);
  const requirementsText = cleanSectionText(job.requirements, /^requirements?\s*[:-]?\s*/i);
  const shouldShowResponsibilities =
    !!responsibilitiesText && normalizeText(responsibilitiesText) !== normalizeText(descriptionText);
  const shouldShowRequirements =
    !!requirementsText &&
    normalizeText(requirementsText) !== normalizeText(descriptionText) &&
    normalizeText(requirementsText) !== normalizeText(responsibilitiesText);
  const jobLocationText = uniqueJobLocations.length > 0
    ? uniqueJobLocations.join(', ')
    : companyLocation || 'Not specified';
  const postedAgo = timeAgo(job.createdAt);
  const postedFullDate = formatFullDate(job.createdAt);
  const daysLeft = getDaysLeft(job.deadline);
  const detailsRows = [
    { key: 'location', label: 'Location', value: jobLocationText },
    { key: 'category', label: 'Category', value: job.category || 'Not specified' },
    { key: 'workMode', label: 'Work Mode', value: job.workMode || 'Not specified' },
    { key: 'duration', label: 'Duration', value: job.duration ? `${job.duration} months` : 'Not specified' },
    { key: 'stipend', label: 'Stipend', value: hasSalary ? `Rs ${Number(salary).toLocaleString()}/month` : 'Unpaid' },
    { key: 'openings', label: 'Openings', value: String(job.openings ?? 1) },
    { key: 'posted', label: 'Posted', value: postedAgo || 'N/A', fullValue: postedFullDate || null },
    {
      key: 'deadline',
      label: 'Deadline',
      value: job.deadline
        ? `${new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${daysLeft !== null ? ` (${daysLeft}d left)` : ''}`
        : 'Not specified'
    },
  ];

  return (
    <StudentLayout user={user}>
      {confettiPieces.length > 0 && (
        <>
          <style>{`
            @keyframes job-confetti-drop {
              0% {
                transform: translate(0px, 0px) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
                opacity: 0;
              }
            }
          `}</style>
          <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className="absolute block h-2.5 w-1.5 rounded-[2px]"
                style={{
                  left: `${piece.left}%`,
                  top: '10%',
                  backgroundColor: piece.color,
                  animation: `job-confetti-drop ${piece.duration}ms cubic-bezier(0.12, 0.8, 0.28, 1) forwards`,
                  animationDelay: `${piece.delay}ms`,
                  '--tx': `${piece.tx}px`,
                  '--ty': `${piece.ty}px`,
                  '--rot': `${piece.rot}deg`,
                }}
              />
            ))}
          </div>
        </>
      )}
      <ApplicationSuccessModal
        open={showApplySuccessModal}
        companyName={job?.CompanyProfile?.companyName || 'the company'}
        onClose={() => setShowApplySuccessModal(false)}
        onViewApplications={() => {
          setShowApplySuccessModal(false);
          navigate('/student/applications');
        }}
        onBrowseJobs={() => {
          setShowApplySuccessModal(false);
          navigate('/student/browse-jobs');
        }}
      />
      <ConfirmModal
        open={showConfirmUnsave}
        onClose={() => setShowConfirmUnsave(false)}
        onConfirm={handleConfirmUnsave}
        title="Remove from saved list?"
        message="This job will be removed from your saved list. You can save it again from Browse Jobs."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
      <div className="max-w-5xl mx-auto pt-2 sm:pt-4 md:pt-6 pb-6 sm:pb-8 md:pb-12 px-2 sm:px-4 md:px-0 w-full min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={18} className="shrink-0" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Header Card - match company card style */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 md:p-8 shadow-sm border border-slate-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 md:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-gray-300 font-bold text-2xl flex-shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
                  ) : (
                    companyName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1 break-words">{job.title}</h1>
                      <p className="text-slate-600 dark:text-gray-300 text-sm font-medium flex items-center gap-1.5 break-words">
                        <Building2 size={16} className="text-slate-500 dark:text-gray-400 flex-shrink-0" />
                        {companyName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSave}
                      disabled={saveLoading}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 active:scale-95 disabled:opacity-60 ${
                        isSaved ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900' : 'border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Heart size={22} className={isSaved ? 'fill-current' : ''} />
                    </button>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden min-w-0">
                    <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                      {detailsRows.map((row) => (
                        <div key={row.key} className="grid grid-cols-1 sm:grid-cols-[1fr,1.4fr] gap-1 sm:gap-3 px-3 py-2 sm:py-2.5 text-sm">
                          <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
                          <dd className="text-slate-900 dark:text-slate-100 font-medium break-words sm:text-right">
                            {row.fullValue ? (
                              <span className="group relative inline-block cursor-help">
                                {row.value}
                                <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md group-hover:block dark:bg-slate-100 dark:text-slate-900">
                                  {row.fullValue}
                                </span>
                              </span>
                            ) : (
                              row.value
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden divide-y divide-slate-100 dark:divide-gray-800">
              <div className="p-4 sm:p-6 md:p-8">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  Description
                </h2>
                <div className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed break-words min-w-0">
                  <p className="whitespace-pre-wrap break-words">{descriptionText || 'No description provided.'}</p>
                </div>
              </div>

              {shouldShowResponsibilities && (
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <CheckCircle2 size={18} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    Key Responsibilities
                  </h3>
                  <p className="text-slate-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed break-words">{responsibilitiesText}</p>
                </div>
              )}

              {shouldShowRequirements && (
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    Requirements
                  </h3>
                  <p className="text-slate-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed break-words">{requirementsText}</p>
                </div>
              )}
            </div>

            {/* Skills & Experience */}
            {(uniqueJobSkills.length > 0 || job.experienceLevel || job.minEducation) && (
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 md:p-8 shadow-sm border border-slate-200 dark:border-gray-800">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <GraduationCap size={18} className="text-green-600 dark:text-green-400" />
                  </div>
                  Qualifications &amp; Skills
                </h2>
                
                {(job.experienceLevel || job.minEducation) && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-2">Required Qualifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.experienceLevel && (
                        <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
                          {job.experienceLevel}
                        </span>
                      )}
                      {job.minEducation && (
                        <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-800 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
                          {job.minEducation}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {uniqueJobSkills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {uniqueJobSkills.map((skill) => (
                        <span key={skill} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Perks & Benefits */}
            {uniqueJobPerks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 md:p-8 shadow-sm border border-slate-200 dark:border-gray-800">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Gift size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Perks &amp; Benefits
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniqueJobPerks.map((perk) => {
                    const perkConfig = {
                      'Certificate':                { Icon: Award },
                      'Letter of Recommendation':   { Icon: Mail },
                      'Pre-Placement Offer (PPO)':  { Icon: Trophy },
                      'Flexible Hours':              { Icon: Timer },
                      'Meal Allowance':              { Icon: UtensilsCrossed },
                      'Transport Allowance':         { Icon: Bus },
                      'Work from Home':              { Icon: Home },
                      'Mentorship':                  { Icon: BookOpen },
                    };
                    const { Icon = Check } = perkConfig[perk] || {};
                    return (
                      <li key={perk} className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium border border-emerald-200 dark:border-emerald-800">
                        <Icon size={16} className="shrink-0 text-emerald-600 dark:text-emerald-500" />
                        <span>{perk}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Report Job Link */}
            <div className="pt-2 flex justify-center sm:justify-start">
              <button
                type="button"
                disabled={isReported}
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReported ? (
                  <>
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span>Reported ✓</span>
                  </>
                ) : (
                  <>
                    <Flag size={14} />
                    <span>Report this job</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 lg:min-w-[280px]">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-gray-800 sticky top-24">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Job Overview</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-gray-300">Job Type</dt>
                  <dd className="font-medium text-slate-900 dark:text-white capitalize">{job.type || 'Internship'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-gray-300">Work Mode</dt>
                  <dd className="font-medium text-slate-900 dark:text-white capitalize">{job.workMode || 'Office'}</dd>
                </div>
                {job.duration != null && job.duration !== '' && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-600 dark:text-gray-300">Duration</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{job.duration} months</dd>
                  </div>
                )}
                {job.startDate && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-600 dark:text-gray-300">Start Date</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">
                      {new Date(job.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600 dark:text-gray-300">Openings</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{job.openings ?? 1}</dd>
                </div>
                {job.deadline && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-600 dark:text-gray-300">Deadline</dt>
                    <dd className={`font-medium ${daysLeft !== null && daysLeft <= 3 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {daysLeft !== null && <span className="text-xs ml-1">({daysLeft}d left)</span>}
                    </dd>
                  </div>
                )}
                {job.stipendNote && (
                  <div className="pt-2 border-t border-slate-100 dark:border-gray-800">
                    <dt className="text-slate-600 dark:text-gray-300 mb-1">Stipend Note</dt>
                    <dd className="text-slate-700 dark:text-gray-200 text-xs leading-relaxed">{job.stipendNote}</dd>
                  </div>
                )}
              </dl>

              {/* Hiring Paused Warning */}
              {job.hiringPaused && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center">
                      <Pause size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm mb-1">
                        ⏸ Hiring Temporarily Paused
                      </h4>
                      <p className="text-xs text-yellow-800 dark:text-yellow-400 leading-relaxed">
                        The company has temporarily paused accepting applications for this position. Please check back soon or save this job to apply later when hiring resumes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Deadline Warning Banner */}
              {job.deadline && (() => {
                if (daysLeft < 0) {
                  return (
                    <div className="mt-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-center">
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Application Deadline Passed</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This internship is no longer accepting applications.</p>
                    </div>
                  );
                }
                if (daysLeft === 0) {
                  return (
                    <div className="mt-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-center animate-pulse">
                      <span className="text-lg font-bold text-red-700 dark:text-red-400">⚠️ Deadline Today!</span>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">Submit your application before midnight!</p>
                    </div>
                  );
                }
                if (daysLeft === 1) {
                  return (
                    <div className="mt-6 p-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-center animate-pulse">
                      <span className="text-lg font-bold text-red-700 dark:text-red-400">⏰ Last Day to Apply!</span>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">Hurry, deadline is tomorrow!</p>
                    </div>
                  );
                }
                if (daysLeft <= 3) {
                  return (
                    <div className="mt-6 p-4 rounded-xl bg-orange-100 dark:bg-amber-900/30 border border-orange-300 dark:border-amber-700 text-center">
                      <span className="text-lg font-bold text-orange-700 dark:text-amber-400">📅 Deadline in {daysLeft} days!</span>
                      <p className="text-sm text-orange-600 dark:text-amber-400 mt-1">Don't miss out—apply soon!</p>
                    </div>
                  );
                }
                if (daysLeft <= 7) {
                  return (
                    <div className="mt-6 p-4 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-center">
                      <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">⏳ Closing Soon</span>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">Application deadline is approaching.</p>
                    </div>
                  );
                }
                return null;
              })()}

              {isApplied ? (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-xl text-center border border-green-100 dark:border-green-900">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <p className="font-semibold text-green-900 dark:text-green-300 text-sm">Already Applied</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5 capitalize">{applicationStatus}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/student/applications')}
                    className="mt-3 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium text-xs underline transition-colors duration-200 active:scale-[0.98]"
                  >
                    View in My Applications
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Cover letter (optional)</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Why are you a good fit?"
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-gray-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={actionLoading || job.hiringPaused || (daysLeft !== null && daysLeft < 0)}
                    title={job.hiringPaused ? 'Applications are temporarily paused for this position' : (daysLeft !== null && daysLeft < 0) ? 'Application deadline has passed' : ''}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {actionLoading ? 'Submitting...' : job.hiringPaused ? '⏸ Applications Paused' : (daysLeft !== null && daysLeft < 0) ? '❌ Deadline Passed' : 'Submit Application'}
                  </button>
                </div>
              )}
            </div>

            {/* About Company */}
            <button
              type="button"
              onClick={() => setShowCompanyProfile(true)}
              className="w-full text-left bg-white dark:bg-slate-900 rounded-lg p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-gray-800 shadow-sm min-w-0 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Building2 size={18} className="text-slate-600 dark:text-gray-400" />
                About Company
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                {companyData?.about || companyData?.description || ''}
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                  <MapPin size={14} className="text-slate-500 dark:text-gray-400 flex-shrink-0" />
                  {companyLocation}
                </p>
                {companyWebsite && (
                  <p className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Globe size={14} className="flex-shrink-0" />
                    <span className="truncate">{companyWebsite.replace(/^https?:\/\//, '')}</span>
                  </p>
                )}
                
                {/* Response Rate Badge Preview */}
                {companyData?.responseRate && (() => {
                  const { responseRate, avgResponseDays, totalApplications } = companyData.responseRate;
                  
                  // Only show if company has at least 5 applications
                  if (totalApplications < 5) return null;
                  
                  if (responseRate >= 80 && avgResponseDays !== null) {
                    return (
                      <p className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <Zap size={12} className="shrink-0" />
                        <span>Usually responds within {avgResponseDays} day{avgResponseDays !== 1 ? 's' : ''}</span>
                      </p>
                    );
                  }
                  
                  if (responseRate >= 50) {
                    return (
                      <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Zap size={12} className="shrink-0" />
                        <span>Responsive company ({responseRate}% response rate)</span>
                      </p>
                    );
                  }
                  
                  return null;
                })()}

                {companyReviewSummary.totalReviews > 0 && (
                  <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Star size={12} className="fill-yellow-400 text-yellow-500 shrink-0" />
                    <span>
                      {companyReviewSummary.averageRating} / 5 ({companyReviewSummary.totalReviews} review
                      {companyReviewSummary.totalReviews !== 1 ? 's' : ''})
                    </span>
                  </p>
                )}
                
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">Click to view full company profile</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Company Profile Modal */}
      {showCompanyProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onClick={() => setShowCompanyProfile(false)}>
          <div
            className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-gray-700 px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{companyName}</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">Company Profile</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompanyProfile(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-slate-800"
                aria-label="Close company profile"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-gray-700">
                <div
                  className={`h-40 ${bannerUrl ? 'bg-cover bg-center' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
                  style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}
                />
                <div className="relative px-5 pb-5">
                  <div className="absolute -top-12 flex h-24 w-24 items-center justify-center rounded-xl border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-md overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt={companyName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-700 dark:text-gray-300">{companyName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="ml-28 pt-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white truncate">{companyName}</h4>
                    </div>
                    {companyTagline && (
                      <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">{companyTagline}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">About Company</h4>
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                  {companyAbout}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Company Details</h4>
                  {companyData?.industry && (
                    <div className="text-sm text-slate-700 dark:text-gray-300">
                      <span className="text-slate-500 dark:text-gray-400">Industry:</span> {companyData.industry}
                    </div>
                  )}
                  {companyData?.companySize && (
                    <div className="text-sm text-slate-700 dark:text-gray-300">
                      <span className="text-slate-500 dark:text-gray-400">Company Size:</span> {companyData.companySize}
                    </div>
                  )}
                  {companyData?.foundedYear && (
                    <div className="text-sm text-slate-700 dark:text-gray-300">
                      <span className="text-slate-500 dark:text-gray-400">Founded:</span> {companyData.foundedYear}
                    </div>
                  )}
                  {companyLocation && (
                    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-gray-300">
                      <MapPin size={15} className="text-slate-500 dark:text-gray-400 mt-0.5 shrink-0" />
                      <span>{companyLocation}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Contact</h4>
                  {companyData?.phone && (
                    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-gray-300">
                      <Phone size={15} className="text-slate-500 dark:text-gray-400 mt-0.5 shrink-0" />
                      <span>{companyData.phone}</span>
                    </div>
                  )}
                  {companyEmail && (
                    <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-gray-300">
                      <Mail size={15} className="text-slate-500 dark:text-gray-400 mt-0.5 shrink-0" />
                      <span>{companyEmail}</span>
                    </div>
                  )}
                  {companyWebsite && (
                    <a
                      href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Globe size={15} className="mt-0.5 shrink-0" />
                      <span className="break-all">{companyWebsite}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Company Reviews</h4>
                {companyReviews.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-gray-300">No reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 dark:text-gray-300">
                      ⭐ {companyReviewSummary.averageRating} / 5 from {companyReviewSummary.totalReviews} review
                      {companyReviewSummary.totalReviews !== 1 ? 's' : ''}
                    </p>
                    {companyReviews.slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {item.student?.name || 'Student'}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            ⭐ {item.rating}/5
                          </p>
                        </div>
                        {item.review && (
                          <p className="mt-1 text-sm text-slate-600 dark:text-gray-300 whitespace-pre-wrap">
                            {item.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Response Rate Section */}
              {companyData?.responseRate && (() => {
                const { responseRate, avgResponseDays, totalApplications } = companyData.responseRate;
                
                // Only show if company has at least 5 applications
                if (totalApplications < 5) return null;

                return (
                  <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={16} className="text-blue-600 dark:text-blue-400" />
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Response Performance</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Response Rate with Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-700 dark:text-gray-300">Response Rate</span>
                          <span className={`text-sm font-bold ${
                            responseRate >= 80 
                              ? 'text-green-600 dark:text-green-400' 
                              : responseRate >= 50 
                              ? 'text-amber-600 dark:text-amber-400' 
                              : 'text-slate-600 dark:text-gray-400'
                          }`}>
                            {responseRate}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              responseRate >= 80 
                                ? 'bg-green-500' 
                                : responseRate >= 50 
                                ? 'bg-amber-500' 
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(responseRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Average Response Time */}
                      {avgResponseDays !== null && (
                        <div className="flex items-center justify-between text-sm pt-1">
                          <span className="text-slate-600 dark:text-gray-400">Average response time</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {avgResponseDays} day{avgResponseDays !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {/* Badge based on response rate */}
                      {responseRate >= 80 ? (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-md">
                          <Zap size={12} />
                          <span>Highly responsive to applications</span>
                        </div>
                      ) : responseRate >= 50 ? (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-md">
                          <Zap size={12} />
                          <span>Responds to most applications</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()}

              {socialLinks.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Social Links</h4>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((item) => {
                      const SocialIcon = item.Icon;
                      return (
                        <a
                          key={item.key}
                          href={item.href.startsWith('http') ? item.href : `https://${item.href}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-gray-700 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${item.color}`}
                        >
                          <SocialIcon size={14} />
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 p-4 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flag size={18} className="text-red-500" />
                Report Job
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="fake_job">Fake Job / Scam</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="already_filled">Position Already Filled</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Additional details (optional)</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows="3"
                  placeholder="Provide any additional details..."
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>
              <button
                onClick={handleReportJob}
                disabled={reportLoading}
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {reportLoading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default JobDetails;
