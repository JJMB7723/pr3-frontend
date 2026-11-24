import React from 'react';

/**
 * Strict Tri-Color Loader
 */
const Loader = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        backgroundColor: 'var(--color-white)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--color-black)',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem',
        }}
      />
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-black)',
        }}
      >
        {message}
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;

