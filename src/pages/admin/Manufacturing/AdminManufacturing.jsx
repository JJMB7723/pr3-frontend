import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import manufacturingService from '../../../services/manufacturingService';
import productService from '../../../services/productService';
import { getProductImage } from '../../../assets/apparelImages';

const AdminManufacturing = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [createForm, setCreateForm] = useState({
    product_id: '',
    product_variant_id: '',
    target_quantity: 500,
    completion_date: '',
    notes: '',
  });

  // Details Modal state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mfgRes, prodRes] = await Promise.all([
        manufacturingService.getOrders(),
        productService.getProducts({ limit: 100 }),
      ]);
      const items = Array.isArray(mfgRes.data) ? mfgRes.data : mfgRes.data?.rows || [];
      setOrders(items);

      const prods = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.rows || [];
      setProducts(prods);

      if (prods.length > 0) {
        setSelectedProduct(prods[0]);
        if (prods[0].variants && prods[0].variants.length > 0) {
          setSelectedVariant(prods[0].variants[0]);
          setCreateForm((p) => ({
            ...p,
            product_id: prods[0].id,
            product_variant_id: prods[0].variants[0].id,
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (prodId) => {
    const prod = products.find((p) => p.id === parseInt(prodId, 10));
    setSelectedProduct(prod || null);
    if (prod && prod.variants && prod.variants.length > 0) {
      setSelectedVariant(prod.variants[0]);
      setCreateForm((p) => ({
        ...p,
        product_id: prod.id,
        product_variant_id: prod.variants[0].id,
      }));
    } else {
      setSelectedVariant(null);
      setCreateForm((p) => ({
        ...p,
        product_id: prod?.id || '',
        product_variant_id: '',
      }));
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!createForm.product_id || !createForm.product_variant_id) {
      setMsg({ text: 'Please select a garment product and variant specification.', type: 'error' });
      return;
    }
    const qty = parseInt(createForm.target_quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setMsg({ text: 'Target quantity must be greater than zero.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await manufacturingService.createOrder({
        product_id: parseInt(createForm.product_id, 10),
        product_variant_id: parseInt(createForm.product_variant_id, 10),
        target_quantity: qty,
        completion_date: createForm.completion_date || null,
        notes: createForm.notes || 'Factory work order launched',
      });
      const newOrder = res.data || res.order;
      setMsg({
        text: `Production batch #${newOrder?.orderNumber || newOrder?.order_number || 'New'} created successfully!`,
        type: 'success',
      });
      setCreateModalOpen(false);
      setCreateForm((p) => ({ ...p, target_quantity: 500, completion_date: '', notes: '' }));
      loadData();
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Failed to create manufacturing batch.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (batchId, newStatus, batchNumber, targetQty, garmentName) => {
    try {
      await manufacturingService.updateStatus(batchId, newStatus);
      if (newStatus === 'completed') {
        setMsg({
          text: `Batch #${batchNumber} marked as COMPLETED! ${targetQty} units of '${garmentName}' have been added directly to warehouse inventory.`,
          type: 'success',
        });
      } else {
        setMsg({
          text: `Batch #${batchNumber} status updated to '${newStatus}'.`,
          type: 'success',
        });
      }
      loadData();
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Failed to update batch status.',
        type: 'error',
      });
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading manufacturing facility &amp; QC..." /></Layout>;

  // Metrics
  const totalBatches = orders.length;
  const inProgressBatches = orders.filter((o) => o.status === 'in_progress' || o.status === 'working').length;
  const completedBatches = orders.filter((o) => o.status === 'completed').length;
  const totalManufacturedUnits = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + parseInt(o.targetQuantity || o.target_quantity || 0, 10), 0);

  // Filter
  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const batchNum = (o.orderNumber || o.order_number || `PR3-MFG-${o.id}`).toLowerCase();
    const prodName = (o.product?.name || '').toLowerCase();
    const sku = (o.variant?.sku || '').toLowerCase();
    const status = (o.status || '').toLowerCase();

    const matchesSearch = !q || batchNum.includes(q) || prodName.includes(q) || sku.includes(q);
    const matchesStatus = !statusFilter || status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
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
            <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.4rem' }}>
              Atelier Production &amp; QC
            </span>
            <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Manufacturing &amp; Batch Management</h1>
            <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
              Manage garment cutting, assembly batches, status transitions, and automated warehouse inventory additions.
            </p>
          </div>

          <Button variant="coral" onClick={() => setCreateModalOpen(true)}>
            + Create Production Batch
          </Button>
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
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(23, 23, 23, 0.6)' }}>
              Total Work Orders
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '0.4rem' }}>
              {totalBatches}
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-gold)' }}>
              In Production
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '0.4rem', color: 'var(--color-gold)' }}>
              {inProgressBatches}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)', marginTop: '0.2rem' }}>
              Active cutting &amp; stitching runs
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-sage)' }}>
              Finished &amp; In Stock
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '0.4rem', color: 'var(--color-sage)' }}>
              {completedBatches}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)', marginTop: '0.2rem' }}>
              Credited to inventory
            </div>
          </div>

          <div className="pr3-card">
            <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-coral)' }}>
              Total Units Manufactured
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '0.4rem', color: 'var(--color-coral)' }}>
              {totalManufacturedUnits.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)', marginTop: '0.2rem' }}>
              From completed factory runs
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {msg.text && (
          <div
            style={{
              padding: '1.2rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)'}`,
              backgroundColor: msg.type === 'error' ? 'var(--color-coral-light)' : 'var(--color-sage-light)',
              color: msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)',
              marginBottom: '2rem',
              fontWeight: 700,
            }}
          >
            ✓ {msg.text}
          </div>
        )}

        {/* Filter Bar */}
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
              placeholder="Search by batch number, garment name, or SKU..."
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
              <option value="">All Batch Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed (Added to Stock)</option>
              <option value="cancelled">Cancelled</option>
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

        {/* Batches Table */}
        <div className="pr3-table-wrapper">
          <table className="pr3-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Garment &amp; Spec</th>
                <th>Target Quantity</th>
                <th>Current Status</th>
                <th>Timeline / Due Date</th>
                <th>Update Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ fontWeight: 700, color: 'rgba(23, 23, 23, 0.6)' }}>
                      No manufacturing batches match your filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const batchCode = o.orderNumber || o.order_number || `PR3-MFG-${o.id}`;
                  const qty = parseInt(o.targetQuantity || o.target_quantity || 0, 10);
                  const status = (o.status || 'pending').toLowerCase();
                  const prodName = o.product?.name || `Product #${o.product_id}`;
                  const imgUrl = o.product?.image_url || o.product?.imageUrl || getProductImage(o.product);
                  const variantSpec = o.variant ? `${o.variant.size} · ${o.variant.color}` : 'Standard';
                  const sku = o.variant?.sku || `SKU-${o.productVariantId}`;

                  let badgeClass = 'pr3-badge-coral';
                  if (status === 'completed') badgeClass = 'pr3-badge-sage';
                  if (status === 'in_progress' || status === 'working') badgeClass = 'pr3-badge-gold';

                  return (
                    <tr key={o.id}>
                      <td>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-black)' }}>
                          {batchCode}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              backgroundColor: 'var(--color-ivory)',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={prodName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{prodName}</div>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                              {variantSpec} · <code>{sku}</code>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-black)' }}>
                          {qty.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(23, 23, 23, 0.6)' }}>units</span>
                        </div>
                      </td>
                      <td>
                        <span className={`pr3-badge ${badgeClass}`}>
                          {status === 'completed' ? 'FINISHED / STOCKED' : status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                          {status === 'completed' && (o.completionDate || o.completion_date) ? (
                            <span style={{ color: 'var(--color-sage)' }}>
                              ✓ Finished {new Date(o.completionDate || o.completion_date).toLocaleDateString()}
                            </span>
                          ) : o.startDate || o.start_date ? (
                            <span>Started {new Date(o.startDate || o.start_date).toLocaleDateString()}</span>
                          ) : (
                            <span style={{ color: 'rgba(23, 23, 23, 0.5)' }}>Scheduled</span>
                          )}
                        </div>
                        {o.notes && (
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: 'rgba(23, 23, 23, 0.55)',
                              maxWidth: '180px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '0.2rem',
                            }}
                          >
                            {o.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          value={status === 'working' ? 'in_progress' : status}
                          onChange={(e) =>
                            handleStatusChange(o.id, e.target.value, batchCode, qty, prodName)
                          }
                          className="pr3-input"
                          style={{
                            width: 'auto',
                            padding: '0.45rem 0.8rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: status === 'completed' ? 'var(--color-sage-light)' : 'var(--color-white)',
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Finish &amp; Add to Inventory</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedBatch(o)}
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Create Production Batch */}
        <Modal
          isOpen={createModalOpen}
          title="Create New Production Batch"
          onClose={() => setCreateModalOpen(false)}
          maxWidth="640px"
        >
          <form onSubmit={handleCreateBatch}>
            {/* Garment Selector */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Select Garment Style *
              </label>
              <select
                value={createForm.product_id}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="pr3-input"
                style={{ fontWeight: 600, cursor: 'pointer' }}
                required
              >
                <option value="">Select Garment...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category?.name || 'Apparel'})
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Selector */}
            {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Variant Size &amp; Color Specification *
                </label>
                <select
                  value={createForm.product_variant_id}
                  onChange={(e) => setCreateForm((p) => ({ ...p, product_variant_id: e.target.value }))}
                  className="pr3-input"
                  style={{ fontWeight: 600, cursor: 'pointer' }}
                  required
                >
                  {selectedProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} · {v.color} (SKU: {v.sku})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Quantity & Estimated Completion */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <Input
                  label="Target Batch Units *"
                  name="target_quantity"
                  type="number"
                  min="1"
                  value={createForm.target_quantity}
                  onChange={(e) => setCreateForm((p) => ({ ...p, target_quantity: e.target.value }))}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Estimated Completion Date
                </label>
                <input
                  type="date"
                  value={createForm.completion_date}
                  onChange={(e) => setCreateForm((p) => ({ ...p, completion_date: e.target.value }))}
                  className="pr3-input"
                />
              </div>
            </div>

            {/* Notes */}
            <Input
              label="Production Batch Notes / Factory Instructions"
              name="notes"
              value={createForm.notes}
              onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Primary assembly run for Spring collection. Cut &amp; stitch line 2."
            />

            <div
              style={{
                marginTop: '1.2rem',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-sage-light)',
                border: '1px solid var(--color-sage)',
                fontSize: '0.82rem',
                color: 'var(--color-black)',
                fontWeight: 600,
              }}
            >
              ★ <strong>Automatic Inventory Credit:</strong> Once cutting and quality assurance are complete, selecting <em>"Finish &amp; Add to Inventory"</em> will immediately credit these units into your warehouse stock.
            </div>

            <Button
              type="submit"
              variant="coral"
              disabled={submitting}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.95rem' }}
            >
              {submitting ? 'Launching Batch...' : 'Launch Production Batch'}
            </Button>
          </form>
        </Modal>

        {/* Modal: Batch Details */}
        <Modal
          isOpen={!!selectedBatch}
          title={`Batch Details: ${selectedBatch?.orderNumber || selectedBatch?.order_number || ''}`}
          onClose={() => setSelectedBatch(null)}
          maxWidth="600px"
        >
          {selectedBatch && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.2rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(23, 23, 23, 0.08)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Garment Product
                  </span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                    {selectedBatch.product?.name}
                  </div>
                </div>
                <span className="pr3-badge pr3-badge-sage">
                  {selectedBatch.status?.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="pr3-card" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Target Production Volume
                  </span>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--color-coral)', marginTop: '0.2rem' }}>
                    {parseInt(selectedBatch.targetQuantity || selectedBatch.target_quantity || 0, 10).toLocaleString()} units
                  </div>
                </div>

                <div className="pr3-card" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Variant Spec
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.2rem' }}>
                    {selectedBatch.variant?.size} · {selectedBatch.variant?.color}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                    SKU: {selectedBatch.variant?.sku}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(23, 23, 23, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)', display: 'block', marginBottom: '0.4rem' }}>
                  Factory Notes &amp; Quality Status
                </span>
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {selectedBatch.notes || 'Automated factory assembly order.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Scheduled Start Date
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    {selectedBatch.startDate || selectedBatch.start_date
                      ? new Date(selectedBatch.startDate || selectedBatch.start_date).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                    Completion / Finished Date
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    {selectedBatch.completionDate || selectedBatch.completion_date
                      ? new Date(selectedBatch.completionDate || selectedBatch.completion_date).toLocaleDateString()
                      : 'Pending Finish'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default AdminManufacturing;
