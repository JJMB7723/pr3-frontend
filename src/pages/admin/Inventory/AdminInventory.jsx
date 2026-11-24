import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import inventoryService from '../../../services/inventoryService';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    product_variant_id: '',
    quantity: '',
    type: 'RESTOCK',
    reason: '',
  });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const res = await inventoryService.getInventory();
      const items = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setInventory(items);
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (item = null) => {
    if (item) {
      setSelectedItemForAdjust(item);
      const variantId = item.product_variant_id || item.productVariantId || item.variant?.id || item.id;
      setFormData({
        product_variant_id: variantId,
        quantity: '',
        type: 'RESTOCK',
        reason: '',
      });
    } else {
      setSelectedItemForAdjust(null);
      setFormData({ product_variant_id: '', quantity: '', type: 'RESTOCK', reason: '' });
    }
    setModalOpen(true);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      let adjustmentQty = parseInt(formData.quantity, 10);
      if (formData.type === 'DAMAGE' && adjustmentQty > 0) {
        adjustmentQty = -adjustmentQty;
      }
      await inventoryService.adjustStock({
        product_variant_id: parseInt(formData.product_variant_id, 10),
        quantity: adjustmentQty,
        type: formData.type,
        reason: formData.reason,
      });
      setMsg({ text: 'Stock level updated and logged in warehouse movements successfully.', type: 'success' });
      setModalOpen(false);
      setFormData({ product_variant_id: '', quantity: '', type: 'RESTOCK', reason: '' });
      loadInventory();
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Stock adjustment failed. Please check your inputs.',
        type: 'error',
      });
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading warehouse inventory..." /></Layout>;

  // Metrics
  const totalUnits = inventory.reduce((sum, item) => sum + parseInt(item.quantity || 0, 10), 0);
  const lowStockCount = inventory.filter((item) => (item.quantity || 0) < 50).length;

  // Filter logic
  const filteredInventory = inventory.filter((item) => {
    const v = item.variant || item.product_variant || {};
    const p = v.product || {};
    const c = p.category?.name || '';
    const qText = `${p.name || ''} ${v.sku || ''} ${v.size || ''} ${v.color || ''}`.toLowerCase();

    const matchesSearch = search ? qText.includes(search.toLowerCase()) : true;
    const matchesCat = categoryFilter ? c.toLowerCase() === categoryFilter.toLowerCase() : true;
    return matchesSearch && matchesCat;
  });

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.4rem' }}>
              Factory &amp; Warehousing
            </span>
            <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Inventory Management</h1>
            <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
              Real-time garment stock quantities, SKU variants, and audit movement controls.
            </p>
          </div>
          <Button variant="coral" onClick={() => openAdjustModal()}>
            + Adjust Stock
          </Button>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-sage)' }}>
              Total Stock On Hand
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.6rem' }}>
              {totalUnits.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(23, 23, 23, 0.6)' }}>units</span>
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-coral)' }}>
              Active SKUs / Variants
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.6rem' }}>
              {inventory.length}
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-gold)' }}>
              Low Stock Warnings
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '0.6rem' }}>
              {lowStockCount}
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

        {/* Filter & Search Bar */}
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
              placeholder="Search by product name, SKU, color or size..."
              className="pr3-input"
            />
          </div>

          <div style={{ flex: '0 1 200px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pr3-input"
              style={{ fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="">All Categories</option>
              <option value="Shirt">Shirt</option>
              <option value="Pant">Pant</option>
              <option value="Jersey">Jersey</option>
              <option value="Shorts">Shorts</option>
            </select>
          </div>

          {(search || categoryFilter) && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
              }}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.82rem' }}
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Inventory Data Table */}
        <div className="pr3-table-wrapper">
          <table className="pr3-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Garment Name</th>
                <th>Category</th>
                <th>Variant Spec</th>
                <th>Available Stock</th>
                <th>Inventory Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                // Read from variant association correctly
                const v = item.variant || item.product_variant || {};
                const p = v.product || {};
                const cat = p.category?.name || 'Apparel';
                const qty = item.quantity !== undefined ? item.quantity : 0;
                const sku = v.sku || `SKU-VAR-${item.id}`;
                const size = v.size || 'STD';
                const color = v.color || 'Standard';

                // Status Pill
                let statusBadge = (
                  <span className="pr3-badge pr3-badge-sage">OPTIMAL</span>
                );
                if (qty <= 0) {
                  statusBadge = <span className="pr3-badge pr3-badge-coral">OUT OF STOCK</span>;
                } else if (qty < 50) {
                  statusBadge = <span className="pr3-badge pr3-badge-gold">LOW STOCK</span>;
                }

                return (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--color-black)' }}>{sku}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.name || 'Tailored Garment'}</div>
                    </td>
                    <td>
                      <span className="pr3-badge" style={{ backgroundColor: 'rgba(23, 23, 23, 0.04)' }}>
                        {cat}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                        {size} <span style={{ opacity: 0.35 }}>·</span> {color}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-black)' }}>
                        {qty.toLocaleString()}
                      </div>
                    </td>
                    <td>{statusBadge}</td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={() => openAdjustModal(item)}
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
                      >
                        Adjust
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal: Stock Adjustment */}
        <Modal
          isOpen={modalOpen}
          title={selectedItemForAdjust ? `Adjust Stock: ${selectedItemForAdjust.variant?.sku || ''}` : 'Manual Stock Adjustment'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleAdjust}>
            {selectedItemForAdjust ? (
              <div style={{ marginBottom: '1.4rem', padding: '1rem', backgroundColor: 'rgba(23, 23, 23, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>
                  {selectedItemForAdjust.variant?.product?.name}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                  SKU: {selectedItemForAdjust.variant?.sku} · Size: {selectedItemForAdjust.variant?.size} · Current: {selectedItemForAdjust.quantity} units
                </span>
              </div>
            ) : (
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Select Garment Variant *
                </label>
                <select
                  name="product_variant_id"
                  value={formData.product_variant_id}
                  onChange={(e) => setFormData((p) => ({ ...p, product_variant_id: e.target.value }))}
                  className="pr3-input"
                  style={{ fontWeight: 600, cursor: 'pointer' }}
                  required
                >
                  <option value="">Select Variant...</option>
                  {inventory.map((inv) => {
                    const v = inv.variant || {};
                    return (
                      <option key={inv.id} value={v.id || inv.product_variant_id || inv.id}>
                        {v.product?.name} - {v.size} ({v.color}) - SKU: {v.sku} (Current: {inv.quantity})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Adjustment Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                className="pr3-input"
                style={{ fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="RESTOCK">RESTOCK (+) Factory Arrival</option>
                <option value="DAMAGE">DAMAGE (-) Damaged Fabric / Write-off</option>
                <option value="AUDIT">AUDIT Physical Cycle Count</option>
              </select>
            </div>

            <Input
              label="Quantity To Adjust"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
              placeholder="e.g. 100 or 500"
              required
            />

            <Input
              label="Audit Reason / Verification Note"
              name="reason"
              value={formData.reason}
              onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Batch received from cutting line #3"
              required
            />

            <Button type="submit" variant="coral" style={{ width: '100%', marginTop: '1.2rem', padding: '0.95rem' }}>
              Commit Stock Adjustment
            </Button>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default AdminInventory;
