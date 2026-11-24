import React, { useEffect } from 'react';
import Button from './Button';

/**
 * Strict Tri-Color Modal Dialog
 */
const Modal = ({ isOpen, title, onClose, children, maxWidth = '500px' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="pr3-card"
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--color-white)',
          border: '2px solid var(--color-black)',
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--color-black)',
            paddingBottom: '0.8rem',
            marginBottom: '1.2rem',
          }}
        >
          <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </h3>
          <Button variant="secondary" onClick={onClose} style={{ padding: '0.2rem 0.6rem' }}>
            ✕
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;

