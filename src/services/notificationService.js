import api from './api';

export const notificationService = {
  // GET /api/notifications
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // GET /api/notifications/unread-count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // PATCH /api/notifications/:id/read
  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // PATCH /api/notifications/read-all
  markAllRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export default notificationService;

