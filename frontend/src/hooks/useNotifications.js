import { useState, useEffect, useCallback, useContext } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '../context/authContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationApi';

const POLL_INTERVAL_MS = 60 * 1000;

export function useNotifications() {
  const { user } = useContext(AuthContext);
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const role = String(user?.role || '').toLowerCase();
  const isBlockedByIncompleteProfile =
    (role === 'student' || role === 'company') &&
    user?.profileCompletion?.completed === false;

  const fetchNotifications = useCallback(async () => {
    if (!user || isBlockedByIncompleteProfile) {
      setList([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await getNotifications();
      if (res.success) {
        setList(res.data || []);
        setUnreadCount(res.unreadCount ?? 0);
      }
    } catch (err) {
      // Only log unexpected errors (not profile incomplete)
      if (err?.response?.data?.code !== 'PROFILE_INCOMPLETE') {
        console.error('Failed to fetch notifications:', err);
      }
      setList([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [isBlockedByIncompleteProfile, user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user || isBlockedByIncompleteProfile) return undefined;
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications, isBlockedByIncompleteProfile, user]);

  useEffect(() => {
    if (!user || isBlockedByIncompleteProfile) return undefined;
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchNotifications, isBlockedByIncompleteProfile, user]);

  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      toast.success('Notification marked as read');
    } catch {
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setList((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  return {
    notifications: list,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
