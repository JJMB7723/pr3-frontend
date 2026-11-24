import api from './api';

export const deliveryService = {
  // GET /api/deliveries
  getDeliveries: async () => {
    const response = await api.get('/deliveries');
    return response.data;
  },

  // POST /api/deliveries (Admin)
  createDelivery: async (deliveryData) => {
    const response = await api.post('/deliveries', deliveryData);
    return response.data;
  },

  // PUT /api/deliveries/:id/status
  updateStatus: async (id, status) => {
    const response = await api.put(`/deliveries/${id}/status`, { status });
    return response.data;
  },
};

export default deliveryService;

