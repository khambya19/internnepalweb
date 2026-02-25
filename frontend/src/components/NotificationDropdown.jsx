import React from 'react';
import { Bell, Check, Loader2, ChevronDown } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../lib/utils';

function formatNotificationTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationDropdown({ buttonClassName, dropdownClassName }) {
  const {
    notifications,
    unreadCount,
    loading,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState(null);

  React.useEffect(() => {
    if (open && refetch) refetch();
  }, [open, refetch]);

  const handleRowClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
    setExpandedId((prev) => (prev === notif.id ? null : notif.id));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => { setOpen(false); setExpandedId(null); }}
          />
          <div
            className={cn(
              'fixed z-[60] flex flex-col w-[min(100vw-2rem,22rem)] max-h-[calc(100vh-5.5rem)] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden',
              'top-[5.25rem] right-4 sm:right-6 lg:right-8',
              dropdownClassName
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isExpanded = expandedId === notif.id;
                  const hasMessage = notif.message && String(notif.message).trim().length > 0;
                  const canExpand = hasMessage;

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        'border-b border-gray-100 last:border-b-0 min-w-0',
                        !notif.read && 'bg-blue-50/40'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => canExpand && handleRowClick(notif)}
                        className={cn(
                          'w-full px-4 py-3 text-left transition-colors duration-200 hover:bg-gray-50/80 flex items-start gap-3'
                        )}
                      >
                        {!notif.read && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                        <div className={cn('flex-1 min-w-0', !notif.read && !canExpand && 'font-medium')}>
                          <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                          {hasMessage && !isExpanded && (
                            <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                              {notif.message}
                            </p>
                          )}
                          <p className="mt-1.5 text-[11px] text-gray-400">
                            {formatNotificationTime(notif.createdAt)}
                          </p>
                        </div>
                        {canExpand && (
                          <span className="shrink-0 mt-1 text-gray-400">
                            <ChevronDown size={16} className={cn('transition-transform duration-200', isExpanded && 'rotate-180')} />
                          </span>
                        )}
                        {!notif.read && !canExpand && (
                          <span
                            role="button"
                            tabIndex={0}
                            title="Mark as read"
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                            onKeyDown={(e) => e.key === 'Enter' && markAsRead(notif.id)}
                            className="shrink-0 p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          >
                            <Check size={14} />
                          </span>
                        )}
                      </button>

                      {isExpanded && hasMessage && (
                        <div className="px-4 pb-3 pt-0 border-t border-gray-100 bg-gray-50/50 shrink-0">
                          <div className="rounded-lg bg-white border border-gray-100 p-3 min-w-0 overflow-hidden">
                            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
