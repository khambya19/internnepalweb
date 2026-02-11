import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Globe,
  Zap,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Github,
  Star,
} from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import { AuthContext } from '../../context/authContext';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { toast } from 'sonner';

const CompanyProfile = () => {
  const { user } = useContext(AuthContext);
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 0, review: '' });
  const [isReviewSaving, setIsReviewSaving] = useState(false);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/company/public/${companyId}`);
      if (res.data?.success) {
        setCompany(res.data.data);
      } else {
        setError('Company profile not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) fetchCompany();
  }, [companyId, fetchCompany]);

  useEffect(() => {
    if (!company || !user?.id) {
      setReviewForm({ rating: 0, review: '' });
      return;
    }
    const existing = company.reviewsSummary?.reviews?.find((item) => item.studentId === user.id);
    if (existing) {
      setReviewForm({
        rating: Number(existing.rating || 0),
        review: existing.review || ''
      });
    } else {
      setReviewForm({ rating: 0, review: '' });
    }
  }, [company, user?.id]);

  if (loading) {
    return (
      <StudentLayout user={user}>
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </StudentLayout>
    );
  }

  if (error || !company) {
    return (
      <StudentLayout user={user}>
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-slate-900">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {error || 'Company profile not found'}
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Go back
          </button>
        </div>
      </StudentLayout>
    );
  }

  const responseStats = company.responseRate || null;
  const showResponseStats = responseStats && Number(responseStats.totalApplications || 0) >= 5;
  const reviewSummary = company.reviewsSummary || { totalReviews: 0, averageRating: null, reviews: [] };
  const companyReviews = Array.isArray(reviewSummary.reviews) ? reviewSummary.reviews : [];
  const canReview = user?.role === 'student';
  const logoUrl =
    company.logo?.startsWith('http') || company.logo?.startsWith('data:')
      ? company.logo
      : company.logo
        ? `/${String(company.logo).replace(/^\//, '')}`
        : null;
  const bannerUrl =
    company.banner?.startsWith('http') || company.banner?.startsWith('data:')
      ? company.banner
      : company.banner
        ? `/${String(company.banner).replace(/^\//, '')}`
        : null;

  const socialLinks = [
    { key: 'linkedin', label: 'LinkedIn', href: company.linkedin, Icon: Linkedin, color: 'text-blue-600' },
    { key: 'twitter', label: 'Twitter', href: company.twitter, Icon: Twitter, color: 'text-sky-500' },
    { key: 'facebook', label: 'Facebook', href: company.facebook, Icon: Facebook, color: 'text-blue-700' },
    { key: 'instagram', label: 'Instagram', href: company.instagram, Icon: Instagram, color: 'text-pink-500' },
    { key: 'github', label: 'GitHub', href: company.github, Icon: Github, color: 'text-slate-700 dark:text-slate-200' },
  ].filter((item) => !!item.href);

  const renderStars = (rating, interactive = false, onClick = null) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onClick && onClick(value)}
          className={interactive ? 'rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800' : 'cursor-default'}
        >
          <Star
            size={16}
            className={value <= Number(rating || 0) ? 'fill-yellow-400 text-yellow-500' : 'text-slate-300 dark:text-slate-600'}
          />
        </button>
      ))}
    </div>
  );

  const submitReview = async () => {
    if (!canReview) return;
    if (!Number.isInteger(Number(reviewForm.rating)) || Number(reviewForm.rating) < 1 || Number(reviewForm.rating) > 5) {
      toast.error('Please select a rating between 1 and 5.');
      return;
    }
    try {
      setIsReviewSaving(true);
      await api.post(`/company/${companyId}/reviews`, {
        rating: Number(reviewForm.rating),
        review: String(reviewForm.review || '').trim()
      });
      toast.success('✓ Your company review has been submitted successfully. Thank you for your feedback!');
      await fetchCompany();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save review.');
    } finally {
      setIsReviewSaving(false);
    }
  };

  return (
    <StudentLayout user={user}>
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <Card className="overflow-hidden border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
          <div
            className={`h-40 sm:h-52 ${bannerUrl ? 'bg-cover bg-center' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
            style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}
          />
          <CardContent className="relative px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
            <div className="absolute -top-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow-md dark:border-slate-900 dark:bg-slate-800">
              {logoUrl ? (
                <img src={logoUrl} alt={company.companyName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {(company.companyName || 'C').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="ml-28 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{company.companyName}</h1>
              </div>
              {company.tagline && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{company.tagline}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle>About Company</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {company.about || company.description || `${company.companyName} is an innovative company.`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Contact & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {company.industry && <p><span className="text-slate-500 dark:text-slate-400">Industry:</span> {company.industry}</p>}
              {company.companySize && <p><span className="text-slate-500 dark:text-slate-400">Company Size:</span> {company.companySize}</p>}
              {company.foundedYear && <p><span className="text-slate-500 dark:text-slate-400">Founded:</span> {company.foundedYear}</p>}
              {company.location && (
                <p className="inline-flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
                  {company.location}
                </p>
              )}
              {company.phone && (
                <p className="inline-flex items-start gap-2">
                  <Phone size={15} className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
                  {company.phone}
                </p>
              )}
              {(company.email || company.User?.email) && (
                <p className="inline-flex items-start gap-2">
                  <Mail size={15} className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
                  {company.email || company.User?.email}
                </p>
              )}
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-2 text-blue-600 hover:underline dark:text-blue-400"
                >
                  <Globe size={15} className="mt-0.5 shrink-0" />
                  <span className="break-all">{company.website}</span>
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <span>Company Reviews</span>
              {reviewSummary.totalReviews > 0 && (
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  ⭐ {reviewSummary.averageRating} ({reviewSummary.totalReviews} review{reviewSummary.totalReviews !== 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canReview && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Share your review</p>
                {renderStars(reviewForm.rating, true, (value) =>
                  setReviewForm((prev) => ({ ...prev, rating: value }))
                )}
                <textarea
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, review: e.target.value }))}
                  rows={3}
                  placeholder="Share your experience with this company..."
                  className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={isReviewSaving}
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isReviewSaving ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            )}

            {companyReviews.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {companyReviews.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {item.student?.name || 'Student'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                        </p>
                      </div>
                      {renderStars(item.rating)}
                    </div>
                    {item.review && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {item.review}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showResponseStats && (
          <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <Zap size={18} className="text-blue-600 dark:text-blue-400" />
                Response Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Response Rate</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {responseStats.responseRate}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${
                      responseStats.responseRate >= 80
                        ? 'bg-green-500'
                        : responseStats.responseRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(Number(responseStats.responseRate || 0), 100)}%` }}
                  />
                </div>
              </div>
              {responseStats.avgResponseDays !== null && (
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                  Average response time: <span className="font-semibold">{responseStats.avgResponseDays} day{responseStats.avgResponseDays !== 1 ? 's' : ''}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {socialLinks.length > 0 && (
          <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((item) => {
                  const SocialIcon = item.Icon;
                  return (
                    <a
                      key={item.key}
                      href={item.href.startsWith('http') ? item.href : `https://${item.href}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-slate-800 ${item.color}`}
                    >
                      <SocialIcon size={14} />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default CompanyProfile;
