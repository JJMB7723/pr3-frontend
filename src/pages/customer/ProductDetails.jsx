import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import productService from '../../services/productService';
import cartService from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { getProductImage } from '../../assets/apparelImages';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productService.getProduct(id);
        const data = res.data || res.product || res;
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch {
        // Handled via null state
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setStatusMsg('Please sign in to add this item to your cart.');
      return;
    }
    if (!selectedVariant) {
      setStatusMsg('Please select a product variant first.');
      return;
    }

    const availableStock = selectedVariant.inventory?.quantity ?? 0;
    if (availableStock <= 0) {
      setStatusMsg('Cannot add to order: This product variant is currently out of stock.');
      return;
    }

    const requestedQty = parseInt(quantity, 10);
    if (requestedQty > availableStock) {
      setStatusMsg(`Cannot add ${requestedQty} units: Only ${availableStock} units available in stock.`);
      return;
    }

    try {
      await cartService.addItem({
        product_variant_id: selectedVariant.id,
        quantity: requestedQty,
      });
      setStatusMsg(`Added ${requestedQty} item(s) to your cart.`);
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to add to cart.');
    }
  };

  if (loading) return <Layout><Loader message="Loading product details..." /></Layout>;

  if (!product) {
    return (
      <Layout>
        <div className="pr3-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Product Not Found</h2>
          <p style={{ margin: '1rem 0' }}>The requested product does not exist or has been discontinued.</p>
          <Link to="/">
            <Button variant="primary">Back to Catalog</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const currentPrice = selectedVariant?.price || product.base_price || 0;

  return (
    <Layout>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          &larr; Back to Catalog
        </Link>
      </div>

      <div
        className="pr3-card"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2.5rem',
          padding: '2.5rem',
        }}
      >
        {/* Product Visual / Spec Box */}
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--color-ivory)',
            minHeight: '440px',
            border: '1px solid rgba(23, 23, 23, 0.08)',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <img
            src={product.image_url || product.imageUrl || getProductImage(product)}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              right: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '0.8rem 1rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {product.category?.name || 'Garment'}
            </span>
            <code style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              {selectedVariant?.sku || product.sku || `SKU-${product.id}`}
            </code>
          </div>
        </div>

        {/* Product Details & Actions */}
        <div>
          {(() => {
            const availStock = selectedVariant?.inventory?.quantity ?? 0;
            if (availStock <= 0) {
              return (
                <span
                  className="pr3-badge"
                  style={{
                    backgroundColor: '#e53e3e',
                    color: '#ffffff',
                    fontWeight: 800,
                    marginBottom: '0.5rem',
                  }}
                >
                  ✕ OUT OF STOCK
                </span>
              );
            }
            return (
              <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.5rem' }}>
                ✓ IN STOCK ({availStock} available)
              </span>
            );
          })()}
          <h1 style={{ fontSize: '2rem', margin: '0.5rem 0 1rem' }}>{product.name}</h1>
          <p style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem' }}>
            ${parseFloat(currentPrice).toFixed(2)}
          </p>

          <p style={{ lineHeight: '1.6', marginBottom: '2rem' }}>
            {product.description || 'Standard high-grade textile build meeting industrial manufacturing criteria.'}
          </p>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Select Variant (Size / Color)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const vStock = v.inventory?.quantity ?? 0;
                  const isOOS = vStock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '0.5rem 1rem',
                        fontWeight: 700,
                        border: `1px solid ${
                          isSelected
                            ? 'var(--color-black)'
                            : isOOS
                            ? 'rgba(229, 62, 62, 0.4)'
                            : 'rgba(23, 23, 23, 0.2)'
                        }`,
                        backgroundColor: isSelected
                          ? 'var(--color-black)'
                          : isOOS
                          ? '#fff5f5'
                          : 'var(--color-white)',
                        color: isSelected
                          ? 'var(--color-white)'
                          : isOOS
                          ? '#c53030'
                          : 'var(--color-black)',
                        cursor: 'pointer',
                      }}
                    >
                      {v.size || 'STD'} - {v.color || 'Standard'}{' '}
                      {isOOS ? '(Out of stock)' : `(${vStock} in stock)`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                }}
              >
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="pr3-input"
                style={{ width: '80px' }}
              />
            </div>

            {selectedVariant && (selectedVariant.inventory?.quantity ?? 0) <= 0 && (
              <p style={{ color: '#e53e3e', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}>
                ✕ This variant is currently out of stock. Please select another variant.
              </p>
            )}

            {selectedVariant &&
              (selectedVariant.inventory?.quantity ?? 0) > 0 &&
              quantity > (selectedVariant.inventory?.quantity ?? 0) && (
                <p style={{ color: '#c05621', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}>
                  ⚠️ Requested quantity ({quantity}) exceeds available stock ({selectedVariant.inventory.quantity} units).
                </p>
              )}
          </div>

          {statusMsg && (
            <div
              style={{
                padding: '0.8rem',
                border: '1px solid var(--color-black)',
                backgroundColor: 'var(--color-ivory)',
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              {statusMsg}
            </div>
          )}

          {(() => {
            const availStock = selectedVariant?.inventory?.quantity ?? 0;
            const isOutOfStock = !selectedVariant || availStock <= 0;
            const exceedsStock = quantity > availStock;
            const isBlocked = isOutOfStock || exceedsStock;

            let btnText = 'Add to Order';
            if (isOutOfStock) btnText = '✕ Out of Stock';
            else if (exceedsStock) btnText = '⚠️ Quantity Exceeds Available Stock';

            return (
              <Button
                variant={isBlocked ? 'secondary' : 'primary'}
                onClick={handleAddToCart}
                disabled={isBlocked}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  opacity: isBlocked ? 0.6 : 1,
                  cursor: isBlocked ? 'not-allowed' : 'pointer',
                }}
              >
                {btnText}
              </Button>
            );
          })()}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;

