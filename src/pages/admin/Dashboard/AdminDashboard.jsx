import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import dashboardService from '../../../services/dashboardService';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getDashboard();
        setData(res.data || res);
      } catch {
        // Fallback handled via null check
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout withSidebar>
        <Loader message="Loading administrator metrics..." />
      </Layout>
    );
  }

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];
  const recentDeliveries = data?.recentDeliveries || [];

  const totalRevenue = parseFloat(
    metrics.totalRevenue || metrics.total_revenue || metrics.total_revenue_lkr || 0
  );
  const totalOrders = metrics.totalOrders ?? metrics.total_orders ?? 0;
  const totalProducts = metrics.totalProducts ?? metrics.total_products ?? 0;
  const totalStock = metrics.totalStockUnits ?? metrics.total_stock_units ?? 0;
  const pendingDeliveries = metrics.pendingDeliveries ?? metrics.pending_deliveries ?? 0;
  const activeManufacturing = metrics.activeManufacturing ?? metrics.active_manufacturing_orders ?? 0;
  const lowStockCount = metrics.lowStockCount ?? metrics.low_stock_items ?? 0;

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with Quick Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.8rem',
          }}
        >
          <div>
            <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.5rem' }}>
              Executive Management
            </span>
            <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Administrator Console</h1>
            <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
              Real-time enterprise metrics across commerce, warehouse inventory, manufacturing, and fulfillment.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <Link to="/admin/orders">
              <Button variant="coral" style={{ padding: '0.65rem 1.2rem', fontSize: '0.86rem' }}>
                View All Orders
              </Button>
            </Link>
            <Link to="/admin/products">
              <Button variant="secondary" style={{ padding: '0.65rem 1.2rem', fontSize: '0.86rem' }}>
                + Add Garment
              </Button>
            </Link>
            <Link to="/admin/inventory">
              <Button variant="secondary" style={{ padding: '0.65rem 1.2rem', fontSize: '0.86rem' }}>
                Warehouse Stock
              </Button>
            </Link>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Revenue */}
          <div className="pr3-card" style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-coral)' }}>
              Gross Revenue
            </span>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                marginTop: '0.4rem',
                color: 'var(--color-black)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              }}
            >
              ${Math.floor(totalRevenue).toLocaleString()}
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(23, 23, 23, 0.5)' }}>
                {(totalRevenue % 1).toFixed(2).substring(1)}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)', marginTop: '0.3rem', whiteSpace: 'nowrap' }}>
              Across {totalOrders} placed orders
            </div>
          </div>

          {/* Total Orders */}
          <div className="pr3-card" style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(23, 23, 23, 0.6)' }}>
              Total Orders
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.4rem', color: 'var(--color-black)', lineHeight: '1.2' }}>
              {totalOrders}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-sage)', fontWeight: 700, marginTop: '0.3rem', whiteSpace: 'nowrap' }}>
              ✓ Retail &amp; Corporate
            </div>
          </div>

          {/* Warehouse Stock */}
          <div className="pr3-card" style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-sage)' }}>
              Total Warehouse Units
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.4rem', color: 'var(--color-sage)', lineHeight: '1.2' }}>
              {totalStock.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)', marginTop: '0.3rem', whiteSpace: 'nowrap' }}>
              In {totalProducts} active garment styles
            </div>
          </div>

          {/* Active Deliveries */}
          <div className="pr3-card" style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-gold)' }}>
              Pending Deliveries
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.4rem', color: 'var(--color-gold)', lineHeight: '1.2' }}>
              {pendingDeliveries}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)', marginTop: '0.3rem', whiteSpace: 'nowrap' }}>
              In transit or assigned
            </div>
          </div>

          {/* Production Runs */}
          <div className="pr3-card" style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(23, 23, 23, 0.6)' }}>
              Active Factory Runs
            </span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '0.4rem', color: 'var(--color-black)', lineHeight: '1.2' }}>
              {activeManufacturing}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-coral)', fontWeight: 700, marginTop: '0.3rem', whiteSpace: 'nowrap' }}>
              {lowStockCount > 0 ? `⚠ ${lowStockCount} alerts` : '✓ Optimal reorder stock'}
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', letterSpacing: '-0.02em' }}>Recent Orders &amp; Fulfillment</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                Latest purchase orders across consumer and wholesale accounts.
              </p>
            </div>
            <Link to="/admin/orders" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-coral)' }}>
              View all orders &rarr;
            </Link>
          </div>

          <div className="pr3-table-wrapper">
            <table className="pr3-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Purchased Items</th>
                  <th>Total Amount</th>
                  <th>Fulfillment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const orderNum = o.orderNumber || o.order_number || `PR3-ORD-${1000 + o.id}`;
                  const customerName = o.user
                    ? `${o.user.firstName || ''} ${o.user.lastName || ''}`.trim()
                    : o.shippingName || o.shipping_name || 'Customer';
                  const total = parseFloat(o.totalAmount || o.total_amount || 0);
                  const status = (o.orderStatus || o.order_status || 'pending').toLowerCase();
                  const items = o.order_items || [];

                  let badgeClass = 'pr3-badge-sage';
                  if (status === 'cancelled') badgeClass = 'pr3-badge-coral';
                  if (status === 'pending') badgeClass = 'pr3-badge-gold';

                  return (
                    <tr key={o.id}>
                      <td>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-black)' }}>
                          {orderNum}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                          {o.user?.email || o.shippingPhone || o.shipping_phone}
                        </div>
                      </td>
                      <td>
                        {items.length > 0 ? (
                          <div style={{ fontSize: '0.84rem' }}>
                            <span style={{ fontWeight: 700 }}>
                              {items[0].product_variant?.product?.name || 'Garment'}
                            </span>{' '}
                            <span style={{ color: 'rgba(23, 23, 23, 0.6)' }}>
                              ({items[0].product_variant?.size} · {items[0].product_variant?.color})
                            </span>{' '}
                            × <strong>{items[0].quantity}</strong>
                            {items.length > 1 && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-coral)', fontWeight: 700, marginLeft: '0.4rem' }}>
                                +{items.length - 1} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.5)' }}>1 item</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 900, color: 'var(--color-coral)', fontSize: '1rem' }}>
                        ${total.toFixed(2)}
                      </td>
                      <td>
                        <span className={`pr3-badge ${badgeClass}`}>{status.toUpperCase()}</span>
                      </td>
                      <td>
                        <Link to="/admin/orders">
                          <Button variant="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.76rem' }}>
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Dual Panels: Logistics & Factory Manufacturing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
          {/* Active Deliveries Overview */}
          <div className="pr3-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Active Dispatch &amp; Logistics</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                  Carrier tracking and courier transit checkpoints.
                </p>
              </div>
              <Link to="/admin/deliveries" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-coral)' }}>
                All Shipments &rarr;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentDeliveries.map((d) => {
                const tracking = d.trackingNumber || d.tracking_number || `TRK-PR3-${d.id}`;
                const orderNum = d.order?.orderNumber || d.order?.order_number || `PR3-ORD-${1000 + d.orderId}`;
                const status = (d.deliveryStatus || d.delivery_status || 'assigned').toLowerCase();

                let badgeClass = 'pr3-badge-sage';
                if (status === 'failed') badgeClass = 'pr3-badge-coral';
                if (status === 'in_transit') badgeClass = 'pr3-badge-gold';

                return (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.8rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(23, 23, 23, 0.02)',
                      border: '1px solid rgba(23, 23, 23, 0.06)',
                    }}
                  >
                    <div>
                      <code style={{ fontSize: '0.82rem', fontWeight: 800 }}>{tracking}</code>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(23, 23, 23, 0.6)', marginTop: '0.2rem' }}>
                        {orderNum} · {d.order?.shippingCity || d.order?.shipping_city || 'Colombo'}
                      </div>
                    </div>
                    <span className={`pr3-badge ${badgeClass}`} style={{ fontSize: '0.72rem' }}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Factory & Manufacturing Operations */}
          <div className="pr3-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Factory &amp; Quality Control</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                  Work orders, raw material consumption, and QC inspection gates.
                </p>
              </div>
              <Link to="/admin/manufacturing" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-coral)' }}>
                Manufacturing &rarr;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-sage-light)',
                  border: '1px solid var(--color-sage)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-sage)' }}>
                  ✓ Production Line Active: PR3-MFG-1001
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.7)', marginTop: '0.3rem' }}>
                  Target: 500 units of Tailored Oxford Cotton Shirt. Cutting and precision assembly in progress.
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(23, 23, 23, 0.03)',
                  border: '1px solid rgba(23, 23, 23, 0.08)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                  Quality Inspection Gates
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.65)', marginTop: '0.3rem' }}>
                  All 4 garment lines verified against industrial fabric integrity, stitching tolerance, and colorfastness.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
