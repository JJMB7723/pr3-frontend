import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import returnService from '../../services/returnService';

const RETURN_PIPELINE = [
  {
    key: 'requested',
    label: 'Requested',
    icon: '📝',
    desc: 'Return request submitted. Our atelier team is reviewing the claim.',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: '✓',
    desc: 'Return authorized. Pack the garments securely for courier collection.',
  },
  {
    key: 'picked_up',
    label: 'In Transit',
    icon: '🚚',
    desc: 'Returned items collected by logistics and routed to atelier inspection.',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: '🏠',
    desc: 'Merchandise inspected and return resolution finalized.',
  },
];

const ReturnTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [returnReq, setReturnReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReturn();
  }, [id]);

  const loadReturn = async () => {
    try {
      const res = await returnService.getReturn(id);
      setReturnReq(res.data || res);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load return tracking information.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading return details..." /></Layout>;

  if (error || !returnReq) {
    return (
      <Layout withSidebar>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <button onClick={() => navigate('/orders')} style={backBtnStyle}>← Back to Orders</button>
          <div style={{ padding: '1rem', background: '#fdf0ef', border: '1px solid #c0392b', borderRadius: '8px', color: '#c0392b', fontWeight: 700 }}>
            {error || 'Return request not found.'}
          </div>
        </div>
      </Layout>
    );
  }

  const status = returnReq.returnStatus || returnReq.return_status || 'requested';
  const isRejected = status === 'rejected';
  const currentStepIdx = RETURN_PIPELINE.findIndex((s) => s.key === status);
  const rmaCode = `PR3-RMA-${2000 + returnReq.id}`;
  const requestDate = new Date(returnReq.createdAt || returnReq.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const orderRef = returnReq.order?.order_number || returnReq.order?.orderNumber || `Order #${returnReq.order_id || returnReq.orderId}`;
  const returnItems = returnReq.return_items || returnReq.returnItems || [];

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <button onClick={() => navigate('/orders')} style={backBtnStyle}>
          ← Back to Orders
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.8rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6B27A', display: 'block', marginBottom: '0.4rem' }}>
            RETURN TRACKING & RMA STATUS
          </span>
          <h1 style={{ fontSize: '1.9rem', letterSpacing: '-0.03em', margin: 0 }}>
            {rmaCode}
          </h1>
          <p style={{ color: '#777', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            Filed on {requestDate} for <strong>{orderRef}</strong>
          </p>
        </div>

        {/* RMA Summary Card */}
        <div className="pr3-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.4rem' }}>
          <div>
            <div style={labelStyle}>RMA Authorization Number</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em', fontFamily: 'monospace', color: '#4A0F14' }}>
              {rmaCode}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={labelStyle}>Return Status</div>
            <span style={{
              display: 'inline-block',
              padding: '0.3rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: isRejected ? '#fdf0ef' : '#fff8f0',
              color: isRejected ? '#c0392b' : (status === 'completed' ? '#2d7a2d' : '#4A0F14'),
              border: `1.5px solid ${isRejected ? '#c0392b' : '#F6B27A'}`,
            }}>
              {isRejected ? 'Rejected' : status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Stepper Progress */}
        {!isRejected ? (
          <div className="pr3-card" style={{ marginBottom: '1.4rem', padding: '1.6rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Return Pipeline
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', position: 'relative' }}>
              {RETURN_PIPELINE.map((step, idx) => {
                const done = idx <= currentStepIdx;
                const active = idx === currentStepIdx;
                const future = idx > currentStepIdx;

                return (
                  <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* Connector line */}
                    {idx < RETURN_PIPELINE.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        width: '100%',
                        height: '3px',
                        background: idx < currentStepIdx ? '#4A0F14' : '#e8e0dc',
                        zIndex: 0,
                      }} />
                    )}

                    {/* Node Circle */}
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
                      {done ? (idx < currentStepIdx ? '✓' : step.icon) : step.icon}
                    </div>

                    <div style={{ fontSize: '0.72rem', fontWeight: active ? 900 : future ? 500 : 700, textAlign: 'center', color: active ? '#4A0F14' : future ? '#bbb' : '#555', lineHeight: 1.3, padding: '0 0.2rem' }}>
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Step Description */}
            {RETURN_PIPELINE[currentStepIdx] && (
              <div style={{ marginTop: '1.4rem', padding: '0.85rem 1rem', background: '#fff8f0', borderLeft: '3px solid #F6B27A', borderRadius: '0 6px 6px 0', fontSize: '0.88rem', color: '#555' }}>
                <strong style={{ color: '#4A0F14' }}>{RETURN_PIPELINE[currentStepIdx].label}:</strong> {RETURN_PIPELINE[currentStepIdx].desc}
              </div>
            )}
          </div>
        ) : (
          <div className="pr3-card" style={{ marginBottom: '1.4rem', padding: '1.4rem', background: '#fdf0ef', border: '1px solid #c0392b' }}>
            <strong style={{ color: '#c0392b' }}>⚠ Return Request Rejected</strong>
            <p style={{ marginTop: '0.5rem', color: '#555', fontSize: '0.9rem' }}>
              This return request could not be authorized. Please consult customer support or review our return criteria.
            </p>
          </div>
        )}

        {/* Return Reason Card */}
        <div className="pr3-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Return Reason
          </h3>
          <p style={{ color: '#333', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            {returnReq.reason || 'No specific reason provided.'}
          </p>
        </div>

        {/* Returned Items Card */}
        <div className="pr3-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Items Under Return
          </h3>
          {returnItems.length === 0 ? (
            <p style={{ color: '#888' }}>No line item details available.</p>
          ) : (
            <table className="pr3-table">
              <thead>
                <tr>
                  <th>Garment Item</th>
                  <th>Specification</th>
                  <th>Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item, idx) => {
                  const orderItem = item.order_item || item.OrderItem || {};
                  const variant = orderItem.product_variant || orderItem.ProductVariant || {};
                  const product = variant.product || variant.Product || {};
                  const name = product.name || `Returned Item #${idx + 1}`;
                  const spec = [variant.size, variant.color].filter(Boolean).join(' · ') || 'Standard';

                  return (
                    <tr key={item.id || idx}>
                      <td><strong>{name}</strong></td>
                      <td style={{ color: '#777', fontSize: '0.88rem' }}>{spec}</td>
                      <td style={{ fontWeight: 800 }}>{item.quantity} units</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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

export default ReturnTracking;

