import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import productService from '../../services/productService';
import cartService from '../../services/cartService';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { getProductImage } from '../../assets/apparelImages';

const calculateVolumeDiscount = (units) => {
  if (units >= 250) return 0.25;
  if (units >= 100) return 0.18;
  if (units >= 50) return 0.10;
  if (units >= 20) return 0.05;
  return 0;
};

const BulkOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active selection for adding to manifest
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(50);

  // Multi-item bulk order manifest list
  const [manifest, setManifest] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Shipping details
  const [shippingDetails, setShippingDetails] = useState({
    shipping_name: user ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() : 'Corporate Buyer',
    shipping_phone: user?.phone || '0771234567',
    shipping_address: 'Corporate Logistics Dock 4, Industrial Zone',
    shipping_city: 'Colombo',
    shipping_state: 'Western',
    shipping_postal_code: '00100',
    notes: 'Bulk Multi-Garment Order - Commercial Invoice Required',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productService.getProducts({ limit: 50 });
      const items = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setProducts(items);

      if (items.length > 0) {
        setSelectedProduct(items[0]);
        if (items[0].variants && items[0].variants.length > 0) {
          setSelectedVariant(items[0].variants[0]);
        }
      }
    } catch {
      setMsg({ text: 'Unable to load products for bulk order.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const handleShippingChange = (e) => {
    setShippingDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Add currently selected garment + variant to manifest
  const handleAddToManifest = () => {
    if (!selectedProduct || !selectedVariant) {
      setMsg({ text: 'Please select an apparel variant size and color first.', type: 'error' });
      return;
    }

    const qty = parseInt(itemQuantity, 10);
    if (isNaN(qty) || qty < 10) {
      setMsg({ text: 'Minimum bulk quantity for each garment line is 10 units.', type: 'error' });
      return;
    }

    // Check if variant already exists in manifest
    const existingIndex = manifest.findIndex((item) => item.variant.id === selectedVariant.id);
    if (existingIndex >= 0) {
      // Update quantity of existing line
      const updated = [...manifest];
      updated[existingIndex].quantity += qty;
      setManifest(updated);
      setMsg({
        text: `Updated quantity for ${selectedProduct.name} (${selectedVariant.size} · ${selectedVariant.color}) to ${updated[existingIndex].quantity} units.`,
        type: 'success',
      });
    } else {
      // Add new line item
      const newLine = {
        lineId: `${selectedVariant.id}-${Date.now()}`,
        product: selectedProduct,
        variant: selectedVariant,
        quantity: qty,
        unitPrice: parseFloat(selectedVariant.price || selectedProduct.base_price || 0),
      };
      setManifest((prev) => [...prev, newLine]);
      setMsg({
        text: `Added ${qty} units of ${selectedProduct.name} (${selectedVariant.size} · ${selectedVariant.color}) to bulk manifest.`,
        type: 'success',
      });
    }

    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleUpdateLineQuantity = (lineId, newQty) => {
    const qty = Math.max(10, parseInt(newQty, 10) || 10);
    setManifest((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveLine = (lineId) => {
    setManifest((prev) => prev.filter((item) => item.lineId !== lineId));
  };

  // Multi-item totals and combined volume calculations
  const totalUnits = manifest.reduce((sum, item) => sum + item.quantity, 0);
  const overallDiscountRate = calculateVolumeDiscount(totalUnits);

  // Compute calculated items with combined volume tier discounts
  const calculatedLines = manifest.map((item) => {
    // Individual tier or cumulative order tier, whichever is greater
    const itemDiscountRate = Math.max(calculateVolumeDiscount(item.quantity), overallDiscountRate);
    const discountedUnitPrice = item.unitPrice * (1 - itemDiscountRate);
    const lineTotal = discountedUnitPrice * item.quantity;
    return {
      ...item,
      discountRate: itemDiscountRate,
      discountedUnitPrice,
      lineTotal,
    };
  });

  const grossRetailTotal = calculatedLines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalPayable = calculatedLines.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalSavings = grossRetailTotal - totalPayable;

  // Single active item preview calculation
  const activeUnitPrice = selectedVariant ? parseFloat(selectedVariant.price) : 0;
  const activeDiscountRate = Math.max(calculateVolumeDiscount(itemQuantity), overallDiscountRate);
  const activeDiscountedUnit = activeUnitPrice * (1 - activeDiscountRate);
  const activeLineTotal = activeDiscountedUnit * itemQuantity;

  const handlePlaceBulkOrder = async (e) => {
    e.preventDefault();

    if (manifest.length === 0) {
      setMsg({
        text: 'Your bulk manifest is empty. Please select garments and click "+ Add Garment to Manifest".',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      // 1. Clear cart
      await cartService.clearCart();

      // 2. Add ALL items from the multi-item bulk manifest into the cart
      for (const item of manifest) {
        await cartService.addItem({
          product_variant_id: item.variant.id,
          quantity: item.quantity,
        });
      }

      // 3. Create the combined order with all items
      const orderRes = await orderService.createOrder(shippingDetails);
      const order = orderRes.data || orderRes.order;

      // 4. Initiate corporate payment record
      if (order && order.id) {
        await paymentService.initiate({
          order_id: order.id,
          amount: order.total_amount || totalPayable,
          payment_method: 'bank_transfer',
        });
      }

      setMsg({
        text: `Combined Bulk Order #${order?.orderNumber || order?.id} with ${manifest.length} garment lines placed successfully! Redirecting...`,
        type: 'success',
      });
      setManifest([]);

      setTimeout(() => {
        navigate('/business/orders');
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to process multi-item bulk order. Please check warehouse stock.';
      setMsg({ text: errorMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout withSidebar>
        <Loader message="Loading corporate bulk order system..." />
      </Layout>
    );
  }

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.4rem' }}>
            Corporate Procurement
          </span>
          <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Create Multi-Item Bulk Order</h1>
          <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
            Add multiple garments, sizes, and quantities to a single procurement order with cumulative volume discounts.
          </p>
        </div>

        {/* Message Banner */}
        {msg.text && (
          <div
            style={{
              padding: '0.85rem',
              marginBottom: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)'}`,
              backgroundColor: msg.type === 'error' ? 'var(--color-coral-light)' : 'var(--color-sage-light)',
              fontWeight: 700,
              color: msg.type === 'error' ? 'var(--color-coral)' : 'var(--color-sage)',
            }}
          >
            ✓ {msg.text}
          </div>
        )}

        <form onSubmit={handlePlaceBulkOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
            {/* Left Column: Garment Selector & Current Order Manifest */}
            <div>
              {/* Step 1: Garment & Variant Picker */}
              <div className="pr3-card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>1. Select Garment &amp; Specify Quantity</h3>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(23, 23, 23, 0.6)' }}>
                    {products.length} garments available
                  </span>
                </div>

                {/* Garment Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '0.8rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {products.map((p) => {
                    const isSelected = selectedProduct?.id === p.id;
                    const imgUrl = p.image_url || p.imageUrl || getProductImage(p);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleProductSelect(p)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--color-coral)' : 'rgba(23, 23, 23, 0.1)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.8rem 0.6rem',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-coral-light)' : 'var(--color-white)',
                          transition: 'var(--transition)',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            marginBottom: '0.5rem',
                            backgroundColor: 'var(--color-ivory)',
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color: isSelected ? 'var(--color-coral)' : 'var(--color-black)',
                            lineHeight: '1.2',
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(23, 23, 23, 0.55)', marginTop: '0.2rem' }}>
                          {p.category?.name}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Variant Selector */}
                {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                      Size &amp; Color Specification
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                      {selectedProduct.variants.map((v) => {
                        const isVarSelected = selectedVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            style={{
                              padding: '0.55rem 1.1rem',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${isVarSelected ? 'var(--color-coral)' : 'rgba(23, 23, 23, 0.18)'}`,
                              backgroundColor: isVarSelected ? 'var(--color-coral)' : 'var(--color-white)',
                              color: isVarSelected ? 'var(--color-white)' : 'var(--color-black)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '0.84rem',
                            }}
                          >
                            {v.size} · {v.color} (${parseFloat(v.price).toFixed(2)})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Volume Quantity Input & Quick Preset Buttons */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                    Volume Quantity For This Item (Min: 10 units)
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(10, parseInt(e.target.value) || 10))}
                      className="pr3-input"
                      style={{ maxWidth: '130px', fontSize: '1.1rem', fontWeight: 800 }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {[25, 50, 100, 250, 500].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setItemQuantity(qty)}
                          style={{
                            padding: '0.45rem 0.8rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(23, 23, 23, 0.15)',
                            backgroundColor: itemQuantity === qty ? 'var(--color-black)' : 'var(--color-white)',
                            color: itemQuantity === qty ? 'var(--color-white)' : 'var(--color-black)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {qty} pcs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Item Subtotal & Add Button */}
                <div
                  style={{
                    backgroundColor: 'rgba(23, 23, 23, 0.03)',
                    padding: '1.2rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 800, color: 'rgba(23, 23, 23, 0.6)' }}>
                      Line Total: {selectedProduct?.name} ({itemQuantity} units)
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-coral)', marginTop: '0.2rem' }}>
                      ${activeLineTotal.toFixed(2)}{' '}
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-sage)' }}>
                        (-{(activeDiscountRate * 100).toFixed(0)}% tier savings)
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="coral"
                    onClick={handleAddToManifest}
                    style={{ padding: '0.8rem 1.6rem', fontSize: '0.92rem', fontWeight: 800 }}
                  >
                    + Add Garment to Bulk Manifest
                  </Button>
                </div>
              </div>

              {/* Step 2: Multi-Item Order Manifest (Table of all added items) */}
              <div className="pr3-card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>2. Bulk Order Manifest</h3>
                    <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                      Garments currently added to this wholesale order. You can add multiple different styles.
                    </p>
                  </div>
                  <span className="pr3-badge pr3-badge-sage" style={{ fontSize: '0.85rem' }}>
                    {manifest.length} {manifest.length === 1 ? 'Garment Line' : 'Garment Lines'} ({totalUnits} Units)
                  </span>
                </div>

                {manifest.length === 0 ? (
                  <div
                    style={{
                      padding: '2.5rem 1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'rgba(23, 23, 23, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed rgba(23, 23, 23, 0.15)',
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'rgba(23, 23, 23, 0.7)' }}>
                      No garments added to this bulk order yet.
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(23, 23, 23, 0.5)', marginTop: '0.4rem' }}>
                      Select a garment and size above, then click <strong>"+ Add Garment to Bulk Manifest"</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="pr3-table-wrapper" style={{ boxShadow: 'none' }}>
                    <table className="pr3-table">
                      <thead>
                        <tr>
                          <th>Garment Style</th>
                          <th>Specification</th>
                          <th>Unit Price</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculatedLines.map((item) => {
                          const imgUrl = item.product.image_url || item.product.imageUrl || getProductImage(item.product);
                          return (
                            <tr key={item.lineId}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                  <div
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: 'var(--radius-sm)',
                                      overflow: 'hidden',
                                      backgroundColor: 'var(--color-ivory)',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={item.product.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-black)' }}>
                                      {item.product.name}
                                    </strong>
                                    <div style={{ fontSize: '0.74rem', color: 'rgba(23, 23, 23, 0.55)' }}>
                                      {item.product.category?.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="pr3-badge" style={{ backgroundColor: 'rgba(23, 23, 23, 0.05)' }}>
                                  {item.variant.size} · {item.variant.color}
                                </span>
                              </td>
                              <td>
                                <div>
                                  <strong style={{ fontSize: '0.9rem' }}>${item.discountedUnitPrice.toFixed(2)}</strong>
                                  {item.discountRate > 0 && (
                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-sage)', fontWeight: 800 }}>
                                      -{(item.discountRate * 100).toFixed(0)}%
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="10"
                                  step="5"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateLineQuantity(item.lineId, e.target.value)}
                                  className="pr3-input"
                                  style={{
                                    width: '85px',
                                    padding: '0.35rem 0.6rem',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                  }}
                                />
                              </td>
                              <td style={{ fontWeight: 900, color: 'var(--color-coral)', fontSize: '1rem' }}>
                                ${item.lineTotal.toFixed(2)}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(item.lineId)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--color-coral)',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    padding: '0.4rem',
                                  }}
                                >
                                  ✕ Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 3: Corporate Shipping Address */}
              <div className="pr3-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>3. Corporate Delivery Address</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="Recipient / Company Name"
                    name="shipping_name"
                    value={shippingDetails.shipping_name}
                    onChange={handleShippingChange}
                    required
                  />
                  <Input
                    label="Contact Phone"
                    name="shipping_phone"
                    value={shippingDetails.shipping_phone}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
                <Input
                  label="Street Address / Loading Dock"
                  name="shipping_address"
                  value={shippingDetails.shipping_address}
                  onChange={handleShippingChange}
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <Input
                    label="City"
                    name="shipping_city"
                    value={shippingDetails.shipping_city}
                    onChange={handleShippingChange}
                    required
                  />
                  <Input
                    label="State / Province"
                    name="shipping_state"
                    value={shippingDetails.shipping_state}
                    onChange={handleShippingChange}
                    required
                  />
                  <Input
                    label="Postal Code"
                    name="shipping_postal_code"
                    value={shippingDetails.shipping_postal_code}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Combined Wholesale Order Summary */}
            <div>
              <div className="pr3-card" style={{ position: 'sticky', top: '100px' }}>
                <span className="pr3-badge pr3-badge-gold" style={{ marginBottom: '0.8rem' }}>
                  Wholesale Procurement Summary
                </span>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Cost Breakdown</h3>

                {/* Manifest Line Items Quick List */}
                {calculatedLines.length > 0 ? (
                  <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(23, 23, 23, 0.08)', paddingBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(23, 23, 23, 0.6)', display: 'block', marginBottom: '0.8rem' }}>
                      Garments in Order ({calculatedLines.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {calculatedLines.map((item) => (
                        <div
                          key={item.lineId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700 }}>{item.product.name}</span>
                            <div style={{ fontSize: '0.74rem', color: 'rgba(23, 23, 23, 0.55)' }}>
                              {item.variant.size} · {item.variant.color} × {item.quantity} units
                            </div>
                          </div>
                          <span style={{ fontWeight: 800 }}>${item.lineTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(23, 23, 23, 0.03)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                      Add items to your bulk manifest to see the wholesale cost breakdown.
                    </span>
                  </div>
                )}

                {/* Metrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span style={{ color: 'rgba(23, 23, 23, 0.7)' }}>Total Garment Lines</span>
                  <strong>{manifest.length} lines</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span style={{ color: 'rgba(23, 23, 23, 0.7)' }}>Combined Order Volume</span>
                  <strong style={{ fontSize: '1.05rem' }}>{totalUnits} units</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span style={{ color: 'rgba(23, 23, 23, 0.7)' }}>Gross Retail Value</span>
                  <span>${grossRetailTotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', color: 'var(--color-sage)', fontWeight: 800 }}>
                  <span>Volume Tier Savings</span>
                  <span>-${totalSavings.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span style={{ color: 'rgba(23, 23, 23, 0.7)' }}>Freight &amp; Logistics</span>
                  <span style={{ color: 'var(--color-sage)', fontWeight: 800 }}>Free Corporate Allocation</span>
                </div>

                {/* Volume Tier Perks Badge */}
                <div
                  style={{
                    backgroundColor: 'var(--color-gold-light)',
                    border: '1px solid var(--color-gold)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.8rem',
                    margin: '1.2rem 0',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-black)',
                  }}
                >
                  {totalUnits >= 250
                    ? '★ Maximum 25% Enterprise Volume Tier Unlocked!'
                    : totalUnits >= 100
                    ? '★ 18% Corporate Volume Tier Active (Add to 250 for 25% off)'
                    : totalUnits >= 50
                    ? '★ 10% Wholesale Tier Active (Add to 100 for 18% off)'
                    : '★ Add 50+ total units across garments to unlock 10% wholesale discount'}
                </div>

                {/* Total Payable */}
                <div
                  style={{
                    borderTop: '2px solid rgba(23, 23, 23, 0.1)',
                    paddingTop: '1.2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '1.8rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total Payable</span>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-coral)' }}>
                    ${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="coral"
                  disabled={submitting || manifest.length === 0}
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                >
                  {submitting
                    ? 'Placing Bulk Procurement...'
                    : `Authorize & Place Bulk Order (${totalUnits} units)`}
                </Button>

                <p style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.55)', textAlign: 'center', marginTop: '1rem' }}>
                  Payment Method: Corporate Net-30 Bank Transfer. Direct factory warehouse allocation.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default BulkOrders;
