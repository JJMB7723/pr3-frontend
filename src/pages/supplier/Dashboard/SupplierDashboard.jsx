import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import supplierService from '../../../services/supplierService';

const SupplierDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await supplierService.getProfile();
        setProfile(res.data || res.profile || res);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <Layout withSidebar><Loader message="Loading supplier portal..." /></Layout>;

  return (
    <Layout withSidebar>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>Supplier Logistics Console</h1>
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Raw material supply agreements, purchase orders, and inventory dispatch</p>
      </div>

      <div className="pr3-card" style={{ maxWidth: '640px' }}>
        <h3 style={{ borderBottom: '1px solid var(--color-black)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
          Vendor Profile
        </h3>
        <p><strong>Company:</strong> {profile?.company_name || 'Authorized PR3 Textile Partner'}</p>
        <p style={{ marginTop: '0.4rem' }}><strong>Contact Email:</strong> {profile?.contact_email || 'partner@supplier.com'}</p>
        <p style={{ marginTop: '0.4rem' }}><strong>Status:</strong> <span className="pr3-badge">ACTIVE PARTNER</span></p>
      </div>
    </Layout>
  );
};

export default SupplierDashboard;
