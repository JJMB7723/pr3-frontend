import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import orderService from '../../services/orderService';

// Status steps in delivery pipeline
const DELIVERY_STEPS = [
  { key: 'assigned',   label: 'Order Confirmed',  icon: '✓',  desc: 'Your order has been confirmed and assigned for dispatch.' },
  { key: 'picked_up', label: 'Picked Up',         icon: '📦', desc: 'Your parcel has been picked up from our warehouse.' },
  { key: 'in_transit',label: 'In Transit',         icon: '🚚', desc: 'Your order is on the way to your delivery address.' },
  { key: 'delivered', label: 'Delivered',          icon: '🏠', desc: 'Your order has been delivered successfully.' },
];

const ORDER_STATUS_STEPS = [
  { key: 'pending',    label: 'Order Placed',    icon: '🛒', desc: 'We received your order and are preparing it.' },
  { key: 'confirmed',  label: 'Confirmed',       icon: '✓',  desc: 'Order has been confirmed by our team.' },
  { key: 'processing', label: 'Processing',      icon: '⚙️', desc: 'Your items are being packed and prepared for dispatch.' },
  { key: 'shipped',    label: 'Shipped',         icon: '🚚', desc: 'Your order has left our facility.' },
  { key: 'delivered',  label: 'Delivered',       icon: '🏠', desc: 'Your order has arrived at your address.' },
];

const statusColor = {
  assigned:   '#F6B27A',
  picked_up:  '#F6B27A',
  in_transit: '#F6B27A',
  delivered:  '#2d7a2d',
  failed:     '#c0392b',
  pending:    '#F6B27A',
  confirmed:  '#F6B27A',
  processing: '#F6B27A',
  shipped:    '#F6B27A',
  cancelled:  '#c0392b',
};

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await orderService.getOrder(id);
        setOrder(res.data || res);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load order tracking info.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Layout withSidebar><Loader message="Loading tracking info..." /></Layout>;

  if (error || !order) {
    return (
      <Layout withSidebar>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <button onClick={() => navigate('/orders')} style={backBtnStyle}>← Back to Orders</button>
          <div style={{ padding: '1rem', background: '#fdf0ef', border: '1px solid #c0392b', borderRadius: '8px', color: '#c0392b', fontWeight: 700 }}>
            {error || 'Order not found.'}
          </div>
        </div>
      </Layout>
    );
  }

  const delivery = order.delivery || order.Delivery || null;
  const orderStatus  = order.orderStatus  || order.order_status  || order.status || 'pending';
  const deliveryStatus = delivery?.deliveryStatus || delivery?.delivery_status || 'assigned';
  const trackingNumber = delivery?.trackingNumber || delivery?.tracking_number || '—';
  const orderNumber    = order.orderNumber || order.order_number || `PR3-ORD-${1000 + order.id}`;
  const orderDate      = new Date(order.createdAt || order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const deliveredAt    = delivery?.deliveredAt || delivery?.delivered_at;

  // Build steps: use delivery pipeline if delivery record exists, else order pipeline
  const steps   = delivery ? DELIVERY_STEPS : ORDER_STATUS_STEPS;
  const current = delivery ? deliveryStatus : orderStatus;
  const stepIdx = steps.findIndex(s => s.key === current);

  const isCancelled = orderStatus === 'cancelled' || deliveryStatus === 'failed';

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* Back */}
        <button onClick={() => navigate('/orders')} style={backBtnStyle}>
          ← Back to Orders
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.8rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6B27A', display: 'block', marginBottom: '0.4rem' }}>
            ORDER TRACKING
          </span>
          <h1 style={{ fontSize: '1.9rem', letterSpacing: '-0.03em', margin: 0 }}>{orderNumber}</h1>
          <p style={{ color: '#777', marginTop: '0.3rem', fontSize: '0.9rem' }}>Placed on {orderDate}</p>
        </div>

        {/* Tracking Number Card */}
        <div className="pr3-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.4rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: '0.3rem' }}>Tracking Number</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em', fontFamily: 'monospace', color: '#4A0F14' }}>{trackingNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: '0.3rem' }}>Current Status</div>
            <span style={{
              display: 'inline-block',
              padding: '0.3rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: isCancelled ? '#fdf0ef' : '#fff8f0',
              color: isCancelled ? '#c0392b' : (statusColor[current] === '#2d7a2d' ? '#2d7a2d' : '#4A0F14'),
              border: `1.5px solid ${isCancelled ? '#c0392b' : '#F6B27A'}`,
            }}>
              {isCancelled ? (deliveryStatus === 'failed' ? 'Failed' : 'Cancelled') : current.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Progress Stepper */}
        {!isCancelled ? (
          <div className="pr3-card" style={{ marginBottom: '1.4rem', padding: '1.6rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delivery Progress</h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', position: 'relative' }}>
              {steps.map((step, idx) => {
                const done    = idx < stepIdx || (idx === stepIdx);
                const active  = idx === stepIdx;
                const future  = idx > stepIdx;
                return (
                  <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* Connector line */}
                    {idx < steps.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        width: '100%',
                        height: '3px',
                        background: idx < stepIdx ? '#4A0F14' : '#e8e0dc',
                        zIndex: 0,
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: active ? '1.1rem' : '0.95rem',
                      fontWeight: 900,
                      zIndex: 1,
                      background: done ? '#4A0F14' : '#f5f0ef',
                      color: done ? '#fff' : '#bbb',
                      border: active ? '3px solid #F6B27A' : done ? '3px solid #4A0F14' : '2px solid #ddd',
                      marginBottom: '0.6rem',
                      transition: 'all 0.2s',
                    }}>
                      {done ? (idx < stepIdx ? '✓' : step.icon) : step.icon}
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: active ? 900 : future ? 500 : 700, textAlign: 'center', color: active ? '#4A0F14' : future ? '#bbb' : '#555', lineHeight: 1.3, padding: '0 0.2rem' }}>
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Active step description */}
            {steps[stepIdx] && (
              <div style={{ marginTop: '1.4rem', padding: '0.8rem 1rem', background: '#fff8f0', borderLeft: '3px solid #F6B27A', borderRadius: '0 6px 6px 0', fontSize: '0.88rem', color: '#555' }}>
                <strong style={{ color: '#4A0F14' }}>{steps[stepIdx].label}:</strong> {steps[stepIdx].desc}
              </div>
            )}
          </div>
        ) : (
          <div className="pr3-card" style={{ marginBottom: '1.4rem', padding: '1.4rem', background: '#fdf0ef', border: '1px solid #c0392b' }}>
            <strong style={{ color: '#c0392b' }}>⚠ Order {orderStatus === 'cancelled' ? 'Cancelled' : 'Failed'}</strong>
            <p style={{ marginTop: '0.5rem', color: '#555', fontSize: '0.9rem' }}>
              This order has been cancelled or could not be delivered. Contact support if you need assistance.
            </p>
          </div>
        )}

        {/* Delivery Details */}
        <div className="pr3-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delivery Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={labelStyle}>Recipient</div>
              <div style={valueStyle}>{order.shippingName || order.shipping_name || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Phone</div>
              <div style={valueStyle}>{order.shippingPhone || order.shipping_phone || '—'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>Delivery Address</div>
              <div style={valueStyle}>
                {[
                  order.shippingAddress || order.shipping_address,
                  order.shippingCity    || order.shipping_city,
                  order.shippingState   || order.shipping_state,
                  order.shippingPostalCode || order.shipping_postal_code,
                ].filter(Boolean).join(', ')}
              </div>
            </div>
            {deliveredAt && (
              <div>
                <div style={labelStyle}>Delivered On</div>
                <div style={{ ...valueStyle, color: '#2d7a2d' }}>
                  {new Date(deliveredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="pr3-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Items Ordered</h3>
          {(order.items || order.OrderItems || []).length === 0 ? (
            <p style={{ color: '#888', fontSize: '0.9rem' }}>No item details available.</p>
          ) : (
            <table className="pr3-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Specification</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || order.OrderItems || []).map((item, idx) => {
                  const variant = item.productVariant || item.ProductVariant || item.variant || {};
                  const product = variant.product || variant.Product || item.product || {};
                  const name    = product.name || item.name || `Item ${idx + 1}`;
                  const spec    = [variant.size, variant.color].filter(Boolean).join(' · ') || '—';
                  const price   = item.unitPrice || item.unit_price || item.price || 0;
                  return (
                    <tr key={idx}>
                      <td><strong>{name}</strong></td>
                      <td style={{ color: '#777', fontSize: '0.88rem' }}>{spec}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 700 }}>${parseFloat(price).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid #f0ece8', paddingTop: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            {orderStatus === 'delivered' && (
              <button
                onClick={() => navigate(`/orders/${order.id}/return`)}
                style={{
                  background: 'none',
                  border: '1.5px solid #4A0F14',
                  color: '#4A0F14',
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                ↩ Request Item Return
              </button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>
                Total: <span style={{ color: '#4A0F14' }}>${parseFloat(order.totalAmount || order.total_amount || 0).toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const backBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#4A0F14',
  fontWeight: 800,
  fontSize: '0.88rem',
  cursor: 'pointer',
  padding: '0 0 1.2rem 0',
  display: 'block',
  letterSpacing: '0.02em',
};

const labelStyle = {
  fontSize: '0.72rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#999',
  marginBottom: '0.25rem',
};

const valueStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#222',
};

export default OrderTracking;

