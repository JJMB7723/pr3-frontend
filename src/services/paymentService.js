import api from './api';

export const paymentService = {
  // POST /api/payments/initiate { order_id, amount, payment_method }
  initiate: async (paymentData) => {
    const response = await api.post('/payments/initiate', paymentData);
    return response.data;
  },

  // POST /api/payments/verify { transaction_id, status }
  verify: async (verifyData) => {
    const response = await api.post('/payments/verify', verifyData);
    return response.data;
  },

  // GET /api/payments/order/:orderId
  getOrderPayments: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },

  // GET /api/payments/:id
  getPayment: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },
};

export default paymentService;

