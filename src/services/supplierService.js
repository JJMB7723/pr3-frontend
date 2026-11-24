import api from './api';

export const supplierService = {
  // GET /api/suppliers/profile/me
  getProfile: async () => {
    const response = await api.get('/suppliers/profile/me');
    return response.data;
  },

  // PUT /api/suppliers/profile/me
  updateProfile: async (profileData) => {
    const response = await api.put('/suppliers/profile/me', profileData);
    return response.data;
  },

  // GET /api/suppliers
  getSuppliers: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  // GET /api/suppliers/:id
  getSupplier: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },
};

export default supplierService;

