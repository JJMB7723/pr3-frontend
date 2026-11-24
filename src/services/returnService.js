import api from './api';

export const returnService = {
  // POST /api/returns
  requestReturn: async (returnData) => {
    const response = await api.post('/returns', returnData);
    return response.data;
  },

  // GET /api/returns
  getReturns: async () => {
    const response = await api.get('/returns');
    return response.data;
  },

  // GET /api/returns/:id
  getReturn: async (id) => {
    const response = await api.get(`/returns/${id}`);
    return response.data;
  },

  // PUT /api/returns/:id/review (Admin)
  reviewReturn: async (id, reviewData) => {
    const response = await api.put(`/returns/${id}/review`, reviewData);
    return response.data;
  },

  // POST /api/returns/items/:itemId/inspect (Admin)
  inspectAndRestock: async (itemId, inspectData) => {
    const response = await api.post(`/returns/items/${itemId}/inspect`, inspectData);
    return response.data;
  },
};

export default returnService;

