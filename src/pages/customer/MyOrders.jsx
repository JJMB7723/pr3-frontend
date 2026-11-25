import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import orderService from '../../services/orderService';
import returnService from '../../services/returnService';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    setOrders([]);       // Clear stale orders immediately on user change
    setReturnsList([]);
    setLoading(true);
    loadOrdersAndReturns();
  }, [user?.id]);        // Re-fetch whenever a different user logs in

  const loadOrdersAndReturns = async () => {
    try {
      const [orderRes, returnRes] = await Promise.allSettled([
        orderService.getOrders(),
        returnService.getReturns(),
      ]);

      if (orderRes.status === 'fulfilled') {
        const res = orderRes.value;
        const items = Array.isArray(res.data) ? res.data : res.data?.rows || res.orders || [];
        setOrders(items);
      } else {
        setError('Unable to load order history.');
      }

      if (returnRes.status === 'fulfilled') {
        const retData = returnRes.value?.data || returnRes.value || [];
        setReturnsList(Array.isArray(retData) ? retData : []);
      }
    } catch {
      setError('Unable to load orders and returns.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await orderService.cancelOrder(orderId);
      setActionMsg(`Order #${orderId} was successfully cancelled.`);
      loadOrdersAndReturns();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading orders..." /></Layout>;

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          My Order History
        </h1>

        {actionMsg && (
          <div
            style={{
              padding: '0.8rem',
              border: '1px solid var(--color-black)',
              backgroundColor: 'var(--color-ivory)',
              marginBottom: '1.2rem',
              fontWeight: 600,
            }}
          >
            {actionMsg}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.8rem',
              border: '1px solid var(--color-black)',
              backgroundColor: 'var(--color-ivory)',
              marginBottom: '1.2rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="pr3-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontWeight: 600 }}>You haven't placed any orders yet.</p>
          </div>
        ) : (
          <table className="pr3-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const displayOrderNumber = o.orderNumber || o.order_number || `PR3-ORD-${1000 + o.id}`;
                const displayTotal = o.totalAmount || o.total_amount || 0;
                const displayStatus = o.orderStatus || o.order_status || o.status || 'pending';

                // Pick badge style by status
                let badgeClass = 'pr3-badge-sage';
                if (displayStatus === 'cancelled') badgeClass = 'pr3-badge-coral';
                if (displayStatus === 'pending') badgeClass = 'pr3-badge-gold';

                return (
                  <tr key={o.id}>
                    <td><strong>{displayOrderNumber}</strong></td>
                    <td>{new Date(o.createdAt || o.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`pr3-badge ${badgeClass}`}>{displayStatus}</span>
                    </td>
                    <td style={{ fontWeight: 800 }}>${parseFloat(displayTotal).toFixed(2)}</td>
                    <td>
                      <span className="pr3-badge pr3-badge-coral">{o.payment_status || 'PAID'}</span>
                    </td>
                    <td>
                      {['pending', 'processing'].includes(displayStatus.toLowerCase()) && (
                        <Button
                          variant="secondary"
                          onClick={() => handleCancel(o.id)}
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/orders/${o.id}/track`)}
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', marginLeft: '0.4rem', background: '#4A0F14', color: '#fff', border: 'none' }}
                      >
                        Track
                      </Button>
                      {displayStatus.toLowerCase() === 'delivered' && (() => {
                        const existingReturn = returnsList.find(
                          (r) => Number(r.order_id || r.orderId || r.order?.id) === Number(o.id)
                        );
                        if (existingReturn) {
                          return (
                            <Button
                              variant="secondary"
                              onClick={() => navigate(`/returns/${existingReturn.id}/track`)}
                              className="pr3-btn-track-return"
                              style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', marginLeft: '0.4rem' }}
                            >
                              Track Return
                            </Button>
                          );
                        }
                        return (
                          <Button
                            variant="secondary"
                            onClick={() => navigate(`/orders/${o.id}/return`)}
                            style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', marginLeft: '0.4rem' }}
                          >
                            Return
                          </Button>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default MyOrders;

