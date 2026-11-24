import api from './api';

export const cartService = {
  // GET /api/cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // POST /api/cart/items { product_variant_id, quantity }
  addItem: async (itemData) => {
    const response = await api.post('/cart/items', itemData);
    return response.data;
  },

  // PUT /api/cart/items/:id { quantity }
  updateItem: async (itemId, quantity) => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  // DELETE /api/cart/items/:id
  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  // DELETE /api/cart
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};

export default cartService;

