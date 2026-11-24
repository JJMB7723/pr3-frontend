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

    try {
      await cartService.addItem({
        product_variant_id: selectedVariant.id,
        quantity: parseInt(quantity, 10),
      });
      setStatusMsg(`Added ${quantity} item(s) to your cart.`);
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
          <span className="pr3-badge" style={{ marginBottom: '0.5rem' }}>
            IN STOCK
          </span>
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
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '0.5rem 1rem',
                        fontWeight: 700,
                        border: '1px solid var(--color-black)',
                        backgroundColor: isSelected ? 'var(--color-black)' : 'var(--color-white)',
                        color: isSelected ? 'var(--color-white)' : 'var(--color-black)',
                        cursor: 'pointer',
                      }}
                    >
                      {v.size || 'STD'} - {v.color || 'Standard'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

          <Button
            variant="primary"
            onClick={handleAddToCart}
            style={{ width: '100%', padding: '0.8rem' }}
          >
            Add to Order
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;

