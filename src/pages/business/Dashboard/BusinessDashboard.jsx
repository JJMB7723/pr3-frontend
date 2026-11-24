import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import dashboardService from '../../../services/dashboardService';
import orderService from '../../../services/orderService';
import returnService from '../../../services/returnService';

const BusinessDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashRes, orderRes, returnRes] = await Promise.allSettled([
          dashboardService.getDashboard(),
          orderService.getOrders(),
          returnService.getReturns(),
        ]);

        if (dashRes.status === 'fulfilled') {
          const d = dashRes.value;
          setMetrics(d.data || d.metrics || d);
        }

        if (orderRes.status === 'fulfilled') {
          const o = orderRes.value;
          const orderList = Array.isArray(o.data) ? o.data : o.data?.rows || [];
          setOrders(orderList);
        }

        if (returnRes.status === 'fulfilled') {
          const r = returnRes.value?.data || returnRes.value || [];
          setReturnsList(Array.isArray(r) ? r : []);
        }
      } catch (err) {
        console.error('Failed to load business dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Layout withSidebar>
        <Loader message="Loading corporate dashboard..." />
      </Layout>
    );
  }

  const totalOrders = metrics?.metrics?.total_orders || orders.length || 0;
  const totalSpent = metrics?.metrics?.total_spent_lkr || 0;

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.4rem' }}>
              Corporate Procurement
            </span>
            <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Business Operations</h1>
            <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
              Manage commercial apparel contracts, bulk orders, and corporate fulfillment.
            </p>
          </div>
          <Link to="/business/bulk-orders">
            <Button variant="coral">+ Place Bulk Order</Button>
          </Link>
        </div>

        {/* Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-coral)' }}>
              Total Volume Orders
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.5rem' }}>
              {totalOrders}
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-sage)' }}>
              Procurement Expenditure
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.5rem' }}>
              ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-gold)' }}>
              Account Standing
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.5rem' }}>
              Tier-1 VIP
            </div>
          </div>
        </div>

        {/* Recent Corporate Orders */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <h3 style={{ fontSize: '1.3rem' }}>Recent Procurement Orders</h3>
            <Link to="/business/bulk-orders" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-coral)' }}>
              New Order →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="pr3-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>No bulk orders placed yet</h4>
              <p style={{ color: 'rgba(23, 23, 23, 0.65)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Use our bulk order tool to specify garments, sizes, and wholesale tier quantities.
              </p>
              <Link to="/business/bulk-orders">
                <Button variant="coral">Place First Bulk Order</Button>
              </Link>
            </div>
          ) : (
            <div className="pr3-table-wrapper">
              <table className="pr3-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const displayStatus = (o.orderStatus || o.order_status || o.status || 'pending').toLowerCase();
                    let badgeClass = 'pr3-badge-sage';
                    if (displayStatus === 'cancelled') badgeClass = 'pr3-badge-coral';
                    if (displayStatus === 'pending') badgeClass = 'pr3-badge-gold';

                    const existingClaim = returnsList.find(
                      (r) => Number(r.order_id || r.orderId || r.order?.id) === Number(o.id)
                    );

                    return (
                      <tr key={o.id}>
                        <td><strong>#{o.order_number || o.id}</strong></td>
                        <td>{new Date(o.createdAt || o.created_at).toLocaleDateString()}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.28rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: displayStatus === 'cancelled' ? '#fdf0ef'
                              : displayStatus === 'delivered' ? '#edf7ed'
                              : displayStatus === 'processing' ? '#fff3e0'
                              : '#fff8f0',
                            color: displayStatus === 'cancelled' ? '#c0392b'
                              : displayStatus === 'delivered' ? '#2d7a2d'
                              : displayStatus === 'processing' ? '#e65100'
                              : '#8a6000',
                            border: displayStatus === 'cancelled' ? '1.5px solid #e57373'
                              : displayStatus === 'delivered' ? '1.5px solid #81c784'
                              : displayStatus === 'processing' ? '1.5px solid #ffb74d'
                              : '1.5px solid #ffc107',
                          }}>
                            {displayStatus}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800 }}>${parseFloat(o.total_amount || o.totalAmount || 0).toFixed(2)}</td>
                        <td>
                          <span className="pr3-badge pr3-badge-coral">{o.payment_status || 'PENDING'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <Button
                              variant="primary"
                              onClick={() => navigate(`/orders/${o.id}/track`)}
                              style={{ padding: '0.32rem 0.7rem', fontSize: '0.75rem', background: '#4A0F14', color: '#fff', border: 'none' }}
                            >
                              Track
                            </Button>
                            {displayStatus === 'delivered' && (
                              existingClaim ? (
                                <Button
                                  variant="secondary"
                                  onClick={() => navigate(`/returns/${existingClaim.id}/track`)}
                                  className="pr3-btn-track-return"
                                  style={{ padding: '0.32rem 0.7rem', fontSize: '0.75rem' }}
                                >
                                  Track Claim
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  onClick={() => navigate(`/orders/${o.id}/return`)}
                                  style={{ padding: '0.32rem 0.7rem', fontSize: '0.75rem' }}
                                >
                                  Return / Exchange
                                </Button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BusinessDashboard;
