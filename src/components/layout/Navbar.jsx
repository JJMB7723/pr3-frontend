import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const Navbar = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isLinkActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(23, 23, 23, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        className="pr3-container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px',
        }}
      >
        {/* Brand Wordmark & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <span
              style={{
                fontSize: '1.9rem',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: 'var(--color-black)',
              }}
            >
              PR3
            </span>
            <span
              style={{
                width: '9px',
                height: '9px',
                backgroundColor: 'var(--color-coral)',
                borderRadius: '50%',
                display: 'inline-block',
                marginBottom: '3px',
              }}
            />
          </Link>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              borderLeft: '1px solid rgba(23, 23, 23, 0.12)',
              paddingLeft: '1.2rem',
              color: 'var(--color-black)',
              opacity: 0.65,
              display: 'none',
            }}
            className="pr3-desktop-brand-tag"
          >
            Atelier &amp; Manufacturing
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.2rem',
          }}
          className="pr3-desktop-nav"
        >
          <Link
            to="/products"
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: isLinkActive('/products') ? 'var(--color-coral)' : 'var(--color-black)',
              transition: 'var(--transition)',
            }}
          >
            Catalog
          </Link>

          {isAuthenticated ? (
            <>
              {role === 'customer' && (
                <>
                  <Link
                    to="/cart"
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: isLinkActive('/cart') ? 'var(--color-coral)' : 'var(--color-black)',
                    }}
                  >
                    Cart
                  </Link>
                  <Link
                    to="/orders"
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: isLinkActive('/orders') ? 'var(--color-coral)' : 'var(--color-black)',
                    }}
                  >
                    My Orders
                  </Link>
                </>
              )}

              {/* Role Dashboard Quick Button with Muted Gold & Coral Accents */}
              <Link to={`/${role}/dashboard`} style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.5rem 1.1rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(23, 23, 23, 0.12)',
                    backgroundColor: 'rgba(23, 23, 23, 0.03)',
                    color: 'var(--color-black)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'var(--transition)',
                  }}
                  className="pr3-portal-pill"
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      backgroundColor: 'var(--color-gold)',
                      borderRadius: '50%',
                    }}
                  />
                  {role} Portal
                </span>
              </Link>

              <div
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--color-black)',
                }}
              >
                {user?.first_name || user?.firstName}
              </div>

              <Button
                variant="secondary"
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.82rem',
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button
                  variant="secondary"
                  style={{
                    padding: '0.55rem 1.3rem',
                    fontSize: '0.84rem',
                  }}
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button
                  variant="coral"
                  style={{
                    padding: '0.55rem 1.4rem',
                    fontSize: '0.84rem',
                  }}
                >
                  Join PR3
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          className="pr3-mobile-toggle"
          style={{
            background: 'none',
            border: '1px solid rgba(23, 23, 23, 0.14)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.8rem',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 800,
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(23, 23, 23, 0.08)',
            backgroundColor: 'var(--color-white)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
          }}
        >
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontWeight: 800, fontSize: '1rem' }}
          >
            Catalog
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={`/${role}/dashboard`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-coral)' }}
              >
                {role.toUpperCase()} Dashboard
              </Link>
              {role === 'customer' && (
                <>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: 700 }}
                  >
                    Shopping Cart
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: 700 }}
                  >
                    My Orders
                  </Link>
                </>
              )}
              <Button variant="secondary" onClick={handleLogout} style={{ marginTop: '0.5rem' }}>
                Logout
              </Button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" style={{ width: '100%' }}>Sign In</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="coral" style={{ width: '100%' }}>Create Account</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .pr3-desktop-brand-tag { display: inline-block !important; }
          .pr3-desktop-nav { display: flex !important; }
          .pr3-mobile-toggle { display: none !important; }
        }
        @media (max-width: 899px) {
          .pr3-desktop-brand-tag { display: none !important; }
          .pr3-desktop-nav { display: none !important; }
          .pr3-mobile-toggle { display: block !important; }
        }
        .pr3-portal-pill:hover {
          border-color: var(--color-coral) !important;
          color: var(--color-coral) !important;
        }
      `}</style>
    </header>
  );
};

export default Navbar;
