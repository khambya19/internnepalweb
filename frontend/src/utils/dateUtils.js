export const timeAgo = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // For future timestamps or very recent updates, show "Just now".
  if (diffMs < 60 * 1000) return 'Just now';

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(diffMs / day);
  if (days === 1) return 'Yesterday';
  if (days <= 6) return `${days} days ago`;

  if (diffMs < 4 * week) {
    const weeks = Math.floor(diffMs / week);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  if (diffMs < year) {
    const months = Math.floor(diffMs / month);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(diffMs / year);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

export const formatFullDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline);
  if (isNaN(end.getTime())) return null;
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};
