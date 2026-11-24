import React from 'react';
import Button from '../common/Button';

const ProductFilter = ({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onReset,
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid rgba(23, 23, 23, 0.08)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.6rem 2rem',
        marginBottom: '3rem',
        boxShadow: 'var(--shadow-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        alignItems: 'flex-end',
      }}
    >
      {/* Search Input */}
      <div style={{ flex: '1 1 320px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 800,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-black)',
          }}
        >
          Search Collection
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by apparel name, SKU, or category..."
            className="pr3-input"
            style={{ paddingRight: '2.5rem' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'rgba(23, 23, 23, 0.5)',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Dropdown */}
      <div style={{ flex: '0 1 260px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 800,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-black)',
          }}
        >
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="pr3-input"
          style={{ cursor: 'pointer' }}
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {(search || selectedCategory) && (
        <Button
          variant="secondary"
          onClick={onReset}
          style={{
            padding: '0.8rem 1.6rem',
            fontSize: '0.85rem',
          }}
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
};

export default ProductFilter;
