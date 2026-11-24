import api from './api';

export const inventoryService = {
  // GET /api/inventory
  getInventory: async (params = {}) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  // GET /api/inventory/low-stock
  getLowStock: async (params = {}) => {
    const response = await api.get('/inventory/low-stock', { params });
    return response.data;
  },

  // POST /api/inventory/adjust (Admin) { product_variant_id, quantity, type, reason }
  adjustStock: async (adjustData) => {
    const response = await api.post('/inventory/adjust', adjustData);
    return response.data;
  },

  // GET /api/inventory/movements/:variantId
  getMovements: async (variantId) => {
    const response = await api.get(`/inventory/movements/${variantId}`);
    return response.data;
  },

  // GET /api/inventory/variant/:variantId
  getVariantStock: async (variantId) => {
    const response = await api.get(`/inventory/variant/${variantId}`);
    return response.data;
  },
};

export default inventoryService;

