import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { role } = useAuth();

  // Role-specific navigation items (Material Supplier removed)
  const navConfigs = {
    admin: [
      { to: '/admin/dashboard', label: 'Overview' },
      { to: '/admin/products', label: 'Products & Categories' },
      { to: '/admin/orders', label: 'Orders & Fulfillment' },
      { to: '/business/bulk-orders', label: 'Wholesale Bulk Orders' },
      { to: '/admin/inventory', label: 'Inventory & Stock' },
      { to: '/admin/manufacturing', label: 'Manufacturing & QC' },
      { to: '/admin/deliveries', label: 'Dispatch & Deliveries' },
      { to: '/admin/returns', label: 'Return Requests' },
      { to: '/admin/bulk-replacements', label: 'Bulk Replacements' },
    ],
    business: [
      { to: '/business/dashboard', label: 'Overview' },
      { to: '/business/bulk-orders', label: 'Place Bulk Order' },
      { to: '/business/orders', label: 'Order History' },
      { to: '/business/catalog', label: 'Apparel Catalog' },
      { to: '/customer/profile', label: 'Account Profile' },
    ],
    delivery: [
      { to: '/delivery/dashboard', label: 'Overview' },
      { to: '/delivery/assigned', label: 'Assigned Shipments' },
    ],
    customer: [
      { to: '/orders', label: 'Order History' },
      { to: '/cart', label: 'Shopping Cart' },
      { to: '/customer/profile', label: 'Account Profile' },
    ],
  };

  const items = navConfigs[role] || [];

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        flexShrink: 0,
        backgroundColor: 'var(--color-white)',
        borderRight: '1px solid rgba(23, 23, 23, 0.08)',
        position: 'sticky',
        top: '70px',
        height: 'calc(100vh - 70px)',
        maxHeight: 'calc(100vh - 70px)',
        overflowY: 'auto',
        padding: '1.2rem 1rem',
        zIndex: 900,
      }}
    >
      <div
        style={{
          fontSize: '0.74rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1.2rem',
          color: 'var(--color-oxblood)',
          paddingLeft: '0.8rem',
        }}
      >
        {role === 'business' ? 'Corporate Portal' : `${role} Operations`}
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.75rem 1rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--color-oxblood)' : 'var(--color-black)',
              backgroundColor: isActive ? 'var(--color-apricot-light)' : 'transparent',
              borderLeft: isActive ? '4px solid var(--color-oxblood)' : '4px solid transparent',
              transition: 'var(--transition)',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
