import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/products/ProductCard';
import ProductFilter from '../../components/products/ProductFilter';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import productService from '../../services/productService';
import cartService from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { HERO_IMAGE, CATEGORY_IMAGES } from '../../assets/apparelImages';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [notification, setNotification] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts({ category_id: category || undefined }),
        productService.getCategories(),
      ]);

      const items = Array.isArray(prodRes.data)
        ? prodRes.data
        : prodRes.data?.rows || prodRes.products || [];
      setProducts(items);

      const cats = Array.isArray(catRes.data)
        ? catRes.data
        : catRes.categories || [];
      setCategories(cats);
    } catch {
      // Empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (variantId) => {
    if (!isAuthenticated) {
      setNotification('Please sign in to add items to your shopping cart.');
      setTimeout(() => setNotification(''), 3500);
      return;
    }

    try {
      await cartService.addItem({ product_variant_id: variantId, quantity: 1 });
      setNotification('Garment added to your order.');
      setTimeout(() => setNotification(''), 3500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to cart.';
      setNotification(msg);
      setTimeout(() => setNotification(''), 3500);
    }
  };

  const filteredProducts = products.filter((p) =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <Layout>
      {/* =========================================================================
          1. EDITORIAL HERO SECTION (Modern Luxury Brand + Manufacturing)
          ========================================================================= */}
      <section
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid rgba(23, 23, 23, 0.08)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Left Column: Typography, Badges & High-Impact CTAs */}
        <div
          style={{
            padding: 'clamp(1.5rem, 4vw, 3rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span className="pr3-badge pr3-badge-gold">
              ★ Premium Apparel &amp; Commerce
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              marginBottom: '1rem',
              color: 'var(--color-black)',
            }}
          >
            Made with Precision. <br />
            <span style={{ color: 'var(--color-coral)' }}>Built for</span> Business.
          </h1>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: 'rgba(23, 23, 23, 0.78)',
              maxWidth: '520px',
              marginBottom: '1.5rem',
            }}
          >
            Discover quality apparel, streamlined manufacturing and dependable supply-chain solutions for modern businesses.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <a href="#featured-products" className="pr3-btn pr3-btn-coral">
              Explore Collection
            </a>
            {!isAuthenticated && (
              <Link to="/register" className="pr3-btn pr3-btn-secondary">
                Partner With Us
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Editorial Photograph Frame */}
        <div
          style={{
            position: 'relative',
            height: '100%',
            minHeight: '480px',
            backgroundColor: '#F7F7F7',
            overflow: 'hidden',
          }}
        >
          <img
            src={HERO_IMAGE}
            alt="PR3 Editorial Fashion & Manufacturing"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          {/* Elegant Floating Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-md)',
              padding: '0.8rem 1.4rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: 'var(--color-sage)',
                borderRadius: '50%',
              }}
            />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Factory Connected
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(23, 23, 23, 0.65)', fontWeight: 600 }}>
                Real-Time Stock &amp; QC
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Notification Banner */}
      {notification && (
        <div
          style={{
            padding: '0.85rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-coral)',
            backgroundColor: 'var(--color-coral-light)',
            fontWeight: 700,
            textAlign: 'center',
            color: 'var(--color-coral)',
          }}
        >
          ✓ {notification}
        </div>
      )}

      {/* =========================================================================
          2. FEATURED PRODUCT COLLECTION
          ========================================================================= */}
      <section id="featured-products" style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.5rem' }}>
              Current Production Batch
            </span>
            <h2 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Featured Collection</h2>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(23, 23, 23, 0.6)' }}>
            Showing {filteredProducts.length} verified products
          </div>
        </div>

        {/* Filter Bar */}
        <ProductFilter
          search={search}
          onSearchChange={setSearch}
          categories={categories}
          selectedCategory={category}
          onCategoryChange={setCategory}
          onReset={() => {
            setSearch('');
            setCategory('');
          }}
        />

        {loading ? (
          <Loader message="Loading apparel collection..." />
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              border: '1px solid rgba(23, 23, 23, 0.08)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              padding: '5rem 2rem',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.6rem' }}>
              No Products Match Your Criteria
            </h3>
            <p style={{ color: 'rgba(23, 23, 23, 0.7)', maxWidth: '440px', margin: '0 auto 1.8rem', fontSize: '0.92rem' }}>
              Try clearing your active filters to view all products currently in the catalog.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setCategory('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          3. PRODUCT CATEGORIES (Visual Cards with Sage & Gold Touches)
          ========================================================================= */}
      {categories.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.5rem' }}>
                Curated Categories
              </span>
              <h2 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Shop By Garment Type</h2>
            </div>
            {category && (
              <button
                type="button"
                onClick={() => setCategory('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-coral)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Clear Selection ✕
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {categories.slice(0, 4).map((c) => {
              const isSelected = String(category) === String(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => setCategory(isSelected ? '' : c.id)}
                  style={{
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--color-coral)' : 'rgba(23, 23, 23, 0.08)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-hover)' : 'var(--shadow-subtle)',
                    transition: 'var(--transition)',
                    position: 'relative',
                  }}
                  className="pr3-category-card"
                >
                  <div
                    style={{
                      height: '180px',
                      overflow: 'hidden',
                      backgroundColor: '#F5F5F5',
                    }}
                  >
                    <img
                      src={
                        c.name.toLowerCase().includes('shirt')
                          ? CATEGORY_IMAGES.shirt
                          : c.name.toLowerCase().includes('pant')
                          ? CATEGORY_IMAGES.pant
                          : c.name.toLowerCase().includes('short')
                          ? CATEGORY_IMAGES.shorts
                          : CATEGORY_IMAGES.apparel
                      }
                      alt={c.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                      className="pr3-category-img"
                    />
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: isSelected ? 'var(--color-coral)' : 'var(--color-gold)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Line #{c.id}
                      </span>
                      {isSelected && (
                        <span className="pr3-badge pr3-badge-coral" style={{ fontSize: '0.65rem' }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        marginTop: '0.3rem',
                        color: isSelected ? 'var(--color-coral)' : 'var(--color-black)',
                      }}
                    >
                      {c.name}
                    </h3>
                    <p style={{ fontSize: '0.84rem', marginTop: '0.5rem', color: 'rgba(23, 23, 23, 0.65)' }}>
                      {isSelected ? 'Viewing products in this category' : 'Browse items →'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          4. MANUFACTURING & PRODUCTION WORKFLOW (Sage Green & Muted Gold)
          ========================================================================= */}
      <section
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid rgba(23, 23, 23, 0.08)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
          <span className="pr3-badge pr3-badge-sage" style={{ marginBottom: '0.75rem' }}>
            Production &amp; Logistics
          </span>
          <h2 style={{ fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.9rem' }}>
            Apparel Manufacturing &amp; Quality Inspection
          </h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(23, 23, 23, 0.78)', marginBottom: '1.25rem' }}>
            The PR3 platform coordinates apparel production directly with warehouse stock management. Work orders track material staging, manufacturing completion, and quality inspection approval before items are cleared for shipment.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-sage-light)',
                  color: 'var(--color-sage)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Work orders linked directly to product variants</strong>
                <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.65)' }}>Direct linkage prevents inventory discrepancies between cutting and warehouse.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-sage-light)',
                  color: 'var(--color-sage)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Quality Inspection gates with audit records</strong>
                <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.65)' }}>Passed and failed batch counts are permanently logged for compliance.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-sage-light)',
                  color: 'var(--color-sage)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Automated stock adjustments upon sign-off</strong>
                <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.65)' }}>Approved garments immediately reflect in real-time commerce availability.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: '100%', minHeight: '400px', backgroundColor: '#F5F5F5', overflow: 'hidden' }}>
          <img
            src={CATEGORY_IMAGES.manufacturing}
            alt="Apparel Manufacturing & Craftsmanship"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </section>

      {/* =========================================================================
          5. BUSINESS PARTNERSHIP SECTION (Gold & Coral Accents)
          Hidden when logged into the portal (only shown to unauthenticated guests)
          ========================================================================= */}
      {!isAuthenticated && (
        <section
          style={{
            backgroundColor: 'var(--color-white)',
            border: '1px solid rgba(23, 23, 23, 0.08)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <div>
            <span className="pr3-badge pr3-badge-gold" style={{ marginBottom: '1rem' }}>
              ★ Commercial Procurement
            </span>
            <h2 style={{ fontSize: '2.4rem', letterSpacing: '-0.03em', marginBottom: '1.2rem' }}>
              Partner with PR3
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'rgba(23, 23, 23, 0.78)', marginBottom: '2.2rem' }}>
              Whether you are a retail customer purchasing individual items, a business client requiring bulk volume orders, or a textile vendor supplying raw materials, PR3 provides specialized portals for your operational role.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/register" className="pr3-btn pr3-btn-coral">
                Create an Account
              </Link>
              <Link to="/login" className="pr3-btn pr3-btn-secondary">
                Sign In to Your Portal
              </Link>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
            }}
          >
            <div className="pr3-card" style={{ padding: '1.8rem' }}>
              <span style={{ color: 'var(--color-coral)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Volume Orders
              </span>
              <h4 style={{ fontSize: '1.15rem', margin: '0.3rem 0 0.5rem' }}>Business Buyers</h4>
              <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.68)', lineHeight: 1.5 }}>
                Custom quotations, wholesale pricing, and procurement invoicing.
              </p>
            </div>

            <div className="pr3-card" style={{ padding: '1.8rem' }}>
              <span style={{ color: 'var(--color-sage)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Raw Materials
              </span>
              <h4 style={{ fontSize: '1.15rem', margin: '0.3rem 0 0.5rem' }}>Suppliers</h4>
              <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.68)', lineHeight: 1.5 }}>
                Purchase order fulfillment, dispatch updates, and profile agreements.
              </p>
            </div>

            <div className="pr3-card" style={{ padding: '1.8rem' }}>
              <span style={{ color: 'var(--color-gold)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Fulfillment
              </span>
              <h4 style={{ fontSize: '1.15rem', margin: '0.3rem 0 0.5rem' }}>Logistics</h4>
              <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.68)', lineHeight: 1.5 }}>
                Delivery route assignment and customer transit confirmation.
              </p>
            </div>

            <div className="pr3-card" style={{ padding: '1.8rem' }}>
              <span style={{ color: 'var(--color-black)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                E-Commerce
              </span>
              <h4 style={{ fontSize: '1.15rem', margin: '0.3rem 0 0.5rem' }}>Retail Customers</h4>
              <p style={{ fontSize: '0.84rem', color: 'rgba(23, 23, 23, 0.68)', lineHeight: 1.5 }}>
                Instant purchasing, cart management, tracking, and easy returns.
              </p>
            </div>
          </div>
        </section>
      )}

      <style>{`
        .pr3-category-card:hover .pr3-category-img {
          transform: scale(1.06);
        }
      `}</style>
    </Layout>
  );
};

export default Home;
