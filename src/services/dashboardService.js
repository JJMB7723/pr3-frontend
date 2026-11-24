import api from './api';

export const dashboardService = {
  // GET /api/dashboard (Role-driven statistics)
  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export default dashboardService;

