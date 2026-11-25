import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import orderService from '../../../services/orderService';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await orderService.getOrders();
      const items = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setOrders(items);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      setMsg(`Order #${orderId} status set to ${newStatus}.`);
      loadOrders();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading orders..." /></Layout>;

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.4rem' }}>
              Operations &amp; Fulfillment
            </span>
            <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Customer &amp; Bulk Orders</h1>
            <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
              Review retail customer and corporate wholesale orders, inspect purchased garments, and manage fulfillment.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={loadOrders}
            style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem' }}
          >
            ↻ Refresh Orders
          </Button>
        </div>

        {msg && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-sage)',
              backgroundColor: 'var(--color-sage-light)',
              color: 'var(--color-sage)',
              marginBottom: '1.5rem',
              fontWeight: 700,
            }}
          >
            ✓ {msg}
          </div>
        )}

        <div className="pr3-table-wrapper">
          <table className="pr3-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer Name &amp; Email</th>
                <th>Purchased Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>No orders found</div>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>Customer and wholesale orders will appear here once placed.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const displayOrderNumber = o.orderNumber || o.order_number || `PR3-ORD-${1000 + o.id}`;
                  const displayTotal = o.totalAmount || o.total_amount || 0;
                  const displayStatus = o.orderStatus || o.order_status || o.status || 'pending';

                  // Customer identity details
                  const customerName =
                    o.user
                      ? `${o.user.firstName || o.user.first_name || ''} ${o.user.lastName || o.user.last_name || ''}`.trim()
                      : o.shippingName || o.shipping_name || `Customer #${o.user_id || o.userId}`;
                  const customerEmail = o.user?.email || 'N/A';
                  const userRole = o.user?.role || 'customer';
                  const itemsCount = o.order_items ? o.order_items.length : 0;
                  const totalUnits = o.order_items
                    ? o.order_items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0)
                    : 0;
                  const isBulkOrder = totalUnits >= 10 || userRole === 'business';

                  let badgeClass = 'pr3-badge-sage';
                  if (displayStatus === 'cancelled') badgeClass = 'pr3-badge-coral';
                  if (displayStatus === 'pending') badgeClass = 'pr3-badge-gold';

                  return (
                    <tr key={o.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--color-black)' }}>
                            {displayOrderNumber}
                          </strong>
                          {isBulkOrder && (
                            <span
                              className="pr3-badge pr3-badge-coral"
                              style={{ fontSize: '0.68rem', fontWeight: 800, alignSelf: 'flex-start' }}
                            >
                              WHOLESALE BULK ({totalUnits} units)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800 }}>{customerName}</span>
                          {userRole === 'business' && (
                            <span
                              className="pr3-badge"
                              style={{
                                fontSize: '0.65rem',
                                backgroundColor: 'rgba(23, 23, 23, 0.08)',
                                textTransform: 'uppercase',
                              }}
                            >
                              Business
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                          {customerEmail}
                        </div>
                      </td>
                      <td>
                        {itemsCount > 0 ? (
                          <div>
                            {o.order_items.slice(0, 2).map((item) => (
                              <div key={item.id} style={{ fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 700 }}>
                                  {item.product_variant?.product?.name || 'Garment'}
                                </span>{' '}
                                <span style={{ color: 'rgba(23, 23, 23, 0.6)' }}>
                                  ({item.product_variant?.size} · {item.product_variant?.color})
                                </span>{' '}
                                × <strong>{item.quantity}</strong>
                              </div>
                            ))}
                            {itemsCount > 2 && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-coral)', fontWeight: 700 }}>
                                +{itemsCount - 2} more item(s)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: 'rgba(23, 23, 23, 0.5)' }}>1 item</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 900, color: 'var(--color-coral)', fontSize: '1rem' }}>
                        ${parseFloat(displayTotal).toFixed(2)}
                      </td>
                      <td>
                        <span className={`pr3-badge ${badgeClass}`}>{displayStatus}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          <select
                            value={displayStatus}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className="pr3-input"
                            style={{
                              width: 'auto',
                              padding: '0.45rem 0.8rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <option value="pending">pending</option>
                            <option value="confirmed">confirmed</option>
                            <option value="processing">processing</option>
                            <option value="shipped">shipped</option>
                            <option value="delivered">delivered</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedOrder(o)}
                            style={{
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.78rem',
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Complete Customer & Order Item Details */}
        <Modal
          isOpen={!!selectedOrder}
          title={`Order Details: ${selectedOrder?.orderNumber || selectedOrder?.order_number || ''}`}
          onClose={() => setSelectedOrder(null)}
          maxWidth="640px"
        >
          {selectedOrder && (
            <div>
              {/* Customer Information Section */}
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(23, 23, 23, 0.08)', paddingBottom: '1rem' }}>
                <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.5rem' }}>
                  Customer Profile
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Full Name
                    </span>
                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>
                      {selectedOrder.user
                        ? `${selectedOrder.user.firstName || ''} ${selectedOrder.user.lastName || ''}`.trim()
                        : selectedOrder.shippingName || selectedOrder.shipping_name}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Email Address
                    </span>
                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>
                      {selectedOrder.user?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Contact Phone
                    </span>
                    <p style={{ fontWeight: 700 }}>
                      {selectedOrder.shippingPhone || selectedOrder.shipping_phone || selectedOrder.user?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Account Role
                    </span>
                    <p style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                      {selectedOrder.user?.role || 'Customer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(23, 23, 23, 0.08)', paddingBottom: '1rem' }}>
                <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.5rem' }}>
                  Delivery Destination
                </span>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.4rem' }}>
                  {selectedOrder.shippingAddress || selectedOrder.shipping_address}
                </p>
                <p style={{ fontSize: '0.88rem', color: 'rgba(23, 23, 23, 0.7)' }}>
                  {selectedOrder.shippingCity || selectedOrder.shipping_city},{' '}
                  {selectedOrder.shippingState || selectedOrder.shipping_state}{' '}
                  {selectedOrder.shippingPostalCode || selectedOrder.shipping_postal_code}
                </p>
              </div>

              {/* Purchased Products */}
              <div>
                <span className="pr3-badge pr3-badge-gold" style={{ marginBottom: '0.6rem' }}>
                  Purchased Garments
                </span>
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    selectedOrder.order_items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.8rem 1rem',
                          backgroundColor: 'rgba(23, 23, 23, 0.03)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.95rem' }}>
                            {item.product_variant?.product?.name || 'Apparel Item'}
                          </strong>
                          <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                            SKU: {item.product_variant?.sku} · Size: {item.product_variant?.size} · Color: {item.product_variant?.color}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                            Qty: {item.quantity} × ${parseFloat(item.unitPrice || item.unit_price || 0).toFixed(2)}
                          </span>
                          <div style={{ fontWeight: 900, color: 'var(--color-coral)' }}>
                            ${parseFloat(item.subtotal || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(23, 23, 23, 0.6)' }}>Standard batch fulfillment item</p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderTop: '2px solid rgba(23, 23, 23, 0.08)',
                    paddingTop: '1.2rem',
                    marginTop: '1.2rem',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>Grand Total</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-coral)' }}>
                    ${parseFloat(selectedOrder.totalAmount || selectedOrder.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default AdminOrders;
