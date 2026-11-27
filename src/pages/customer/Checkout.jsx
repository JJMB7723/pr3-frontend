import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import cartService from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const Checkout = () => {
  const { user } = useAuth();
  const { resetCart } = useCart();
  const { showToast } = useToast();
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

  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const res = await cartService.getCart();
        const data = res.data || res.cart || res;
        const items = data?.items || [];
        setCartItems(items);
        const calcSubtotal = items.reduce((sum, item) => {
          const price = parseFloat(item.unit_price || item.product_variant?.price || item.price || 0);
          return sum + price * (item.quantity || 0);
        }, 0);
        setSubtotal(calcSubtotal);
      } catch {
        // Handled gracefully
      } finally {
        setLoadingCart(false);
      }
    };
    loadCart();
  }, []);

  const handleChange = (e) => {
    setShippingForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async (codeOverride) => {
    const codeToApply = (typeof codeOverride === 'string' ? codeOverride : couponInput).trim();
    if (!codeToApply) {
      setCouponMsg({ text: 'Please enter a coupon code.', type: 'error' });
      return;
    }

    setCouponLoading(true);
    setCouponMsg({ text: '', type: '' });

    try {
      const res = await orderService.validateCoupon(codeToApply, subtotal);
      const data = res.data;
      setAppliedCoupon(data);
      setCouponInput(data.code);
      setCouponMsg({
        text: `Coupon ${data.code} applied! You save $${parseFloat(data.discount_amount).toFixed(2)}.`,
        type: 'success',
      });
      showToast(`Coupon ${data.code} applied (-$${parseFloat(data.discount_amount).toFixed(2)})`);
    } catch (err) {
      setAppliedCoupon(null);
      const msg = err.response?.data?.message || 'Invalid or expired coupon code.';
      setCouponMsg({ text: msg, type: 'error' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg({ text: '', type: '' });
  };

  const discountAmount = appliedCoupon ? parseFloat(appliedCoupon.discount_amount || 0) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 1. Create Order via POST /api/orders with optional coupon_code
      const orderRes = await orderService.createOrder({
        shipping_name: shippingForm.shipping_name,
        shipping_phone: shippingForm.shipping_phone,
        shipping_address: shippingForm.shipping_address,
        shipping_city: shippingForm.shipping_city,
        shipping_state: shippingForm.shipping_state,
        shipping_postal_code: shippingForm.shipping_postal_code,
        payment_method: shippingForm.payment_method,
        notes: shippingForm.notes,
        coupon_code: appliedCoupon?.code || undefined,
      });

      const order = orderRes.data || orderRes.order;

      // 2. Initiate Payment via POST /api/payments/initiate using reduced order total
      if (order && order.id) {
        await paymentService.initiate({
          order_id: order.id,
          amount: order.total_amount || order.totalAmount,
          payment_method: shippingForm.payment_method,
        });
      }

      resetCart();
      showToast('Order placed successfully!');
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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.8rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Shipping & Payment Form */}
          <form onSubmit={handlePlaceOrder} className="pr3-card" style={{ gridColumn: 'span 1' }}>
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
              2. Payment &amp; Coupon
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

            {/* Coupon Code Section */}
            <div
              style={{
                marginBottom: '1.4rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(23, 23, 23, 0.02)',
                border: '1px solid rgba(23, 23, 23, 0.08)',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Coupon / Promo Code
              </label>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g. PR3SAVE10)"
                  disabled={!!appliedCoupon}
                  className="pr3-input"
                  style={{
                    flex: 1,
                    marginBottom: 0,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                />
                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRemoveCoupon}
                    style={{ whiteSpace: 'nowrap', padding: '0.65rem 1rem' }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    disabled={couponLoading}
                    onClick={() => handleApplyCoupon()}
                    style={{ whiteSpace: 'nowrap', padding: '0.65rem 1.2rem' }}
                  >
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </Button>
                )}
              </div>

              {couponMsg.text && (
                <div
                  style={{
                    marginTop: '0.6rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: couponMsg.type === 'success' ? 'var(--color-sage)' : 'var(--color-coral)',
                  }}
                >
                  {couponMsg.type === 'success' ? '✓ ' : '✕ '}
                  {couponMsg.text}
                </div>
              )}

              {!appliedCoupon && (
                <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: 'rgba(23,23,23,0.65)' }}>
                  Available codes:{' '}
                  {['PR3SAVE10', 'WELCOME20', 'FLAT50', 'VIP100'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setCouponInput(code);
                        handleApplyCoupon(code);
                      }}
                      style={{
                        background: 'rgba(23,23,23,0.06)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.15rem 0.45rem',
                        marginRight: '0.35rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              )}
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
              disabled={submitting || loadingCart || cartItems.length === 0}
              style={{ width: '100%', marginTop: '1.2rem', padding: '1rem', fontSize: '1rem' }}
            >
              {submitting
                ? 'Placing Order...'
                : `Authorize & Pay $${finalTotal.toFixed(2)}`}
            </Button>
          </form>

          {/* Right Column: Live Order Summary */}
          <div className="pr3-card">
            <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.8rem' }}>
              Order Summary
            </span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Payment Breakdown
            </h3>

            {loadingCart ? (
              <p style={{ fontSize: '0.9rem', color: 'rgba(23,23,23,0.65)' }}>Loading cart...</p>
            ) : cartItems.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-coral)', fontWeight: 700 }}>
                Your cart is empty.
              </p>
            ) : (
              <>
                <div style={{ borderBottom: '1px solid rgba(23,23,23,0.08)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  {cartItems.map((item) => {
                    const price = parseFloat(item.unit_price || item.product_variant?.price || item.price || 0);
                    const lineTotal = price * (item.quantity || 0);
                    const name = item.product_variant?.product?.name || item.product_name || 'Apparel Item';
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.88rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span>
                          <strong>{name}</strong> × {item.quantity}
                        </span>
                        <span style={{ fontWeight: 700 }}>${lineTotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                  <span>Estimated Shipping</span>
                  <span style={{ color: 'var(--color-sage)', fontWeight: 700 }}>Free</span>
                </div>

                {appliedCoupon && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.6rem',
                      fontSize: '0.95rem',
                      color: 'var(--color-sage)',
                      fontWeight: 800,
                    }}
                  >
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div
                  style={{
                    borderTop: '1px solid rgba(23,23,23,0.1)',
                    paddingTop: '1rem',
                    marginTop: '0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <strong style={{ fontSize: '1.1rem' }}>Total to Pay</strong>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--color-coral)' }}>
                    ${finalTotal.toFixed(2)}
                  </strong>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
