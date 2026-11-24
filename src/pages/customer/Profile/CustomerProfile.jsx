import React from 'react';
import Layout from '../../../components/layout/Layout';
import { useAuth } from '../../../context/AuthContext';

const CustomerProfile = () => {
  const { user } = useAuth();

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '640px' }}>
        <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          {user?.role === 'business' ? 'Corporate Account Profile' : 'Customer Account Profile'}
        </h1>

        <div className="pr3-card">
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Full Name</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.first_name || user?.firstName} {user?.last_name || user?.lastName}</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Email Address</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.email}</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Phone</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.phone || 'Not specified'}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>System Role</span>
            <div style={{ marginTop: '0.3rem' }}>
              <span className="pr3-badge">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomerProfile;
