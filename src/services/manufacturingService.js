import api from './api';

export const manufacturingService = {
  // GET /api/manufacturing
  getOrders: async (params = {}) => {
    const response = await api.get('/manufacturing', { params });
    return response.data;
  },

  // GET /api/manufacturing/:id
  getOrder: async (id) => {
    const response = await api.get(`/manufacturing/${id}`);
    return response.data;
  },

  // POST /api/manufacturing (Admin)
  createOrder: async (data) => {
    const response = await api.post('/manufacturing', data);
    return response.data;
  },

  // PUT /api/manufacturing/:id/status (Admin)
  updateStatus: async (id, status) => {
    const response = await api.put(`/manufacturing/${id}/status`, { status });
    return response.data;
  },

  // POST /api/manufacturing/production
  logProduction: async (productionData) => {
    const response = await api.post('/manufacturing/production', productionData);
    return response.data;
  },

  // POST /api/manufacturing/inspection (Admin)
  recordInspection: async (inspectionData) => {
    const response = await api.post('/manufacturing/inspection', inspectionData);
    return response.data;
  },
};

export default manufacturingService;

