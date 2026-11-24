import api from './api';

export const productService = {
  // GET /api/products
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // GET /api/products/:id
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // GET /api/products/categories
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  // POST /api/products (Admin, Business)
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // PUT /api/products/:id (Admin, Business)
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // DELETE /api/products/:id (Admin)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // POST /api/products/categories (Admin)
  createCategory: async (categoryData) => {
    const response = await api.post('/products/categories', categoryData);
    return response.data;
  },
};

export default productService;

