import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import cartService from '../../services/cartService';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputQuantities, setInputQuantities] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const res = await cartService.getCart();
      const data = res.data || res.cart || res;
      setCart(data);
      const itemsList = data?.items || [];
      const qtyMap = {};
      itemsList.forEach((it) => {
        qtyMap[it.id] = it.quantity;
      });
      setInputQuantities(qtyMap);
    } catch {
      setError('Unable to fetch shopping cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    setError('');
    setInputQuantities((prev) => ({ ...prev, [itemId]: newQty }));
    try {
      await cartService.updateItem(itemId, newQty);
      loadCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity.');
      loadCart();
    }
  };

  const handleSetQuantity = async (itemId, targetQty) => {
    const qty = parseInt(targetQty, 10);
    if (isNaN(qty) || qty < 1) return;

    setError('');
    try {
      await cartService.updateItem(itemId, qty);
      loadCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity.');
      loadCart();
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      loadCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item.');
    }
  };

  const handleClear = async () => {
    try {
      await cartService.clearCart();
      loadCart();
    } catch {
      setError('Failed to clear cart.');
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading cart items..." /></Layout>;

  const items = cart?.items || [];
  
  // Calculate total: backend provides pre-calculated subtotal/total or compute from item_total/unit_price
  const subtotal = cart?.subtotal || cart?.total || items.reduce((acc, item) => {
    const price = item.unit_price || item.product_variant?.price || item.price || 0;
    return acc + parseFloat(price) * item.quantity;
  }, 0);

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid rgba(23, 23, 23, 0.08)',
            paddingBottom: '0.9rem',
          }}
        >
          <div>
            <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.4rem' }}>
              Your Bag
            </span>
            <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Shopping Cart</h1>
          </div>

          {items.length > 0 && (
            <Button variant="secondary" onClick={handleClear} style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}>
              Clear Cart
            </Button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-coral)',
              backgroundColor: 'var(--color-coral-light)',
              color: 'var(--color-coral)',
              marginBottom: '1.8rem',
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="pr3-card" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>Your cart is empty</h2>
            <p style={{ color: 'rgba(23, 23, 23, 0.65)', margin: '0 auto 1.8rem', maxWidth: '400px' }}>
              Explore our apparel collection to add items to your shopping cart.
            </p>
            <Link to="/">
              <Button variant="coral">Browse Collection</Button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2.5rem' }}>
            {/* Items Table */}
            <div className="pr3-table-wrapper">
              <table className="pr3-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    // Match the backend cartService formatted payload
                    const name = item.product_name || item.product_variant?.product?.name || 'Apparel Item';
                    const size = item.size || item.product_variant?.size || '';
                    const color = item.color || item.product_variant?.color || '';
                    const unitPrice = parseFloat(item.unit_price || item.product_variant?.price || item.price || 0);
                    const itemTotal = parseFloat(item.item_total || unitPrice * item.quantity || 0);

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ fontSize: '0.98rem' }}>{name}</strong>
                          {(size || color) && (
                            <div style={{ fontSize: '0.78rem', color: 'rgba(23, 23, 23, 0.65)', marginTop: '0.2rem' }}>
                              {size} {size && color && '·'} {color}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>${unitPrice.toFixed(2)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                              style={{
                                width: '30px',
                                height: '30px',
                                border: '1px solid rgba(23, 23, 23, 0.18)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-white)',
                                cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 800,
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: item.quantity <= 1 ? 0.4 : 1,
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={inputQuantities[item.id] !== undefined ? inputQuantities[item.id] : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInputQuantities((prev) => ({ ...prev, [item.id]: val }));
                              }}
                              onBlur={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                if (!isNaN(parsed) && parsed >= 1) {
                                  if (parsed !== item.quantity) {
                                    handleSetQuantity(item.id, parsed);
                                  }
                                } else {
                                  setInputQuantities((prev) => ({ ...prev, [item.id]: item.quantity }));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                              }}
                              aria-label="Order item quantity"
                              style={{
                                width: '56px',
                                height: '30px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(23, 23, 23, 0.22)',
                                padding: '0 0.25rem',
                                backgroundColor: 'var(--color-white)',
                                color: 'var(--color-black)',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                              aria-label="Increase quantity"
                              style={{
                                width: '30px',
                                height: '30px',
                                border: '1px solid rgba(23, 23, 23, 0.18)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-white)',
                                cursor: 'pointer',
                                fontWeight: 800,
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ fontWeight: 900, color: 'var(--color-coral)' }}>
                          ${itemTotal.toFixed(2)}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: 'rgba(23, 23, 23, 0.5)',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              textDecoration: 'underline',
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Order Summary Card */}
            <div>
              <div className="pr3-card">
                <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.8rem' }}>
                  Checkout Ready
                </span>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '1.2rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(23, 23, 23, 0.08)' }}>
                  Summary
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span style={{ color: 'rgba(23, 23, 23, 0.7)' }}>Subtotal</span>
                  <strong>${parseFloat(subtotal).toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span style={{ color: 'rgba(23, 23, 23, 0.7)' }}>Estimated Shipping</span>
                  <span style={{ color: 'var(--color-sage)', fontWeight: 800 }}>Free</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderTop: '2px solid rgba(23, 23, 23, 0.08)',
                    paddingTop: '1.2rem',
                    marginTop: '1.2rem',
                    marginBottom: '1.8rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-coral)' }}>
                    ${parseFloat(subtotal).toFixed(2)}
                  </span>
                </div>

                <Button
                  variant="coral"
                  onClick={() => navigate('/checkout')}
                  style={{ width: '100%', padding: '0.95rem' }}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
