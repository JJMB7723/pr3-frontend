import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';

const Checkout = () => {
  const { user } = useAuth();
  const [shippingForm, setShippingForm] = useState({
    shipping_name: user ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() : 'Valued Customer',
    shipping_phone: user?.phone || '0771234567',
    shipping_address: '123 PR3 Fashion Boulevard',
    shipping_city: 'Colombo',
    shipping_state: 'Western',
    shipping_postal_code: '00100',
    payment_method: 'credit_card',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setShippingForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 1. Create Order via POST /api/orders with all required fields
      const orderRes = await orderService.createOrder({
        shipping_name: shippingForm.shipping_name,
        shipping_phone: shippingForm.shipping_phone,
        shipping_address: shippingForm.shipping_address,
        shipping_city: shippingForm.shipping_city,
        shipping_state: shippingForm.shipping_state,
        shipping_postal_code: shippingForm.shipping_postal_code,
        payment_method: shippingForm.payment_method,
        notes: shippingForm.notes,
      });

      const order = orderRes.data || orderRes.order;

      // 2. Initiate Payment via POST /api/payments/initiate
      if (order && order.id) {
        await paymentService.initiate({
          order_id: order.id,
          amount: order.total_amount || order.totalAmount,
          payment_method: shippingForm.payment_method,
        });
      }

      navigate('/orders');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to complete order. Please check your cart and stock availability.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          Order Checkout
        </h1>

        {error && (
          <div
            style={{
              padding: '0.85rem',
              border: '1px solid var(--color-coral)',
              backgroundColor: 'var(--color-coral-light)',
              color: 'var(--color-coral)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="pr3-card">
          <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid rgba(23, 23, 23, 0.08)', paddingBottom: '0.8rem', marginBottom: '1.4rem' }}>
            1. Shipping Destination
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Recipient Name"
              name="shipping_name"
              value={shippingForm.shipping_name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
            />
            <Input
              label="Contact Phone"
              name="shipping_phone"
              value={shippingForm.shipping_phone}
              onChange={handleChange}
              placeholder="+1-555-0199"
              required
            />
          </div>

          <Input
            label="Street Address"
            name="shipping_address"
            value={shippingForm.shipping_address}
            onChange={handleChange}
            placeholder="123 Industrial Parkway, Suite 400"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Input
              label="City"
              name="shipping_city"
              value={shippingForm.shipping_city}
              onChange={handleChange}
              placeholder="Metropolis"
              required
            />
            <Input
              label="State / Province"
              name="shipping_state"
              value={shippingForm.shipping_state}
              onChange={handleChange}
              placeholder="NY"
              required
            />
            <Input
              label="Postal Code"
              name="shipping_postal_code"
              value={shippingForm.shipping_postal_code}
              onChange={handleChange}
              placeholder="10001"
              required
            />
          </div>

          <h3
            style={{
              fontSize: '1.2rem',
              borderBottom: '1px solid rgba(23, 23, 23, 0.08)',
              paddingBottom: '0.8rem',
              margin: '2rem 0 1.4rem',
            }}
          >
            2. Payment Terms
          </h3>

          <div style={{ marginBottom: '1.4rem' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Payment Method
            </label>
            <select
              name="payment_method"
              value={shippingForm.payment_method}
              onChange={handleChange}
              className="pr3-input"
              style={{ fontWeight: 600 }}
            >
              <option value="credit_card">Credit / Debit Card</option>
              <option value="bank_transfer">Corporate Bank Transfer (Net-30)</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>
          </div>

          <Input
            label="Order Notes / Delivery Instructions"
            name="notes"
            value={shippingForm.notes}
            onChange={handleChange}
            placeholder="Gate code, loading dock specifications, etc."
          />

          <Button
            type="submit"
            variant="coral"
            disabled={submitting}
            style={{ width: '100%', marginTop: '1.8rem', padding: '1rem', fontSize: '1rem' }}
          >
            {submitting ? 'Placing Order...' : 'Authorize & Place Order'}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default Checkout;
