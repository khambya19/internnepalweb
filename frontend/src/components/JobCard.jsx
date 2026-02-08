import React from 'react';
import { MapPin, DollarSign, Calendar, Eye, Users, Heart, CheckCircle, Zap, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

const isNewJob = (createdAt) => {
  if (!createdAt) return false;
  const now = new Date();
  const posted = new Date(createdAt);
  const diffHours = (now - posted) / (1000 * 60 * 60);
  return diffHours <= 24;
};

const formatViewCount = (count) => {
  const value = Number(count || 0);
  if (value <= 0) return '';
  if (value < 1000) return `${value} views`;
  const compact = Math.round((value / 1000) * 10) / 10;
  return `${compact}k views`;
};

const logoSrc = (logo) =>
  logo?.startsWith('http') || logo?.startsWith('data:') ? logo : `/${logo}`;

const JobCard = ({
  job,
  appliedJobIds = [],
  isSaved = false,
  isApplying = false,
  isSaving = false,
  daysLeft = null,
  postedAgo = '',
  postedFullDate = '',
  onOpenDetails,
  onOpenCompany,
  onOpenApply,
  onToggleSave,
}) => {
  const hasApplied = appliedJobIds.includes(job.id);
  const showNewBadge = isNewJob(job.createdAt);
  const responseStats = job.companyResponseRate || null;
  const showHighResponseBadge =
    responseStats &&
    Number(responseStats.responseRate || 0) >= 80 &&
    responseStats.avgResponseDays !== null;
  const showMediumResponseBadge =
    responseStats &&
    Number(responseStats.responseRate || 0) >= 50 &&
    Number(responseStats.responseRate || 0) < 80;

  return (
    <Card
      className={`bg-white dark:bg-slate-900 border flex flex-col hover:shadow-md transition-shadow relative overflow-visible ${
        hasApplied
          ? 'border-gray-200 dark:border-gray-800 border-l-4 border-l-green-500'
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      {showNewBadge && (
        <div className="absolute -top-2 -left-2 z-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-md animate-pulse">
            NEW
          </span>
        </div>
      )}

      {hasApplied && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle size={12} />
            Applied
          </span>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 mb-2 min-w-0">
          <div className="shrink-0">
            {job.logo ? (
              <img
                src={logoSrc(job.logo)}
                alt="Logo"
                className="h-10 w-10 object-cover rounded-full border border-gray-300 dark:border-gray-700"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {job.companyInitial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle
              className="text-slate-900 dark:text-white text-base sm:text-lg line-clamp-2 break-all cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              title={job.title}
              onClick={onOpenDetails}
            >
              {job.title}
            </CardTitle>
            {onOpenCompany && job.companyId ? (
              <button
                type="button"
                onClick={onOpenCompany}
                className="mt-0.5 text-left text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 truncate"
                title={`View ${job.company} profile`}
              >
                {job.company}
              </button>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{job.company}</p>
            )}

            {showHighResponseBadge && (
              <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Zap size={12} className="shrink-0" />
                <span>
                  Usually responds within {responseStats.avgResponseDays} day
                  {responseStats.avgResponseDays !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {showMediumResponseBadge && (
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Zap size={12} className="shrink-0" />
                <span>Responds to most applications</span>
              </div>
            )}

            {job.deadline && (() => {
              if (daysLeft < 0) {
                return (
                  <span className="mt-1 inline-block text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    Expired
                  </span>
                );
              }
              if (daysLeft === 0) {
                return (
                  <span className="mt-1 inline-block text-xs font-bold bg-red-500 dark:bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                    Deadline Today!
                  </span>
                );
              }
              if (daysLeft === 1) {
                return (
                  <span className="mt-1 inline-block text-xs font-bold bg-red-500 dark:bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                    Last Day to Apply!
                  </span>
                );
              }
              if (daysLeft <= 3) {
                return (
                  <span className="mt-1 inline-block text-xs font-bold bg-orange-500 dark:bg-amber-600 text-white px-2 py-0.5 rounded">
                    Deadline in {daysLeft} days!
                  </span>
                );
              }
              if (daysLeft <= 7) {
                return (
                  <span className="mt-1 inline-block text-xs font-bold bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-2 py-0.5 rounded">
                    Closing Soon
                  </span>
                );
              }
              return null;
            })()}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.category && <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-200 text-xs">{job.category}</Badge>}
          {job.workMode && <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-200 text-xs">{job.workMode}</Badge>}
          {job.hiringPaused && (
            <Badge className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
              <Pause size={12} />
              Paused
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-3 pb-4">
        <div className="text-gray-900 dark:text-white space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span>
              {job.stipend != null && job.stipend !== '' && Number(job.stipend) > 0
                ? `NPR ${Number(job.stipend).toLocaleString()}/month`
                : 'Unpaid'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500 dark:text-slate-400 shrink-0" />
            {daysLeft !== null ? (
              <span className={daysLeft <= 3 ? 'text-red-600 font-semibold' : ''}>{daysLeft} days left</span>
            ) : postedAgo ? (
              <span className="group relative inline-flex items-center">
                <span>Posted {postedAgo}</span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md group-hover:block dark:bg-slate-100 dark:text-slate-900">
                  {postedFullDate}
                </span>
              </span>
            ) : <span>—</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-900 dark:text-white">
          <div className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {job.type || 'internship'}
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Users size={14} />
            <span>
              {(job.applicantCount || 0) <= 0
                ? 'Be the first to apply!'
                : (job.applicantCount || 0) > 100
                  ? '100+ applicants'
                  : `${job.applicantCount} applicants`}
            </span>
          </div>
          {Number(job.viewCount || 0) > 0 && (
            <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Eye size={14} />
              <span>{formatViewCount(job.viewCount)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={onOpenDetails}
            variant="outline"
            size="sm"
            className="gap-1.5 w-full text-gray-700 dark:text-gray-300"
          >
            View Details
          </Button>
          <Button
            onClick={onOpenApply}
            disabled={hasApplied || isApplying || job.hiringPaused}
            size="sm"
            title={job.hiringPaused ? 'Applications are temporarily paused' : ''}
            className={`gap-1.5 w-full ${
              hasApplied
                ? 'bg-gray-300 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed'
                : job.hiringPaused
                  ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isApplying ? (
              '...'
            ) : hasApplied ? (
              'Applied'
            ) : job.hiringPaused ? (
              <span className="inline-flex items-center gap-1">
                <Pause size={14} />
                Paused
              </span>
            ) : (
              'Apply'
            )}
          </Button>
          <button
            type="button"
            onClick={onToggleSave}
            disabled={isSaving}
            className={`col-span-2 flex items-center justify-center gap-2 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
              isSaved
                ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            <Heart size={14} className={isSaved ? 'fill-current' : ''} />
            {isSaved ? 'Saved' : 'Save for later'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
