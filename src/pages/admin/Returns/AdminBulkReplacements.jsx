import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import returnService from '../../../services/returnService';

const parseBulkReason = (rawReason = '') => {
  if (!rawReason) return { customerText: 'No details provided', adminLogs: [], resolution: null, isReplace: false, isRefund: false, exchangeSpec: '' };

  const adminLogMatches = [...rawReason.matchAll(/\[Admin Decision:\s*([^\]]+)\]/gi)];
  const adminLogs = adminLogMatches.map((m) => m[1].trim());

  let customerText = rawReason.replace(/\[Admin Decision:\s*[^\]]+\]/gi, '').trim();

  let resolution = null;
  const reqMatch = customerText.match(/^\[Requested:\s*([^\]]+)\]/i);
  if (reqMatch) {
    resolution = reqMatch[1].trim();
    customerText = customerText.replace(/^\[Requested:\s*[^\]]+\]\s*/i, '').trim();
  }

  const isReplace = (resolution && resolution.toUpperCase().includes('REPLACE')) ||
    (resolution && resolution.toUpperCase().includes('EXCHANGE')) ||
    customerText.toUpperCase().includes('EXCHANGE') ||
    customerText.toUpperCase().includes('REPLACE') ||
    customerText.toLowerCase().includes('size') ||
    customerText.toLowerCase().includes('color');

  const isRefund = (resolution && resolution.toUpperCase().includes('REFUND')) ||
    customerText.toUpperCase().includes('REFUND') ||
    customerText.toLowerCase().includes('damag') ||
    customerText.toLowerCase().includes('defect');

  return { customerText, adminLogs, resolution, isReplace, isRefund };
};

const AdminBulkReplacements = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EXCHANGE' | 'REFUND' | 'REQUESTED' | 'APPROVED' | 'COMPLETED'

  // Modal inspection
  const [activeModalRma, setActiveModalRma] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadBulkReturns();
  }, []);

  const loadBulkReturns = async () => {
    try {
      const res = await returnService.getReturns();
      const allReturns = Array.isArray(res.data) ? res.data : res.data?.rows || [];

      // Filter specifically for bulk / corporate orders:
      // Identified by: user role === 'business', or 'BULK' in reason, or return items quantity >= 10
      const bulkOnly = allReturns.filter((r) => {
        const isBizUser = r.user?.role === 'business';
        const hasBulkTag = (r.reason || '').toUpperCase().includes('BULK');
        const totalUnits = (r.return_items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);
        return isBizUser || hasBulkTag || totalUnits >= 10;
      });

      setReturns(bulkOnly);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to load bulk replacement claims.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status, resolution = '') => {
    setProcessingId(id);
    try {
      const resLabel = resolution ? ` [${resolution.toUpperCase()}]` : '';
      const notes = actionNotes.trim()
        ? actionNotes.trim()
        : `Admin processed bulk action ${status.toUpperCase()}${resLabel}`;

      await returnService.reviewReturn(id, {
        status,
        resolution,
        notes,
      });

      setMsg({
        text: `Bulk Claim #${id} updated: ${status.toUpperCase()}${resLabel}.`,
        type: 'success',
      });
      setActionNotes('');
      setActiveModalRma(null);
      await loadBulkReturns();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Action failed.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleInspectRestock = async (returnItemId, isRestockable) => {
    try {
      const res = await returnService.inspectAndRestock(returnItemId, {
        is_restockable: isRestockable,
      });

      setMsg({
        text: res.message || (isRestockable ? 'Bulk items restocked to warehouse inventory.' : 'Lot marked damaged; no restock.'),
        type: 'success',
      });
      await loadBulkReturns();
      if (activeModalRma) {
        const updated = returns.find((r) => r.id === activeModalRma.id);
        if (updated) setActiveModalRma(updated);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Restock inspection failed.', type: 'error' });
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading corporate replacements console..." /></Layout>;

  // Metrics calculation
  const totalClaims = returns.length;
  const pendingCount = returns.filter((r) => (r.returnStatus || r.return_status || r.status) === 'requested').length;
  
  let totalUnitsToExchange = 0;
  let totalRefundValue = 0;

  returns.forEach((r) => {
    const parsed = parseBulkReason(r.reason);
    const units = (r.return_items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
    if (parsed.isReplace) {
      totalUnitsToExchange += units;
    } else {
      // Estimate refund based on order amount or unit items
      const orderTotal = parseFloat(r.order?.total_amount || 0);
      totalRefundValue += orderTotal;
    }
  });

  // Filter & Search
  const filteredReturns = returns.filter((r) => {
    const status = (r.returnStatus || r.return_status || r.status || 'requested').toLowerCase();
    const parsed = parseBulkReason(r.reason);

    if (filterType === 'EXCHANGE' && !parsed.isReplace) return false;
    if (filterType === 'REFUND' && !parsed.isRefund) return false;
    if (filterType === 'REQUESTED' && status !== 'requested') return false;
    if (filterType === 'APPROVED' && status !== 'approved') return false;
    if (filterType === 'COMPLETED' && status !== 'completed') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const orderNum = (r.order?.order_number || r.order?.orderNumber || `Order #${r.order_id}`).toLowerCase();
    const clientName = `${r.user?.first_name || ''} ${r.user?.last_name || ''} ${r.user?.email || ''}`.toLowerCase();
    const reasonText = (r.reason || '').toLowerCase();
    const rmaCode = `pr3-rma-${2000 + r.id}`;

    return orderNum.includes(term) || clientName.includes(term) || reasonText.includes(term) || rmaCode.includes(term);
  });

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.4rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6B27A', display: 'block', marginBottom: '0.3rem' }}>
            CORPORATE VOLUME PROCUREMENT
          </span>
          <h1 style={{ fontSize: '1.9rem', letterSpacing: '-0.03em', margin: 0 }}>
            Bulk Order Replacements & Returns
          </h1>
          <p style={{ color: '#777', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            Manage commercial wholesale claims: authorize size & colorway batch exchanges, approve damaged lot refunds, and track warehouse restock.
          </p>
        </div>

        {/* Message Banner */}
        {msg.text && (
          <div
            style={{
              padding: '0.85rem 1.2rem',
              borderRadius: '6px',
              border: msg.type === 'error' ? '1px solid #c0392b' : '1px solid #4A0F14',
              backgroundColor: msg.type === 'error' ? '#fdf0ef' : '#fff8f0',
              color: msg.type === 'error' ? '#c0392b' : '#4A0F14',
              marginBottom: '1.2rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{msg.text}</span>
            <button
              onClick={() => setMsg({ text: '', type: 'info' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'inherit' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.4rem' }}>
          <div className="pr3-card" style={{ padding: '1.2rem' }}>
            <div style={metricLabelStyle}>Total Bulk Claims</div>
            <div style={metricValueStyle}>{totalClaims}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Commercial volume RMAs</div>
          </div>

          <div className="pr3-card" style={{ padding: '1.2rem', borderLeft: '4px solid #F6B27A' }}>
            <div style={metricLabelStyle}>Pending Corporate Review</div>
            <div style={{ ...metricValueStyle, color: '#4A0F14' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Awaiting decision action</div>
          </div>

          <div className="pr3-card" style={{ padding: '1.2rem', borderLeft: '4px solid #0d47a1' }}>
            <div style={metricLabelStyle}>Units for Size/Color Exchange</div>
            <div style={{ ...metricValueStyle, color: '#0d47a1' }}>{totalUnitsToExchange} <span style={{ fontSize: '1rem', fontWeight: 700 }}>pcs</span></div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Replacement batch required</div>
          </div>

          <div className="pr3-card" style={{ padding: '1.2rem', borderLeft: '4px solid #2d7a2d' }}>
            <div style={metricLabelStyle}>Total Damaged Lot Refund Value</div>
            <div style={{ ...metricValueStyle, color: '#2d7a2d' }}>
              ${totalRefundValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Damaged goods refund credit</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pr3-card" style={{ padding: '0.9rem 1.2rem', marginBottom: '1.4rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="Search by RMA, Order #, Corporate Client, or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr3-input"
              style={{ width: '100%', padding: '0.6rem 0.9rem', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Bulk Claims' },
              { id: 'EXCHANGE', label: '🔄 Size/Color Exchanges' },
              { id: 'REFUND', label: '💵 Damaged Lot Refunds' },
              { id: 'REQUESTED', label: 'Pending Review' },
              { id: 'APPROVED', label: 'Authorized' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: filterType === f.id ? '1.5px solid #4A0F14' : '1px solid #ddd',
                  background: filterType === f.id ? '#4A0F14' : '#fff',
                  color: filterType === f.id ? '#fff' : '#555',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        {filteredReturns.length === 0 ? (
          <div className="pr3-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#444' }}>No bulk procurement claims match this filter.</p>
            <p style={{ color: '#888', fontSize: '0.88rem', marginTop: '0.3rem' }}>All volume orders are running optimally.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="pr3-table">
              <thead>
                <tr>
                  <th>Bulk RMA & Date</th>
                  <th>Corporate Client</th>
                  <th>Contract Order</th>
                  <th>Garment & Volume</th>
                  <th>Claim Type & Target Action</th>
                  <th>Status</th>
                  <th>Decision Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((r) => {
                  const status = (r.returnStatus || r.return_status || r.status || 'requested').toLowerCase();
                  const rmaCode = `PR3-RMA-${2000 + r.id}`;
                  const orderNum = r.order?.order_number || r.order?.orderNumber || `Order #${r.order_id}`;
                  const clientName = `${r.user?.first_name || 'Corporate Buyer'} ${r.user?.last_name || ''}`.trim();
                  const clientEmail = r.user?.email || '';
                  const returnItems = r.return_items || [];
                  const parsed = parseBulkReason(r.reason);

                  let badgeStyle = { background: '#fff8f0', color: '#4A0F14', border: '1.5px solid #F6B27A' };
                  if (status === 'approved') badgeStyle = { background: '#f5f0ef', color: '#4A0F14', border: '1.5px solid #4A0F14' };
                  if (status === 'completed') badgeStyle = { background: '#edf7ed', color: '#2d7a2d', border: '1.5px solid #2d7a2d' };
                  if (status === 'rejected') badgeStyle = { background: '#fdf0ef', color: '#c0392b', border: '1.5px solid #c0392b' };

                  return (
                    <tr key={r.id}>
                      {/* RMA */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#4A0F14', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {rmaCode}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.15rem' }}>
                          {new Date(r.createdAt || r.created_at).toLocaleDateString()}
                        </div>
                        <span style={{ display: 'inline-block', marginTop: '0.2rem', padding: '0.15rem 0.45rem', fontSize: '0.68rem', fontWeight: 800, background: '#4A0F14', color: '#fff', borderRadius: '3px' }}>
                          BULK B2B
                        </span>
                      </td>

                      {/* Client */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#222' }}>{clientName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#777' }}>{clientEmail}</div>
                        <span style={{ fontSize: '0.72rem', color: '#F6B27A', fontWeight: 800 }}>Corporate Account</span>
                      </td>

                      {/* Contract Order */}
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{orderNum}</div>
                        {r.order?.total_amount && (
                          <div style={{ fontSize: '0.82rem', color: '#4A0F14', fontWeight: 700 }}>
                            ${parseFloat(r.order.total_amount).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Garment & Volume */}
                      <td>
                        {returnItems.length === 0 ? (
                          <span style={{ color: '#888' }}>Bulk Items</span>
                        ) : (
                          returnItems.map((item, idx) => {
                            const variant = item.order_item?.product_variant || {};
                            const prod = variant.product || {};
                            const name = prod.name || `Garment Item #${item.order_item_id}`;
                            const spec = [variant.size, variant.color].filter(Boolean).join(' · ');

                            return (
                              <div key={idx} style={{ marginBottom: idx > 0 ? '0.35rem' : 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#222' }}>
                                  {name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                  {spec || 'Standard Spec'}
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#4A0F14', marginTop: '0.1rem' }}>
                                  Claim Quantity: {item.quantity} units
                                </div>
                              </div>
                            );
                          })
                        )}
                      </td>

                      {/* Claim Type & Details */}
                      <td style={{ minWidth: '260px', maxWidth: '360px' }}>
                        <div style={{ marginBottom: '0.45rem' }}>
                          {parsed.isReplace ? (
                            <span style={tagStyle('#e8f4fd', '#0d47a1', '#90caf9')}>
                              🔄 Bulk Size / Color Exchange
                            </span>
                          ) : (
                            <span style={tagStyle('#fdf0ef', '#c0392b', '#ef9a9a')}>
                              💵 Damaged Lot Refund Requested
                            </span>
                          )}
                        </div>

                        {/* Customer Issue Box */}
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#1a1a1a',
                            lineHeight: 1.45,
                            background: '#faf8f7',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #eee5e0',
                          }}
                        >
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#888', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>
                            {parsed.isReplace ? 'Exchange Specification:' : 'Damage Report:'}
                          </div>
                          {parsed.resolution || parsed.customerText}
                        </div>

                        {/* Admin Decision Trail */}
                        {parsed.adminLogs.length > 0 && (
                          <div style={{ marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' }}>
                              Decision Trail:
                            </div>
                            {parsed.adminLogs.map((log, lIdx) => (
                              <div
                                key={lIdx}
                                style={{
                                  fontSize: '0.76rem',
                                  color: '#4A0F14',
                                  background: '#fffaf8',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #4A0F14',
                                  fontWeight: 600,
                                  lineHeight: 1.35,
                                }}
                              >
                                {log}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            ...badgeStyle,
                          }}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Decision Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {status === 'requested' && (
                            <>
                              {parsed.isReplace ? (
                                <Button
                                  variant="primary"
                                  onClick={() => handleReview(r.id, 'approved', 'replacement batch')}
                                  disabled={processingId === r.id}
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#0d47a1', color: '#fff', border: 'none' }}
                                  title="Authorize replacement batch production / exchange dispatch"
                                >
                                  Authorize Exchange
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  onClick={() => handleReview(r.id, 'approved', 'damaged refund')}
                                  disabled={processingId === r.id}
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#2d7a2d', color: '#fff', border: 'none' }}
                                  title="Authorize commercial refund credit for damaged items"
                                >
                                  Authorize Refund
                                </Button>
                              )}

                              <Button
                                variant="secondary"
                                onClick={() => handleReview(r.id, 'rejected')}
                                disabled={processingId === r.id}
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#c0392b' }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setActiveModalRma(r);
                              setActionNotes('');
                            }}
                            style={{
                              background: '#fff',
                              border: '1.5px solid #4A0F14',
                              color: '#4A0F14',
                              borderRadius: '4px',
                              padding: '0.32rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Inspect Bulk Lot
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Inspector for Bulk Lot */}
        {activeModalRma && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '8px',
                maxWidth: '750px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F6B27A' }}>
                    BULK PROCUREMENT LOT INSPECTOR
                  </span>
                  <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.45rem' }}>
                    PR3-RMA-{2000 + activeModalRma.id}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveModalRma(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 800, color: '#888' }}
                >
                  ×
                </button>
              </div>

              {/* Order Snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.4rem', background: '#faf8f7', padding: '1rem', borderRadius: '6px' }}>
                <div>
                  <div style={detailLabelStyle}>Corporate Client</div>
                  <div style={{ fontWeight: 700 }}>
                    {activeModalRma.user?.first_name} {activeModalRma.user?.last_name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#777' }}>{activeModalRma.user?.email}</div>
                </div>
                <div>
                  <div style={detailLabelStyle}>Contract Order Reference</div>
                  <div style={{ fontWeight: 700 }}>
                    {activeModalRma.order?.order_number || activeModalRma.order?.orderNumber || `Order #${activeModalRma.order_id}`}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#777' }}>
                    Wholesale Total: <strong>${parseFloat(activeModalRma.order?.total_amount || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              {(() => {
                const parsedModal = parseBulkReason(activeModalRma.reason);
                return (
                  <div style={{ marginBottom: '1.4rem' }}>
                    <div style={detailLabelStyle}>Corporate Claim Specification</div>
                    <div style={{ padding: '1rem', background: '#fffaf6', borderLeft: '4px solid #F6B27A', borderRadius: '4px', lineHeight: 1.5 }}>
                      <div style={{ marginBottom: '0.6rem' }}>
                        <span style={tagStyle(parsedModal.isReplace ? '#e8f4fd' : '#fdf0ef', parsedModal.isReplace ? '#0d47a1' : '#c0392b', parsedModal.isReplace ? '#90caf9' : '#ef9a9a')}>
                          {parsedModal.isReplace ? '🔄 Replacement / Exchange Required' : '💵 Damaged Lot Refund Required'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>
                        {parsedModal.resolution || parsedModal.customerText}
                      </div>

                      {parsedModal.adminLogs.length > 0 && (
                        <div style={{ marginTop: '0.8rem', paddingTop: '0.65rem', borderTop: '1px dashed #e5dad4' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#888', marginBottom: '0.35rem' }}>
                            Decision Audit Trail:
                          </div>
                          {parsedModal.adminLogs.map((log, lIdx) => (
                            <div key={lIdx} style={{ fontSize: '0.8rem', color: '#4A0F14', fontWeight: 600, marginTop: '0.2rem' }}>
                              • {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Garment Units & Physical Inspection */}
              <div style={{ marginBottom: '1.4rem' }}>
                <div style={detailLabelStyle}>Garment Units Under Claim</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.4rem' }}>
                  {(activeModalRma.return_items || []).map((item, idx) => {
                    const variant = item.order_item?.product_variant || {};
                    const prod = variant.product || {};
                    const name = prod.name || `Item #${item.order_item_id}`;
                    const spec = [variant.size, variant.color].filter(Boolean).join(' · ');

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.9rem',
                          border: '1px solid #e8e2de',
                          borderRadius: '6px',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#222' }}>{name}</strong>
                          <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '0.15rem' }}>
                            {spec || 'Standard Spec'} • Return Volume: <strong style={{ color: '#4A0F14' }}>{item.quantity} units</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleInspectRestock(item.id, true)}
                            style={{
                              padding: '0.45rem 0.8rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              background: '#2d7a2d',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            title="Undamaged garments (e.g. from size exchange): Restock to warehouse inventory"
                          >
                            ✓ Restock Lot to Warehouse
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInspectRestock(item.id, false)}
                            style={{
                              padding: '0.45rem 0.8rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              background: '#c0392b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            title="Damaged items: Mark damaged/discard without adding back to stock"
                          >
                            ✕ Mark Damaged (No Restock)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Note input */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1.2rem', marginBottom: '1.2rem' }}>
                <div style={detailLabelStyle}>Corporate Authorization Notes</div>
                <input
                  type="text"
                  placeholder="e.g. Authorized 50 units batch exchange for Size L Alpine Green; dispatching replacement..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="pr3-input"
                  style={{ width: '100%', padding: '0.65rem', marginTop: '0.3rem' }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={() => setActiveModalRma(null)}
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  Close
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleReview(activeModalRma.id, 'approved', 'replacement batch authorized')}
                  disabled={processingId === activeModalRma.id}
                  style={{ padding: '0.6rem 1.2rem', background: '#0d47a1', color: '#fff', border: 'none' }}
                >
                  🔄 Authorize Batch Replacement
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleReview(activeModalRma.id, 'approved', 'damaged refund credited')}
                  disabled={processingId === activeModalRma.id}
                  style={{ padding: '0.6rem 1.2rem', background: '#2d7a2d', color: '#fff', border: 'none' }}
                >
                  💵 Authorize Damaged Lot Refund
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => handleReview(activeModalRma.id, 'rejected')}
                  disabled={processingId === activeModalRma.id}
                  style={{ padding: '0.6rem 1.2rem', color: '#c0392b', border: '1px solid #c0392b' }}
                >
                  Reject Claim
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const metricLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#888',
  marginBottom: '0.4rem',
};

const metricValueStyle = {
  fontSize: '1.8rem',
  fontWeight: 900,
  color: '#222',
};

const detailLabelStyle = {
  fontSize: '0.75rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#888',
  marginBottom: '0.3rem',
};

const tagStyle = (bg, col, border) => ({
  display: 'inline-block',
  padding: '0.2rem 0.55rem',
  borderRadius: '4px',
  fontSize: '0.72rem',
  fontWeight: 800,
  background: bg,
  color: col,
  border: `1px solid ${border}`,
});

export default AdminBulkReplacements;

