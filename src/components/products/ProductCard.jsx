import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { getProductImage } from '../../assets/apparelImages';

const ProductCard = ({ product, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const primaryVariant = product.variants && product.variants[0];
  const price = (primaryVariant && primaryVariant.price) || product.base_price || '0.00';
  const categoryName = product.category?.name || 'Apparel';
  const imageUrl = getProductImage(product);

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0)
    : (primaryVariant?.inventory?.quantity ?? null);
  const isOutOfStock = totalStock !== null && totalStock <= 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid rgba(23, 23, 23, 0.08)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: 'var(--shadow-subtle)',
        transition: 'var(--transition)',
        position: 'relative',
      }}
      className="pr3-luxury-card"
    >
      {/* Product Image Frame */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '112%',
          backgroundColor: '#F7F7F7',
          overflow: 'hidden',
        }}
      >
        <img
          src={imageUrl}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="pr3-luxury-img"
        />

        {/* Category Pill Tag */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 2,
          }}
        >
          <span
            className="pr3-badge"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              color: 'var(--color-black)',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            {categoryName}
          </span>
        </div>

        {/* Stock Badge */}
        {product.isActive !== false && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 2,
            }}
          >
            {isOutOfStock ? (
              <span
                className="pr3-badge"
                style={{
                  backgroundColor: '#e53e3e',
                  color: '#ffffff',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(229, 62, 62, 0.3)',
                }}
              >
                Out of Stock
              </span>
            ) : (
              <span className="pr3-badge pr3-badge-sage">
                In Stock
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div
        style={{
          padding: '1.6rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '0.6rem',
              gap: '0.6rem',
            }}
          >
            <h3
              style={{
                fontSize: '1.12rem',
                fontWeight: 800,
                color: 'var(--color-black)',
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
              }}
            >
              {product.name}
            </h3>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: 'var(--color-coral)',
                whiteSpace: 'nowrap',
              }}
            >
              ${parseFloat(price).toFixed(2)}
            </span>
          </div>

          <p
            style={{
              fontSize: '0.86rem',
              lineHeight: 1.55,
              color: 'rgba(23, 23, 23, 0.72)',
              marginBottom: '1.2rem',
            }}
          >
            {product.description || 'Apparel designed and manufactured to industrial quality standards.'}
          </p>

          {/* Variant Spec Tag with Gold Highlight */}
          {primaryVariant && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(23, 23, 23, 0.03)',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '1.4rem',
                color: 'var(--color-black)',
              }}
            >
              <span style={{ color: 'var(--color-gold)' }}>●</span>
              <span>{primaryVariant.size}</span>
              <span style={{ opacity: 0.3 }}>/</span>
              <span>{primaryVariant.color}</span>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: primaryVariant ? '1fr 1fr' : '1fr',
            gap: '0.6rem',
            paddingTop: '1.2rem',
            borderTop: '1px solid rgba(23, 23, 23, 0.06)',
          }}
        >
          <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
            <Button
              variant="secondary"
              style={{
                width: '100%',
                padding: '0.65rem 0.5rem',
                fontSize: '0.82rem',
              }}
            >
              View Details
            </Button>
          </Link>
          {primaryVariant && (
            <Button
              variant={isOutOfStock ? 'secondary' : 'coral'}
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && onAddToCart && onAddToCart(primaryVariant.id)}
              style={{
                width: '100%',
                padding: '0.65rem 0.5rem',
                fontSize: '0.82rem',
                opacity: isOutOfStock ? 0.6 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              }}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .pr3-luxury-card:hover {
          box-shadow: var(--shadow-hover) !important;
          transform: translateY(-4px) !important;
        }
        .pr3-luxury-card:hover .pr3-luxury-img {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
