import { useCallback, useState } from 'react';

const STORAGE_KEY = 'recentlyViewedJobs';
const MAX_RECENT_JOBS = 5;
let storageBlocked = false;

const trimText = (value, max = 120) => String(value || '').trim().slice(0, max);

const sanitizeJob = (job) => {
  const rawLogo = String(job?.logo || '');
  const logo = rawLogo.startsWith('data:') ? null : trimText(rawLogo, 500);

  return {
    id: String(job?.id || ''),
    title: trimText(job?.title, 140),
    company: trimText(job?.company, 120),
    logo,
    type: trimText(job?.type, 40),
    location: trimText(job?.location, 120),
    createdAt: trimText(job?.createdAt, 40),
  };
};

const readRecentJobs = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeJob(item))
      .filter((item) => item.id)
      .slice(0, MAX_RECENT_JOBS);
  } catch {
    return [];
  }
};

const writeRecentJobs = (jobs) => {
  if (typeof window === 'undefined' || storageBlocked) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch (error) {
    // If storage is full/unavailable (private mode/quota), stop future write attempts.
    if (error?.name === 'QuotaExceededError' || error?.name === 'SecurityError') {
      storageBlocked = true;
      return false;
    }
    return false;
  }
};

export const useRecentlyViewed = () => {
  const [recentJobs, setRecentJobs] = useState(() => readRecentJobs());

  const addRecentJob = useCallback((job) => {
    if (!job?.id) return;

    const normalized = sanitizeJob(job);
    if (!normalized.id) return;

    setRecentJobs((prev) => {
      const next = [normalized, ...prev.filter((item) => item.id !== normalized.id)].slice(0, MAX_RECENT_JOBS);
      writeRecentJobs(next);
      return next;
    });
  }, []);

  const clearRecentJobs = useCallback(() => {
    setRecentJobs([]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors to keep UI responsive.
      }
    }
  }, []);

  return { recentJobs, addRecentJob, clearRecentJobs };
};
