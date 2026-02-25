import React from 'react';
import { cn } from '../../lib/utils';

/**
 * On-screen confirmation dialog. Use instead of window.confirm so all confirmations stay in the UI.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default', // 'default' | 'danger'
}) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6 border border-gray-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
          {title}
        </h3>
        {message && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 mb-4 sm:mb-6 break-words">{message}</p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              'w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base',
              variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
