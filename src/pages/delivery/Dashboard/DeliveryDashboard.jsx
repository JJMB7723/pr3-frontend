import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import deliveryService from '../../../services/deliveryService';

const DeliveryDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

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

  const handleUpdate = async (id, status) => {
    try {
      await deliveryService.updateStatus(id, status);
      setMsg(`Shipment #${id} marked as ${status}.`);
      loadDeliveries();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Update failed.');
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading assigned dispatches..." /></Layout>;

  return (
    <Layout withSidebar>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>Courier &amp; Delivery Console</h1>
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Assigned delivery routes and recipient package confirmation</p>
      </div>

      {msg && (
        <div style={{ padding: '0.8rem', border: '1px solid var(--color-black)', backgroundColor: 'var(--color-ivory)', marginBottom: '1rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="pr3-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontWeight: 600 }}>No deliveries assigned at this time.</p>
        </div>
      ) : (
        <table className="pr3-table">
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>Order ID</th>
              <th>Tracking Number</th>
              <th>Status</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td><strong>#{d.id}</strong></td>
                <td>Order #{d.order_id}</td>
                <td>{d.tracking_number || 'N/A'}</td>
                <td>
                  <span className="pr3-badge">{d.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {d.status !== 'delivered' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdate(d.id, 'delivered')}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Confirm Delivery
                      </Button>
                    )}
                    {d.status === 'pending' && (
                      <Button
                        variant="secondary"
                        onClick={() => handleUpdate(d.id, 'in_transit')}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Start Transit
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
};

export default DeliveryDashboard;
