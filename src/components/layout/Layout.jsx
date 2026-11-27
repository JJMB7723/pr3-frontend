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
      <div className={`pr3-layout-body ${showSidebar ? 'pr3-has-sidebar' : ''}`}>
        {showSidebar && <Sidebar />}
        <main className={`pr3-main-content ${showSidebar ? 'pr3-main-with-sidebar' : ''}`}>
          {showSidebar ? children : <div className="pr3-container">{children}</div>}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
