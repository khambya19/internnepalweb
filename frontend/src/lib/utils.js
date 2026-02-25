import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in NPR
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
export function formatNPR(amount) {
  if (!amount) return 'Unpaid';
  return `NPR ${amount.toLocaleString('en-NP')}`;
}

/**
 * Format date relative to now
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export function formatRelativeDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString('en-NP');
}
