import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import cartService from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { user } = useAuth();
  const { refreshCartCount, resetCart } = useCart();
  const isRetailCustomer = user?.role !== 'business';
  const MAX_RETAIL_QTY = 50;

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputQuantities, setInputQuantities] = useState({});
  const syncTimeoutRef = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    return () => {
      // Cleanup all pending timers on unmount
      Object.values(syncTimeoutRef.current).forEach((t) => clearTimeout(t));
    };
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

    if (isRetailCustomer && newQty > MAX_RETAIL_QTY) {
      setError(`Retail orders are limited to a maximum of ${MAX_RETAIL_QTY} units per item. For larger quantities, please use Wholesale Bulk Ordering.`);
      return;
    }

    setError('');
    // 1. Immediately update input state
    setInputQuantities((prev) => ({ ...prev, [itemId]: newQty }));

    // 2. Optimistically update cart in memory for 0ms instant display of new totals
    setCart((prevCart) => {
      if (!prevCart) return prevCart;
      const updatedItems = (prevCart.items || []).map((it) =>
        it.id === itemId
          ? {
              ...it,
              quantity: newQty,
              item_total: parseFloat(it.unit_price || it.price || 0) * newQty,
            }
          : it
      );
      const newSubtotal = updatedItems.reduce(
        (sum, it) => sum + parseFloat(it.unit_price || it.price || 0) * it.quantity,
        0
      );
      return {
        ...prevCart,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal,
      };
    });

    // 3. Clear any pending debounce timer
    if (syncTimeoutRef.current[itemId]) {
      clearTimeout(syncTimeoutRef.current[itemId]);
    }

    // 4. Sync with backend in background
    try {
      const res = await cartService.updateItem(itemId, newQty);
      const data = res.data || res.cart || res;
      if (data && data.items) {
        setCart(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity.');
      loadCart();
    }
  };

  const handleSetQuantity = async (itemId, targetQty) => {
    let qty = parseInt(targetQty, 10);
    if (isNaN(qty) || qty < 1) return;

    if (isRetailCustomer && qty > MAX_RETAIL_QTY) {
      qty = MAX_RETAIL_QTY;
      setError(`Retail orders are limited to a maximum of ${MAX_RETAIL_QTY} units per item. Quantity capped at ${MAX_RETAIL_QTY}.`);
    } else {
      setError('');
    }

    // 1. Immediately update input state
    setInputQuantities((prev) => ({ ...prev, [itemId]: qty }));

    // 2. Optimistically update cart in memory for 0ms instant display of new totals
    setCart((prevCart) => {
      if (!prevCart) return prevCart;
      const updatedItems = (prevCart.items || []).map((it) =>
        it.id === itemId
          ? {
              ...it,
              quantity: qty,
              item_total: parseFloat(it.unit_price || it.price || 0) * qty,
            }
          : it
      );
      const newSubtotal = updatedItems.reduce(
        (sum, it) => sum + parseFloat(it.unit_price || it.price || 0) * it.quantity,
        0
      );
      return {
        ...prevCart,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal,
      };
    });

    // 3. Sync with backend in background
    try {
      const res = await cartService.updateItem(itemId, qty);
      const data = res.data || res.cart || res;
      if (data && data.items) {
        setCart(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity.');
      loadCart();
    }
  };

  const handleInputChange = (itemId, rawValue) => {
    let val = rawValue;
    if (val !== '' && isRetailCustomer) {
      const num = parseInt(val, 10);
      if (num > MAX_RETAIL_QTY) {
        val = String(MAX_RETAIL_QTY);
        setError(`Retail order limit is ${MAX_RETAIL_QTY} units per item.`);
      } else {
        setError('');
      }
    }
    setInputQuantities((prev) => ({ ...prev, [itemId]: val }));

    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      // Live optimistic calculation of the cart state so line item total and subtotal change in real-time while typing!
      setCart((prevCart) => {
        if (!prevCart) return prevCart;
        const updatedItems = (prevCart.items || []).map((it) =>
          it.id === itemId
            ? {
                ...it,
                quantity: parsed,
                item_total: parseFloat(it.unit_price || it.price || 0) * parsed,
              }
            : it
        );
        const newSubtotal = updatedItems.reduce(
          (sum, it) => sum + parseFloat(it.unit_price || it.price || 0) * it.quantity,
          0
        );
        return {
          ...prevCart,
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal,
        };
      });

      // Clear existing debounce timer
      if (syncTimeoutRef.current[itemId]) {
        clearTimeout(syncTimeoutRef.current[itemId]);
      }

      // Automatically sync with backend 400ms after user stops typing
      syncTimeoutRef.current[itemId] = setTimeout(() => {
        handleSetQuantity(itemId, parsed);
      }, 400);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      refreshCartCount(); // Sync badge in navbar
      loadCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item.');
    }
  };

  const handleClear = async () => {
    try {
      await cartService.clearCart();
      resetCart(); // Badge goes to 0 instantly
      loadCart();
    } catch {
      setError('Failed to clear cart.');
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading cart items..." /></Layout>;

  const items = cart?.items || [];
  
  // Real-time live calculation: dynamically computes subtotal using the live active quantity for each item
  const subtotal = items.reduce((acc, item) => {
    const price = parseFloat(item.unit_price || item.product_variant?.price || item.price || 0);
    const activeQty = inputQuantities[item.id] !== undefined && inputQuantities[item.id] !== ''
      ? parseInt(inputQuantities[item.id], 10) || item.quantity
      : item.quantity;
    return acc + price * activeQty;
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
            <p style={{ color: 'rgba(23, 23, 0.65)', margin: '0 auto 1.8rem', maxWidth: '400px' }}>
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
                    const name = item.product_name || item.product_variant?.product?.name || 'Apparel Item';
                    const size = item.size || item.product_variant?.size || '';
                    const color = item.color || item.product_variant?.color || '';
                    const unitPrice = parseFloat(item.unit_price || item.product_variant?.price || item.price || 0);
                    const activeQty = inputQuantities[item.id] !== undefined && inputQuantities[item.id] !== ''
                      ? parseInt(inputQuantities[item.id], 10) || item.quantity
                      : item.quantity;
                    const itemTotal = unitPrice * activeQty;

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
                              onClick={() => handleUpdateQuantity(item.id, activeQty, -1)}
                              disabled={activeQty <= 1}
                              aria-label="Decrease quantity"
                              style={{
                                width: '30px',
                                height: '30px',
                                border: '1px solid rgba(23, 23, 23, 0.18)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-white)',
                                cursor: activeQty <= 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 800,
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: activeQty <= 1 ? 0.4 : 1,
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={isRetailCustomer ? MAX_RETAIL_QTY : undefined}
                              value={inputQuantities[item.id] !== undefined ? inputQuantities[item.id] : item.quantity}
                              onChange={(e) => handleInputChange(item.id, e.target.value)}
                              onBlur={(e) => {
                                if (syncTimeoutRef.current[item.id]) {
                                  clearTimeout(syncTimeoutRef.current[item.id]);
                                }
                                let parsed = parseInt(e.target.value, 10);
                                if (!isNaN(parsed) && parsed >= 1) {
                                  if (isRetailCustomer && parsed > MAX_RETAIL_QTY) {
                                    parsed = MAX_RETAIL_QTY;
                                    setError(`Retail order limit is ${MAX_RETAIL_QTY} units per item.`);
                                  }
                                  handleSetQuantity(item.id, parsed);
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
                                border: `1px solid ${isRetailCustomer && activeQty >= MAX_RETAIL_QTY ? 'var(--color-coral)' : 'rgba(23, 23, 23, 0.22)'}`,
                                padding: '0 0.25rem',
                                backgroundColor: 'var(--color-white)',
                                color: 'var(--color-black)',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, activeQty, 1)}
                              disabled={isRetailCustomer && activeQty >= MAX_RETAIL_QTY}
                              aria-label="Increase quantity"
                              style={{
                                width: '30px',
                                height: '30px',
                                border: '1px solid rgba(23, 23, 23, 0.18)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-white)',
                                cursor: isRetailCustomer && activeQty >= MAX_RETAIL_QTY ? 'not-allowed' : 'pointer',
                                fontWeight: 800,
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isRetailCustomer && activeQty >= MAX_RETAIL_QTY ? 0.4 : 1,
                              }}
                            >
                              +
                            </button>
                          </div>
                          {isRetailCustomer && activeQty >= MAX_RETAIL_QTY && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-coral)', fontWeight: 800, marginTop: '0.2rem' }}>
                              Max retail limit (50 pcs)
                            </div>
                          )}
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
