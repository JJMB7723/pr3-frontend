import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, withSidebar = false }) => {
  const { isAuthenticated } = useAuth();
  const showSidebar = withSidebar && isAuthenticated;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--color-white)',
      }}
    >
      <Navbar />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
        {showSidebar && <Sidebar />}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: showSidebar ? '1.5rem 1.8rem' : '1.5rem 0',
            width: '100%',
          }}
        >
          {showSidebar ? children : <div className="pr3-container">{children}</div>}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
