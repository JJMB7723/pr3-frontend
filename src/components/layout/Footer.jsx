import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
  const { isAuthenticated, role } = useAuth();
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-white)',
        borderTop: '1px solid rgba(23, 23, 23, 0.08)',
        padding: '2.5rem 0 1.5rem 0',
        marginTop: '2.5rem',
      }}
    >
      <div className="pr3-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(23, 23, 23, 0.08)',
          }}
        >
          {/* Column 1: Brand & Identity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.05em' }}>
                PR3
              </span>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  backgroundColor: 'var(--color-coral)',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'rgba(23, 23, 23, 0.75)' }}>
              Modern clothing brand and enterprise apparel manufacturing platform connecting fabric supply, cutting, and commercial distribution.
            </p>
          </div>

          {/* Column 2: Portals */}
          <div>
            <h4
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '1.2rem',
                color: 'var(--color-coral)',
              }}
            >
              Platform Portals
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li>
                <Link to="/products" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-black)' }}>
                  Apparel Catalog
                </Link>
              </li>
              <li>
                <Link
                  to={isAuthenticated ? (role === 'business' ? '/business/dashboard' : '/business/bulk-orders') : '/login'}
                  style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-black)' }}
                >
                  Business Procurement
                </Link>
              </li>
              <li>
                <Link
                  to={isAuthenticated ? (role === 'delivery' ? '/delivery/dashboard' : '/orders') : '/login'}
                  style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-black)' }}
                >
                  Supplier Logistics
                </Link>
              </li>
              <li>
                <Link
                  to={isAuthenticated ? (role === 'admin' ? '/admin/dashboard' : `/${role}/dashboard`) : '/login'}
                  style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-black)' }}
                >
                  Admin Operations Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Standards (Sage Green & Muted Gold) */}
          <div>
            <h4
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '1.2rem',
                color: 'var(--color-sage)',
              }}
            >
              Operations &amp; Quality
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-gold)' }}>●</span> Quality Inspection Workflows
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-gold)' }}>●</span> Automated Stock Deductions
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-gold)' }}>●</span> Real-time Batch Tracking
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--color-gold)' }}>●</span> Secure Role-Gated Access
              </li>
            </ul>
          </div>

          {/* Column 4: Architecture */}
          <div>
            <h4
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '1.2rem',
                color: 'var(--color-gold)',
              }}
            >
              System Status
            </h4>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'rgba(23, 23, 23, 0.75)' }}>
              Built with React, Vite, Node.js, Express, Sequelize, and PostgreSQL.
            </p>
            <div style={{ marginTop: '1.2rem' }}>
              <span className="pr3-badge pr3-badge-sage">
                ● Systems Operational
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'rgba(23, 23, 23, 0.65)',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} PR3 Fashion &amp; Apparel Manufacturing.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span>White</span>
            <span>Black</span>
            <span style={{ color: 'var(--color-coral)', fontWeight: 800 }}>Coral</span>
            <span style={{ color: 'var(--color-sage)', fontWeight: 800 }}>Sage Green</span>
            <span style={{ color: 'var(--color-gold)', fontWeight: 800 }}>Muted Gold</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
