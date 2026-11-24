import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import orderService from '../../services/orderService';
import returnService from '../../services/returnService';
import { useAuth } from '../../context/AuthContext';

const RETURN_REASONS = [
  'Size does not fit',
  'Item defective or damaged',
  'Received incorrect item or specification',
  'Product does not match website description',
  'Changed mind / no longer needed',
  'Other',
];

const ReturnRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Selected items: map of order_item_id -> { selected: boolean, quantity: number }
  const [selectedItems, setSelectedItems] = useState({});
  const [reasonCategory, setReasonCategory] = useState(RETURN_REASONS[0]);
  const [desiredResolution, setDesiredResolution] = useState('replace'); // 'replace' | 'refund'
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeColor, setExchangeColor] = useState('');
  const [exchangeSpec, setExchangeSpec] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await orderService.getOrder(id);
      const data = res.data || res;
      setOrder(data);

      const items = data.order_items || data.items || data.OrderItems || [];
      const initSelected = {};
      items.forEach((item) => {
        initSelected[item.id] = {
          selected: false,
          quantity: item.quantity || 1,
          maxQuantity: item.quantity || 1,
        };
      });
      setSelectedItems(initSelected);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load order details for return.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }));
  };

  const handleQuantityChange = (itemId, qty) => {
    const val = parseInt(qty, 10);
    const max = selectedItems[itemId]?.maxQuantity || 1;
    if (isNaN(val) || val < 1) return;
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: Math.min(val, max),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const itemsToReturn = Object.entries(selectedItems)
      .filter(([, v]) => v.selected)
      .map(([orderItemId, v]) => ({
        order_item_id: Number(orderItemId),
        quantity: v.quantity,
      }));

    if (itemsToReturn.length === 0) {
      setError('Please select at least one item to return.');
      return;
    }

    const orderItemsList = order?.order_items || order?.items || order?.OrderItems || [];
    const isBulk = role === 'business' || orderItemsList.some((it) => (it.quantity || 1) >= 10);

    const exchangeDetails = [
      exchangeSize && `Target Size: ${exchangeSize}`,
      exchangeColor && `Target Color: ${exchangeColor}`,
      exchangeSpec && exchangeSpec.trim(),
    ].filter(Boolean).join(' · ');

    const fullReason = `[Requested: ${isBulk ? 'BULK ' : ''}${desiredResolution === 'replace' ? `EXCHANGE (${exchangeDetails || 'Different size/color'})` : 'REFUND (DAMAGED MERCHANDISE)'}] ${reasonCategory}${reasonDetails.trim() ? `: ${reasonDetails.trim()}` : ''}`;

    setSubmitting(true);
    try {
      const payload = {
        order_id: Number(order.id),
        reason: fullReason,
        items: itemsToReturn,
      };

      const res = await returnService.requestReturn(payload);
      const returnData = res.data || res;
      const newReturnId = returnData.id || returnData.return_request_id || returnData.returnId;

      if (newReturnId) {
        navigate(`/returns/${newReturnId}/track`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading return form..." /></Layout>;

  if (!order) {
    return (
      <Layout withSidebar>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <button onClick={() => navigate('/orders')} style={backBtnStyle}>← Back to Orders</button>
          <div style={{ padding: '1rem', background: '#fdf0ef', border: '1px solid #c0392b', borderRadius: '8px', color: '#c0392b', fontWeight: 700 }}>
            {error || 'Order not found.'}
          </div>
        </div>
      </Layout>
    );
  }

  const items = order.order_items || order.items || order.OrderItems || [];
  const orderNumber = order.orderNumber || order.order_number || `PR3-ORD-${1000 + order.id}`;
  const orderStatus = order.orderStatus || order.order_status || order.status || 'delivered';

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <button onClick={() => navigate('/orders')} style={backBtnStyle}>
          ← Back to Orders
        </button>

        <div style={{ marginBottom: '1.6rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6B27A', display: 'block', marginBottom: '0.4rem' }}>
            RETURN MERCHANDISE AUTHORIZATION
          </span>
          <h1 style={{ fontSize: '1.9rem', letterSpacing: '-0.03em', margin: 0 }}>
            Request Return for {orderNumber}
          </h1>
          <p style={{ color: '#777', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            Select items you wish to return and indicate the reason for return inspection.
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.9rem 1.2rem', background: '#fdf0ef', border: '1px solid #c0392b', borderRadius: '8px', color: '#c0392b', fontWeight: 700, marginBottom: '1.4rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Item Selection Card */}
          <div className="pr3-card" style={{ marginBottom: '1.4rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              1. Select Items to Return
            </h3>

            {items.length === 0 ? (
              <p style={{ color: '#888' }}>No items found in this order.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {items.map((item) => {
                  const variant = item.productVariant || item.ProductVariant || item.product_variant || {};
                  const product = variant.product || variant.Product || item.product || {};
                  const name = product.name || item.name || `Item #${item.id}`;
                  const spec = [variant.size, variant.color].filter(Boolean).join(' · ') || 'Standard';
                  const price = item.unitPrice || item.unit_price || item.price || 0;
                  const itemState = selectedItems[item.id] || {};

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: itemState.selected ? '2px solid #4A0F14' : '1px solid #e8e2de',
                        background: itemState.selected ? '#fffaf8' : '#fff',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={!!itemState.selected}
                          onChange={() => handleToggleItem(item.id)}
                          style={{ width: '18px', height: '18px', accentColor: '#4A0F14', cursor: 'pointer' }}
                        />
                        <label htmlFor={`item-${item.id}`} style={{ cursor: 'pointer' }}>
                          <div style={{ fontWeight: 800, color: '#222' }}>{name}</div>
                          <div style={{ fontSize: '0.82rem', color: '#777', marginTop: '0.15rem' }}>
                            {spec} • ${parseFloat(price).toFixed(2)} each
                          </div>
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#888', fontWeight: 600 }}>Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max={itemState.maxQuantity || item.quantity || 1}
                          value={itemState.quantity || 1}
                          disabled={!itemState.selected}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          style={{
                            width: '60px',
                            padding: '0.4rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontWeight: 700,
                            opacity: itemState.selected ? 1 : 0.4,
                          }}
                        />
                        <span style={{ fontSize: '0.82rem', color: '#aaa' }}>/ {itemState.maxQuantity || item.quantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason Card */}
          <div className="pr3-card" style={{ marginBottom: '1.4rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              2. Return Reason & Desired Resolution
            </h3>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={labelStyle}>What is the issue with the item?</label>
              <select
                className="pr3-input"
                value={reasonCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setReasonCategory(val);
                  if (val.toLowerCase().includes('size')) {
                    setDesiredResolution('replace');
                  } else if (val.toLowerCase().includes('defective') || val.toLowerCase().includes('damage')) {
                    setDesiredResolution('refund');
                  }
                }}
                style={{ fontWeight: 600, width: '100%', padding: '0.65rem' }}
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Desired Resolution Options */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={labelStyle}>What action would you like our Atelier to take?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.4rem' }}>
                <div
                  onClick={() => setDesiredResolution('replace')}
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '8px',
                    border: desiredResolution === 'replace' ? '2px solid #4A0F14' : '1px solid #ddd',
                    background: desiredResolution === 'replace' ? '#fffaf8' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <input
                      type="radio"
                      name="resolution"
                      checked={desiredResolution === 'replace'}
                      onChange={() => setDesiredResolution('replace')}
                      style={{ accentColor: '#4A0F14' }}
                    />
                    <strong style={{ color: '#4A0F14', fontSize: '0.95rem' }}>🔄 Replace / Exchange</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', lineHeight: 1.3 }}>
                    Exchange for another size or variant. Best when size does not fit.
                  </p>
                </div>

                <div
                  onClick={() => setDesiredResolution('refund')}
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '8px',
                    border: desiredResolution === 'refund' ? '2px solid #4A0F14' : '1px solid #ddd',
                    background: desiredResolution === 'refund' ? '#fffaf8' : '#fafafa',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <input
                      type="radio"
                      name="resolution"
                      checked={desiredResolution === 'refund'}
                      onChange={() => setDesiredResolution('refund')}
                      style={{ accentColor: '#4A0F14' }}
                    />
                    <strong style={{ color: '#4A0F14', fontSize: '0.95rem' }}>💵 Issue Full Refund</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', lineHeight: 1.3 }}>
                    Return funds to payment method. Best for damaged or defective garments.
                  </p>
                </div>
              </div>
            </div>

            {desiredResolution === 'replace' && (
              <div style={{ marginBottom: '1.2rem', padding: '1rem', background: '#fff8f0', borderLeft: '4px solid #F6B27A', borderRadius: '4px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#4A0F14', marginBottom: '0.6rem' }}>
                  🔄 Exchange Requirements (Different Size or Color)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                  <div>
                    <label style={{ ...labelStyle, color: '#4A0F14' }}>Target Replacement Size(s)</label>
                    <input
                      type="text"
                      className="pr3-input"
                      placeholder="e.g. Size L (or specify breakdown: 25 L, 25 XL)"
                      value={exchangeSize}
                      onChange={(e) => setExchangeSize(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: '#4A0F14' }}>Target Replacement Colorway</label>
                    <input
                      type="text"
                      className="pr3-input"
                      placeholder="e.g. Alpine Green (or Keep Original)"
                      value={exchangeColor}
                      onChange={(e) => setExchangeColor(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#4A0F14' }}>Additional Replacement Notes / Batch Instructions</label>
                  <input
                    type="text"
                    className="pr3-input"
                    placeholder="e.g. Need different sizes for corporate staff uniforms"
                    value={exchangeSpec}
                    onChange={(e) => setExchangeSpec(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem' }}
                  />
                </div>
              </div>
            )}

            {desiredResolution === 'refund' && (
              <div style={{ marginBottom: '1.2rem', padding: '1rem', background: '#fdf0ef', borderLeft: '4px solid #c0392b', borderRadius: '4px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#c0392b', marginBottom: '0.4rem' }}>
                  💵 Damaged Merchandise Refund Request
                </div>
                <p style={{ margin: '0 0 0.6rem', fontSize: '0.88rem', color: '#555', lineHeight: 1.4 }}>
                  The amount for damaged or defective garments will be calculated and refunded to your corporate account upon atelier inspection.
                </p>
                {(() => {
                  const estRefund = Object.entries(selectedItems)
                    .filter(([, v]) => v.selected)
                    .reduce((acc, [orderItemId, v]) => {
                      const oi = (order?.order_items || order?.items || order?.OrderItems || []).find((it) => Number(it.id) === Number(orderItemId));
                      const price = parseFloat(oi?.unitPrice || oi?.unit_price || oi?.price || 0);
                      return acc + price * (v.quantity || 1);
                    }, 0);

                  return estRefund > 0 ? (
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#c0392b' }}>
                      Estimated Refund Credit: ${estRefund.toFixed(2)}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div>
              <label style={labelStyle}>Additional Notes / Condition Details (Optional)</label>
              <textarea
                className="pr3-input"
                rows="3"
                placeholder="Explain the reason for return or any item flaws..."
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/orders')}
              style={{ padding: '0.75rem 1.4rem' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ padding: '0.75rem 1.8rem', background: '#4A0F14', color: '#fff', border: 'none' }}
            >
              {submitting ? 'Submitting Return...' : 'Submit Return Request'}
            </Button>
          </div>
        </form>
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
  fontSize: '0.75rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#888',
  display: 'block',
  marginBottom: '0.4rem',
};

export default ReturnRequest;

