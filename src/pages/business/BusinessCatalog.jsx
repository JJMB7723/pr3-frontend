import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Loader from '../../components/common/Loader';
import ProductCard from '../../components/products/ProductCard';
import ProductFilter from '../../components/products/ProductFilter';
import productService from '../../services/productService';
import cartService from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';

const BusinessCatalog = () => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (variantId) => {
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
    <Layout withSidebar>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span className="pr3-badge pr3-badge-coral" style={{ marginBottom: '0.5rem' }}>
            Garment Selection
          </span>
          <h1 style={{ fontSize: '2.2rem', letterSpacing: '-0.03em' }}>Apparel Catalog</h1>
          <p style={{ color: 'rgba(23, 23, 23, 0.72)', fontSize: '0.95rem' }}>
            Browse active manufacturing items, inspect variant sizes, and order samples.
          </p>
        </div>

        {notification && (
          <div
            style={{
              padding: '1rem',
              marginBottom: '2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-coral)',
              backgroundColor: 'var(--color-coral-light)',
              fontWeight: 700,
              color: 'var(--color-coral)',
            }}
          >
            ✓ {notification}
          </div>
        )}

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
          <Loader message="Loading catalog..." />
        ) : filteredProducts.length === 0 ? (
          <div className="pr3-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>No products match your criteria</h3>
            <p style={{ color: 'rgba(23, 23, 23, 0.65)' }}>Try clearing your active search or category filters.</p>
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
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BusinessCatalog;

