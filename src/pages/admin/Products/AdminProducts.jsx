import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import productService from '../../../services/productService';
import { getProductImage, PRESET_APPAREL_IMAGES } from '../../../assets/apparelImages';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    sku: '',
    image_url: '',
  });

  // Edit / Change Image modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    image_url: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        productService.getCategories(),
      ]);
      const items = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.rows || [];
      setProducts(items);
      const cats = Array.isArray(catRes.data) ? catRes.data : catRes.categories || [];
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded image file to Data URL
  const handleFileUpload = (e, setTargetForm) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsg({ text: 'Please select a valid image file (.jpg, .png, .webp).', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMsg({ text: 'Image file exceeds 5MB limit. Please choose a smaller image.', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setTargetForm((prev) => ({ ...prev, image_url: loadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productService.createProduct({
        ...createForm,
        base_price: parseFloat(createForm.base_price),
        category_id: parseInt(createForm.category_id, 10),
      });
      setMsg({ text: `Product '${createForm.name}' created with image successfully.`, type: 'success' });
      setCreateModalOpen(false);
      setCreateForm({ name: '', description: '', base_price: '', category_id: '', sku: '', image_url: '' });
      loadData();
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create product.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const firstVariant = product.variants?.[0];
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      base_price: firstVariant ? firstVariant.price : (product.base_price || ''),
      category_id: product.category_id || product.categoryId || '',
      image_url: product.image_url || product.imageUrl || getProductImage(product),
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitting(true);
    try {
      await productService.updateProduct(editingProduct.id, {
        name: editForm.name,
        description: editForm.description,
        category_id: parseInt(editForm.category_id, 10),
        base_price: parseFloat(editForm.base_price),
        image_url: editForm.image_url,
      });
      setMsg({ text: `Product '${editForm.name}' image & details updated successfully.`, type: 'success' });
      setEditModalOpen(false);
      setEditingProduct(null);
      loadData();
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update product.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate or remove '${name}'?`)) return;
    try {
      await productService.deleteProduct(id);
      setMsg({ text: `Product '${name}' removed.`, type: 'success' });
      loadData();
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Delete failed.', type: 'error' });
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading apparel catalog..." /></Layout>;

  // Filter products
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || p.variants?.[0]?.sku || '').toLowerCase().includes(q);
    const catName = (p.category?.name || '').toLowerCase();
    const catMatch = !categoryFilter || catName === categoryFilter.toLowerCase();
    return (nameMatch || skuMatch) && catMatch;
  });

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
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
            <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.4rem' }}>
              Catalog Architecture
            </span>
            <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Products &amp; Garments</h1>
            <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
              Create new garment listings with custom editorial images, adjust pricing, and manage imagery.
            </p>
          </div>
          <Button variant="coral" onClick={() => setCreateModalOpen(true)}>
            + Add New Garment
          </Button>
        </div>

        {/* Message Banner */}
        {msg.text && (
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)'}`,
              backgroundColor: msg.type === 'error' ? 'var(--color-coral-light)' : 'var(--color-sage-light)',
              color: msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)',
              marginBottom: '1rem',
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
              placeholder="Search by garment title or SKU..."
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
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
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

        {/* Products Table */}
        <div className="pr3-table-wrapper">
          <table className="pr3-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Garment Name</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Base Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const imgUrl = p.image_url || p.imageUrl || getProductImage(p);
                const displaySku = p.sku || p.variants?.[0]?.sku || `PR3-SKU-${p.id}`;
                const displayPrice = p.variants?.[0]?.price || p.base_price || 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          backgroundColor: 'var(--color-ivory)',
                          border: '1px solid rgba(23, 23, 23, 0.08)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={p.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--color-black)' }}>
                        {p.name}
                      </strong>
                      {p.description && (
                        <p
                          style={{
                            fontSize: '0.78rem',
                            color: 'rgba(23, 23, 23, 0.6)',
                            marginTop: '0.2rem',
                            maxWidth: '300px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="pr3-badge pr3-badge-sage">
                        {p.category?.name || 'Apparel'}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.85rem', fontWeight: 800 }}>{displaySku}</code>
                    </td>
                    <td style={{ fontWeight: 900, color: 'var(--color-coral)', fontSize: '1.05rem' }}>
                      ${parseFloat(displayPrice).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Button
                          variant="secondary"
                          onClick={() => openEditModal(p)}
                          style={{
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          🖼️ Change Image / Edit
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleDelete(p.id, p.name)}
                          style={{
                            padding: '0.45rem 0.8rem',
                            fontSize: '0.78rem',
                            color: 'var(--color-coral)',
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal: Create New Garment */}
        <Modal
          isOpen={createModalOpen}
          title="Create New Garment Listing"
          onClose={() => setCreateModalOpen(false)}
          maxWidth="640px"
        >
          <form onSubmit={handleCreate}>
            <Input
              label="Garment Title *"
              name="name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Atelier Silk Midi Dress"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Category *
                </label>
                <select
                  name="category_id"
                  value={createForm.category_id}
                  onChange={(e) => setCreateForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="pr3-input"
                  required
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Base Price ($) *"
                  name="base_price"
                  type="number"
                  step="0.01"
                  value={createForm.base_price}
                  onChange={(e) => setCreateForm((p) => ({ ...p, base_price: e.target.value }))}
                  placeholder="85.00"
                  required
                />
              </div>
            </div>

            <Input
              label="Base SKU Identifier *"
              name="sku"
              value={createForm.sku}
              onChange={(e) => setCreateForm((p) => ({ ...p, sku: e.target.value }))}
              placeholder="e.g. DRESS-SILK-01"
              required
            />

            <Input
              label="Editorial Garment Description"
              name="description"
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Crafted from premium 100% mulberry silk with bias cut..."
            />

            {/* Image Upload & Selection Section */}
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.2rem',
                border: '1px solid rgba(23, 23, 23, 0.1)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(23, 23, 23, 0.02)',
              }}
            >
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--color-coral)' }}>
                Garment Photography / Image *
              </label>

              {/* Preview */}
              {createForm.image_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                  <img
                    src={createForm.image_url}
                    alt="Preview"
                    style={{
                      width: '90px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--color-coral)',
                    }}
                  />
                  <div>
                    <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.4rem' }}>
                      Image Selected
                    </span>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                      Ready to be linked with garment.
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'rgba(23, 23, 23, 0.6)', marginBottom: '0.8rem' }}>
                  Choose a device file, paste a link, or pick from our curated fashion presets below:
                </p>
              )}

              {/* File upload from device */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                  Option A: Upload From Device
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setCreateForm)}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem 0',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* URL Input */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                  Option B: Or Direct Image URL
                </span>
                <input
                  type="url"
                  value={createForm.image_url}
                  onChange={(e) => setCreateForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="pr3-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Curated Presets */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                  Option C: Or 1-Click Luxury Presets
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {PRESET_APPAREL_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, image_url: preset.url }))}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        border: '1px solid rgba(23, 23, 23, 0.15)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: createForm.image_url === preset.url ? 'var(--color-black)' : 'var(--color-white)',
                        color: createForm.image_url === preset.url ? 'var(--color-white)' : 'var(--color-black)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="coral"
              disabled={submitting}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.95rem' }}
            >
              {submitting ? 'Creating Garment...' : 'Publish Garment Listing'}
            </Button>
          </form>
        </Modal>

        {/* Modal: Edit Garment & Change Image */}
        <Modal
          isOpen={editModalOpen}
          title={`Edit Garment & Image: ${editingProduct?.name || ''}`}
          onClose={() => {
            setEditModalOpen(false);
            setEditingProduct(null);
          }}
          maxWidth="640px"
        >
          <form onSubmit={handleUpdate}>
            <Input
              label="Garment Title *"
              name="name"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Category *
                </label>
                <select
                  name="category_id"
                  value={editForm.category_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="pr3-input"
                  required
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Price ($) *"
                  name="base_price"
                  type="number"
                  step="0.01"
                  value={editForm.base_price}
                  onChange={(e) => setEditForm((p) => ({ ...p, base_price: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Input
              label="Editorial Description"
              name="description"
              value={editForm.description}
              onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
            />

            {/* Change Image Section */}
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.2rem',
                border: '1px solid rgba(23, 23, 23, 0.1)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(23, 23, 23, 0.02)',
              }}
            >
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--color-coral)' }}>
                Change Garment Image
              </label>

              {/* Current / New Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.2rem' }}>
                <img
                  src={editForm.image_url}
                  alt="Garment Preview"
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-coral)',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                />
                <div>
                  <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.4rem' }}>
                    Active Garment Photo
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                    Upload a replacement photo from your device or select a new preset below.
                  </p>
                </div>
              </div>

              {/* File upload from device */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                  Upload New Photo From Device
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setEditForm)}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem 0',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Direct URL */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                  Or Edit Direct Image URL
                </span>
                <input
                  type="url"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="pr3-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Presets */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                  Or Pick Fast Preset
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {PRESET_APPAREL_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, image_url: preset.url }))}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        border: '1px solid rgba(23, 23, 23, 0.15)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: editForm.image_url === preset.url ? 'var(--color-black)' : 'var(--color-white)',
                        color: editForm.image_url === preset.url ? 'var(--color-white)' : 'var(--color-black)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="coral"
              disabled={submitting}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.95rem' }}
            >
              {submitting ? 'Saving Changes...' : 'Save & Update Garment Image'}
            </Button>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default AdminProducts;
