import api from './api';

export async function getNotifications(params = {}) {
  try {
    const { data } = await api.get('/notifications', { params });
    return data;
  } catch (err) {
    // Silently handle profile incomplete errors
    if (err?.response?.data?.code === 'PROFILE_INCOMPLETE') {
      return { success: true, data: [], unreadCount: 0 };
    }
    throw err;
  }
}

export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/notifications/read-all');
  return data;
}
