import React, { useMemo } from 'react';
import { Target } from 'lucide-react';

const COMPLETION_ITEMS = [
  { key: 'photo', label: 'Profile photo uploaded', points: 15, sectionId: 'photo-section' },
  { key: 'name', label: 'Name filled in', points: 5, sectionId: 'basic-info-section' },
  { key: 'phone', label: 'Phone number added', points: 5, sectionId: 'basic-info-section' },
  { key: 'university', label: 'University filled in', points: 10, sectionId: 'education-section' },
  { key: 'major', label: 'Major/field of study', points: 10, sectionId: 'education-section' },
  { key: 'graduationYear', label: 'Graduation year set', points: 5, sectionId: 'education-section' },
  { key: 'skills', label: 'At least 3 skills added', points: 15, sectionId: 'skills-section' },
  { key: 'resume', label: 'Resume uploaded', points: 20, sectionId: 'links-section' },
  { key: 'linkedin', label: 'LinkedIn URL added', points: 5, sectionId: 'links-section' },
  { key: 'githubOrPortfolio', label: 'GitHub or Portfolio URL', points: 5, sectionId: 'links-section' },
  { key: 'bio', label: 'Bio/About written', points: 5, sectionId: 'bio-section' },
];

const normalizeText = (v) => String(v || '').trim();

const getSkillsCount = (profile) => {
  if (Array.isArray(profile?.skills)) return profile.skills.filter((s) => normalizeText(s)).length;
  if (typeof profile?.skillsText === 'string') {
    return profile.skillsText.split(',').map((s) => s.trim()).filter(Boolean).length;
  }
  return 0;
};

const getCompletionMap = (profile) => ({
  photo: Boolean(normalizeText(profile?.avatar || profile?.profilePicture || profile?.photo || profile?.logo)),
  name: Boolean(normalizeText(profile?.name)),
  phone: Boolean(normalizeText(profile?.phone)),
  university: Boolean(normalizeText(profile?.university)),
  major: Boolean(normalizeText(profile?.major)),
  graduationYear: Boolean(normalizeText(profile?.graduationYear)),
  skills: getSkillsCount(profile) >= 3,
  resume: Boolean(normalizeText(profile?.resumeUrl)),
  linkedin: Boolean(normalizeText(profile?.linkedin)),
  githubOrPortfolio: Boolean(normalizeText(profile?.github) || normalizeText(profile?.portfolio)),
  bio: Boolean(normalizeText(profile?.bio || profile?.about)),
});

const getMessage = (percentage) => {
  if (percentage === 100) return "🎉 Your profile is complete! You're ready to apply.";
  if (percentage >= 80) return 'Almost there! Complete your profile to stand out.';
  if (percentage >= 50) return 'Good progress! A complete profile gets 3x more views.';
  return 'Complete your profile to start applying to internships.';
};

const getColorClasses = (percentage) => {
  if (percentage === 100) {
    return {
      bar: 'bg-green-500',
      text: 'text-green-700 dark:text-green-400',
      ring: 'text-green-500',
      card: 'border-green-200 dark:border-green-900',
    };
  }
  if (percentage >= 70) {
    return {
      bar: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-400',
      ring: 'text-blue-500',
      card: 'border-blue-200 dark:border-blue-900',
    };
  }
  if (percentage >= 40) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-400',
      ring: 'text-amber-500',
      card: 'border-amber-200 dark:border-amber-900',
    };
  }
  return {
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    ring: 'text-red-500',
    card: 'border-red-200 dark:border-red-900',
  };
};

const ProfileCompletion = ({
  profile,
  compact = false,
  onNavigateToItem,
  onNavigateToSection,
  onCompleteProfileClick,
  className = '',
}) => {
  const onNavigate = onNavigateToSection || onNavigateToItem;

  const { items, completedPoints, percentage, colors } = useMemo(() => {
    const completionMap = getCompletionMap(profile);
    const mappedItems = COMPLETION_ITEMS.map((item) => ({
      ...item,
      completed: Boolean(completionMap[item.key]),
    }));
    const points = mappedItems.reduce((sum, item) => sum + (item.completed ? item.points : 0), 0);
    const pct = Math.min(100, Math.max(0, points));
    return {
      items: mappedItems,
      completedPoints: points,
      percentage: pct,
      colors: getColorClasses(pct),
    };
  }, [profile]);

  if (compact) {
    return (
      <div className={`rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 ${className}`}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Profile Completion</p>
          <p className={`text-sm font-bold ${colors.text}`}>{percentage}% Complete</p>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className={`h-full transition-all duration-300 ${colors.bar}`} style={{ width: `${percentage}%` }} />
        </div>
        <button
          type="button"
          onClick={onCompleteProfileClick}
          className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Complete your profile
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-white dark:bg-slate-900 p-4 sm:p-5 ${colors.card} ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ${colors.ring}`}>
            <Target size={22} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">Profile Completion</p>
            <p className={`text-sm font-bold ${colors.text}`}>{percentage}% complete</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{completedPoints}/100 points completed</p>
          </div>
        </div>
        <p className={`text-sm font-medium ${colors.text}`}>{getMessage(percentage)}</p>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full transition-all duration-300 ${colors.bar}`} style={{ width: `${percentage}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const isClickable = !item.completed && typeof onNavigate === 'function';
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => isClickable && onNavigate(item.sectionId)}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                item.completed
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`shrink-0 text-sm ${item.completed ? 'text-green-500' : 'text-slate-400 dark:text-slate-500'}`}>
                {item.completed ? '✅' : '⬜'}
              </span>
              <span className={item.completed ? 'line-through' : ''}>
                {item.label} <span className="text-xs opacity-70">({item.points}%)</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Target size={14} />
        <span>Click incomplete items to jump to that section.</span>
      </div>
    </div>
  );
};

export default ProfileCompletion;
