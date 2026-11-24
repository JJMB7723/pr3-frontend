import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import deliveryService from '../../../services/deliveryService';

const AdminDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const res = await deliveryService.getDeliveries();
      const items = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setDeliveries(items);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, newStatus) => {
    try {
      await deliveryService.updateStatus(id, newStatus);
      setMsg({
        text: `Shipment #${id} transit status updated to '${newStatus}'. Order state synchronized.`,
        type: 'success',
      });
      loadDeliveries();
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Failed to update delivery transit status.',
        type: 'error',
      });
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading fulfillment shipments..." /></Layout>;

  // Metrics
  const totalShipments = deliveries.length;
  const inTransitCount = deliveries.filter(
    (d) => (d.deliveryStatus || d.delivery_status) === 'in_transit'
  ).length;
  const deliveredCount = deliveries.filter(
    (d) => (d.deliveryStatus || d.delivery_status) === 'delivered'
  ).length;
  const pendingDispatchCount = deliveries.filter((d) => {
    const s = d.deliveryStatus || d.delivery_status;
    return s === 'assigned' || s === 'picked_up';
  }).length;

  // Filter
  const filteredDeliveries = deliveries.filter((d) => {
    const orderNum = (d.order?.orderNumber || d.order?.order_number || `PR3-ORD-${1000 + (d.orderId || d.order_id)}`).toLowerCase();
    const tracking = (d.trackingNumber || d.tracking_number || '').toLowerCase();
    const customer = (
      d.order?.user
        ? `${d.order.user.firstName || ''} ${d.order.user.lastName || ''}`
        : d.order?.shippingName || d.order?.shipping_name || ''
    ).toLowerCase();
    const city = (d.order?.shippingCity || d.order?.shipping_city || '').toLowerCase();
    const currentStatus = (d.deliveryStatus || d.delivery_status || '').toLowerCase();

    const q = search.toLowerCase();
    const matchesSearch = !q || orderNum.includes(q) || tracking.includes(q) || customer.includes(q) || city.includes(q);
    const matchesStatus = !statusFilter || currentStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.4rem' }}>
            Carrier &amp; Fulfillment Logistics
          </span>
          <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Dispatch &amp; Deliveries</h1>
          <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
            Real-time courier dispatch tracking, delivery confirmation, and automated order status synchronization.
          </p>
        </div>

        {/* Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(23, 23, 23, 0.6)' }}>
              Total Shipments
            </span>
            <div style={{ fontSize: '2.3rem', fontWeight: 900, marginTop: '0.5rem' }}>
              {totalShipments}
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-sage)' }}>
              Delivered
            </span>
            <div style={{ fontSize: '2.3rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--color-sage)' }}>
              {deliveredCount}
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-gold)' }}>
              In Transit
            </span>
            <div style={{ fontSize: '2.3rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--color-gold)' }}>
              {inTransitCount}
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-coral)' }}>
              Pending Dispatch
            </span>
            <div style={{ fontSize: '2.3rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--color-coral)' }}>
              {pendingDispatchCount}
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {msg.text && (
          <div
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)'}`,
              backgroundColor: msg.type === 'error' ? 'var(--color-coral-light)' : 'var(--color-sage-light)',
              color: msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)',
              marginBottom: '1.8rem',
              fontWeight: 700,
            }}
          >
            ✓ {msg.text}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid rgba(23, 23, 23, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.4rem',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: '1 1 280px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tracking code, order number, customer, or city..."
              className="pr3-input"
            />
          </div>

          <div style={{ flex: '0 1 200px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pr3-input"
              style={{ fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="">All Transit States</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {(search || statusFilter) && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.82rem' }}
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Deliveries Data Table */}
        <div className="pr3-table-wrapper">
          <table className="pr3-table">
            <thead>
              <tr>
                <th>Tracking Code</th>
                <th>Order Number</th>
                <th>Customer &amp; Destination</th>
                <th>Purchased Items</th>
                <th>Transit Status</th>
                <th>Update Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.map((d) => {
                const tracking = d.trackingNumber || d.tracking_number || `TRK-PR3-${d.id}`;
                const orderNum = d.order?.orderNumber || d.order?.order_number || `PR3-ORD-${1000 + (d.orderId || d.order_id)}`;
                const currentStatus = d.deliveryStatus || d.delivery_status || 'assigned';
                const customerName = d.order?.user
                  ? `${d.order.user.firstName || ''} ${d.order.user.lastName || ''}`.trim()
                  : d.order?.shippingName || d.order?.shipping_name || 'Customer';
                const customerCity = d.order?.shippingCity || d.order?.shipping_city || 'City';
                const items = d.order?.order_items || [];

                let badgeClass = 'pr3-badge-sage';
                if (currentStatus === 'failed') badgeClass = 'pr3-badge-coral';
                if (currentStatus === 'in_transit') badgeClass = 'pr3-badge-gold';
                if (currentStatus === 'assigned' || currentStatus === 'picked_up') {
                  badgeClass = 'pr3-badge-coral';
                }

                return (
                  <tr key={d.id}>
                    <td>
                      <code
                        style={{
                          backgroundColor: 'rgba(23, 23, 23, 0.05)',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {tracking}
                      </code>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--color-black)' }}>
                        {orderNum}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{customerName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                        📍 {customerCity}
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
                        <span style={{ fontSize: '0.82rem', color: 'rgba(23, 23, 23, 0.5)' }}>1 item</span>
                      )}
                    </td>
                    <td>
                      <span className={`pr3-badge ${badgeClass}`}>{currentStatus.toUpperCase()}</span>
                    </td>
                    <td>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleUpdate(d.id, e.target.value)}
                        className="pr3-input"
                        style={{
                          width: 'auto',
                          padding: '0.45rem 0.8rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="assigned">assigned</option>
                        <option value="picked_up">picked_up</option>
                        <option value="in_transit">in_transit</option>
                        <option value="delivered">delivered</option>
                        <option value="failed">failed</option>
                      </select>
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedDelivery(d)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.78rem',
                        }}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal: Complete Delivery & Destination Details */}
        <Modal
          isOpen={!!selectedDelivery}
          title={`Delivery Tracking: ${selectedDelivery?.trackingNumber || selectedDelivery?.tracking_number || ''}`}
          onClose={() => setSelectedDelivery(null)}
          maxWidth="640px"
        >
          {selectedDelivery && (
            <div>
              {/* Status Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(23, 23, 23, 0.08)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Associated Order
                  </span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                    {selectedDelivery.order?.orderNumber || selectedDelivery.order?.order_number || `PR3-ORD-${1000 + selectedDelivery.orderId}`}
                  </div>
                </div>
                <div>
                  <span className="pr3-badge pr3-badge-sage" style={{ fontSize: '0.85rem' }}>
                    {(selectedDelivery.deliveryStatus || selectedDelivery.delivery_status || '').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Recipient & Shipping Address */}
              <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(23, 23, 23, 0.03)', borderRadius: 'var(--radius-md)' }}>
                <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.6rem' }}>
                  Shipping Destination
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Recipient Name
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {selectedDelivery.order?.user
                        ? `${selectedDelivery.order.user.firstName || ''} ${selectedDelivery.order.user.lastName || ''}`
                        : selectedDelivery.order?.shippingName || selectedDelivery.order?.shipping_name}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Contact Phone
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {selectedDelivery.order?.shippingPhone || selectedDelivery.order?.shipping_phone || selectedDelivery.order?.user?.phone || 'Not specified'}
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Street Address &amp; Region
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '0.2rem' }}>
                      {selectedDelivery.order?.shippingAddress || selectedDelivery.order?.shipping_address || 'Address on file'},{' '}
                      {selectedDelivery.order?.shippingCity || selectedDelivery.order?.shipping_city || ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipment Timestamps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="pr3-card" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Dispatch / Assigned At
                  </span>
                  <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '0.9rem' }}>
                    {selectedDelivery.assignedAt || selectedDelivery.assigned_at
                      ? new Date(selectedDelivery.assignedAt || selectedDelivery.assigned_at).toLocaleString()
                      : 'Pending'}
                  </div>
                </div>

                <div className="pr3-card" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Delivered At
                  </span>
                  <div style={{ fontWeight: 700, marginTop: '0.3rem', fontSize: '0.9rem', color: 'var(--color-sage)' }}>
                    {selectedDelivery.deliveredAt || selectedDelivery.delivered_at
                      ? new Date(selectedDelivery.deliveredAt || selectedDelivery.delivered_at).toLocaleString()
                      : 'Not yet delivered'}
                  </div>
                </div>
              </div>

              {/* Items in Delivery */}
              <div>
                <span className="pr3-badge" style={{ marginBottom: '0.6rem' }}>
                  Package Contents
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {(selectedDelivery.order?.order_items || []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.8rem 1rem',
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid rgba(23, 23, 23, 0.08)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.92rem' }}>
                          {item.product_variant?.product?.name || 'Garment'}
                        </strong>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                          Size: {item.product_variant?.size} · Color: {item.product_variant?.color}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default AdminDeliveries;
