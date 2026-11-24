import React, { useEffect, useState } from 'react';
import Layout from '../../../components/layout/Layout';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';
import returnService from '../../../services/returnService';

const parseReturnReason = (rawReason = '') => {
  if (!rawReason) return { customerText: 'No details provided', adminLogs: [], resolution: null, isReplace: false, isRefund: false };

  // Split out any [Admin Decision: ...] tags
  const adminLogMatches = [...rawReason.matchAll(/\[Admin Decision:\s*([^\]]+)\]/gi)];
  const adminLogs = adminLogMatches.map((m) => m[1].trim());

  // Clean customer text by removing the [Admin Decision: ...] blocks
  let customerText = rawReason.replace(/\[Admin Decision:\s*[^\]]+\]/gi, '').trim();

  // Check if customer had a resolution prefix like [Requested: REPLACE ...]
  let resolution = null;
  const reqMatch = customerText.match(/^\[Requested:\s*([^\]]+)\]/i);
  if (reqMatch) {
    resolution = reqMatch[1].trim();
    customerText = customerText.replace(/^\[Requested:\s*[^\]]+\]\s*/i, '').trim();
  }

  const isReplace = (resolution && resolution.toUpperCase().includes('REPLACE')) ||
    customerText.toUpperCase().includes('REPLACE') ||
    customerText.toLowerCase().includes('size');

  const isRefund = (resolution && resolution.toUpperCase().includes('REFUND')) ||
    customerText.toUpperCase().includes('REFUND') ||
    customerText.toLowerCase().includes('damag') ||
    customerText.toLowerCase().includes('defect');

  return { customerText, adminLogs, resolution, isReplace, isRefund };
};

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Inspection modal state
  const [activeModalRma, setActiveModalRma] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      const res = await returnService.getReturns();
      const items = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setReturns(items);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to load return requests.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status, resolution = '') => {
    setProcessingId(id);
    try {
      const resolutionLabel = resolution ? ` with resolution: ${resolution.toUpperCase()}` : '';
      const notes = actionNotes.trim()
        ? `${actionNotes.trim()}`
        : `Admin marked ${status}${resolutionLabel}`;

      await returnService.reviewReturn(id, {
        status,
        resolution,
        notes,
      });

      setMsg({
        text: `RMA #${id} was successfully marked as ${status.toUpperCase()}${resolutionLabel}.`,
        type: 'success',
      });
      setActionNotes('');
      setActiveModalRma(null);
      await loadReturns();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Review action failed.', type: 'error' });
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
        text: res.message || (isRestockable ? 'Item restocked to inventory.' : 'Item marked damaged; no restock.'),
        type: 'success',
      });
      await loadReturns();
      // Update modal view if currently open
      if (activeModalRma) {
        const updated = returns.find((r) => r.id === activeModalRma.id);
        if (updated) setActiveModalRma(updated);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Inspection action failed.', type: 'error' });
    }
  };

  if (loading) return <Layout withSidebar><Loader message="Loading returns console..." /></Layout>;

  // Counts
  const totalCount = returns.length;
  const requestedCount = returns.filter((r) => (r.returnStatus || r.return_status || r.status) === 'requested').length;
  const approvedCount = returns.filter((r) => (r.returnStatus || r.return_status || r.status) === 'approved').length;
  const completedCount = returns.filter((r) => (r.returnStatus || r.return_status || r.status) === 'completed').length;

  // Filter & Search
  const filteredReturns = returns.filter((r) => {
    const status = (r.returnStatus || r.return_status || r.status || 'requested').toLowerCase();
    if (statusFilter !== 'ALL' && status !== statusFilter.toLowerCase()) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    const orderNum = (r.order?.order_number || r.order?.orderNumber || `Order #${r.order_id}`).toLowerCase();
    const customerName = `${r.user?.first_name || ''} ${r.user?.last_name || ''} ${r.user?.email || ''}`.toLowerCase();
    const reasonText = (r.reason || '').toLowerCase();
    const rmaCode = `pr3-rma-${2000 + r.id}`;

    const itemNames = (r.return_items || []).map((ri) => {
      const p = ri.order_item?.product_variant?.product?.name || '';
      return p.toLowerCase();
    }).join(' ');

    return (
      orderNum.includes(term) ||
      customerName.includes(term) ||
      reasonText.includes(term) ||
      rmaCode.includes(term) ||
      itemNames.includes(term)
    );
  });

  return (
    <Layout withSidebar>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.4rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6B27A', display: 'block', marginBottom: '0.3rem' }}>
            ATELIER MERCHANDISE OPERATIONS
          </span>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.03em', margin: 0 }}>
            Return Inquiries & RMA Management
          </h1>
          <p style={{ color: '#777', marginTop: '0.3rem', fontSize: '0.88rem' }}>
            Review garment claims, evaluate customer problem reports, authorize replacement vs refund, and control warehouse restock.
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.4rem' }}>
          <div className="pr3-card" style={{ padding: '1.2rem' }}>
            <div style={metricLabelStyle}>Total Return Claims</div>
            <div style={metricValueStyle}>{totalCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>All-time submitted RMAs</div>
          </div>
          <div className="pr3-card" style={{ padding: '1.2rem', borderLeft: '4px solid #F6B27A' }}>
            <div style={metricLabelStyle}>Pending Atelier Review</div>
            <div style={{ ...metricValueStyle, color: '#4A0F14' }}>{requestedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Requires approval decision</div>
          </div>
          <div className="pr3-card" style={{ padding: '1.2rem', borderLeft: '4px solid #4A0F14' }}>
            <div style={metricLabelStyle}>Authorized / In Transit</div>
            <div style={metricValueStyle}>{approvedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Awaiting garment inspection</div>
          </div>
          <div className="pr3-card" style={{ padding: '1.2rem', borderLeft: '4px solid #2d7a2d' }}>
            <div style={metricLabelStyle}>Inspected & Restocked</div>
            <div style={{ ...metricValueStyle, color: '#2d7a2d' }}>{completedCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Inventory credited / closed</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pr3-card" style={{ padding: '0.9rem 1.2rem', marginBottom: '1.4rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="Search by RMA #, Order #, Customer, or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr3-input"
              style={{ width: '100%', padding: '0.6rem 0.9rem', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'REQUESTED', 'APPROVED', 'PICKED_UP', 'COMPLETED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: statusFilter === st ? '1.5px solid #4A0F14' : '1px solid #ddd',
                  background: statusFilter === st ? '#4A0F14' : '#fff',
                  color: statusFilter === st ? '#fff' : '#555',
                  transition: 'all 0.15s ease',
                }}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filteredReturns.length === 0 ? (
          <div className="pr3-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#444' }}>No return claims match your criteria.</p>
            <p style={{ color: '#888', fontSize: '0.88rem', marginTop: '0.3rem' }}>Try clearing the search or switching the status filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="pr3-table">
              <thead>
                <tr>
                  <th>RMA & Date</th>
                  <th>Customer</th>
                  <th>Order Ref</th>
                  <th>Product & Spec</th>
                  <th>Problem & Request</th>
                  <th>Status</th>
                  <th>Decision Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((r) => {
                  const status = (r.returnStatus || r.return_status || r.status || 'requested').toLowerCase();
                  const rmaCode = `PR3-RMA-${2000 + r.id}`;
                  const orderNum = r.order?.order_number || r.order?.orderNumber || `Order #${r.order_id}`;
                  const customerName = `${r.user?.first_name || 'Customer'} ${r.user?.last_name || ''}`.trim();
                  const customerEmail = r.user?.email || '';
                  const returnItems = r.return_items || [];
                  const parsed = parseReturnReason(r.reason);

                  // Badge class
                  let badgeStyle = {
                    background: '#fff8f0',
                    color: '#4A0F14',
                    border: '1.5px solid #F6B27A',
                  };
                  if (status === 'approved') {
                    badgeStyle = { background: '#f5f0ef', color: '#4A0F14', border: '1.5px solid #4A0F14' };
                  } else if (status === 'completed') {
                    badgeStyle = { background: '#edf7ed', color: '#2d7a2d', border: '1.5px solid #2d7a2d' };
                  } else if (status === 'rejected') {
                    badgeStyle = { background: '#fdf0ef', color: '#c0392b', border: '1.5px solid #c0392b' };
                  } else if (status === 'picked_up') {
                    badgeStyle = { background: '#f3e5f5', color: '#6a1b9a', border: '1.5px solid #ab47bc' };
                  }

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
                      </td>

                      {/* Customer */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#222' }}>{customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#777' }}>{customerEmail}</div>
                      </td>

                      {/* Order */}
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{orderNum}</span>
                        {r.order?.total_amount && (
                          <div style={{ fontSize: '0.78rem', color: '#666' }}>
                            ${parseFloat(r.order.total_amount).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Returned Product */}
                      <td>
                        {returnItems.length === 0 ? (
                          <span style={{ color: '#888', fontSize: '0.82rem' }}>Item #{r.id}</span>
                        ) : (
                          returnItems.map((item, idx) => {
                            const variant = item.order_item?.product_variant || {};
                            const prod = variant.product || {};
                            const name = prod.name || `Garment #${item.order_item_id}`;
                            const spec = [variant.size, variant.color].filter(Boolean).join(' · ');

                            return (
                              <div key={idx} style={{ marginBottom: idx > 0 ? '0.3rem' : 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#222' }}>
                                  {name}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#666' }}>
                                  {spec || 'Standard Spec'} <strong style={{ color: '#4A0F14' }}>× {item.quantity}</strong>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </td>

                      {/* Problem & Request */}
                      <td style={{ minWidth: '280px', maxWidth: '400px', verticalAlign: 'top', padding: '1rem 0.85rem' }}>
                        {/* Resolution Tag */}
                        <div style={{ marginBottom: '0.45rem' }}>
                          {parsed.isReplace && (
                            <span style={tagStyle('#e8f4fd', '#0d47a1', '#90caf9')}>
                              🔄 {parsed.resolution || 'Replacement Requested'}
                            </span>
                          )}
                          {parsed.isRefund && (
                            <span style={tagStyle('#fdf0ef', '#c0392b', '#ef9a9a')}>
                              💵 {parsed.resolution || 'Refund Requested'}
                            </span>
                          )}
                          {!parsed.isReplace && !parsed.isRefund && (
                            <span style={tagStyle('#fff8f0', '#4A0F14', '#F6B27A')}>
                              Claim Review
                            </span>
                          )}
                        </div>

                        {/* Customer Stated Problem */}
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#1a1a1a',
                            lineHeight: 1.55,
                            background: '#faf8f7',
                            padding: '0.65rem 0.9rem',
                            borderRadius: '6px',
                            border: '1px solid #eee5e0',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              color: '#888',
                              marginBottom: '0.2rem',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Customer Issue:
                          </div>
                          {parsed.customerText || 'No specific description provided.'}
                        </div>

                        {/* Admin Decision Trail (if any) */}
                        {parsed.adminLogs.length > 0 && (
                          <div style={{ marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: '#999',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Decision Trail:
                            </div>
                            {parsed.adminLogs.map((log, lIdx) => (
                              <div
                                key={lIdx}
                                style={{
                                  fontSize: '0.8rem',
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

                      {/* Review Action */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {status === 'requested' && (
                            <>
                              {parsed.isReplace ? (
                                <Button
                                  variant="primary"
                                  onClick={() => handleReview(r.id, 'approved', 'replacement')}
                                  disabled={processingId === r.id}
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: '#4A0F14', color: '#fff', border: 'none' }}
                                  title="Approve size/variant replacement"
                                >
                                  Approve Replace
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  onClick={() => handleReview(r.id, 'approved', 'refund')}
                                  disabled={processingId === r.id}
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: '#2d7a2d', color: '#fff', border: 'none' }}
                                  title="Approve return and issue refund"
                                >
                                  Approve Refund
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

                          {status === 'approved' && (
                            <Button
                              variant="primary"
                              onClick={() => handleReview(r.id, 'picked_up')}
                              disabled={processingId === r.id}
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: '#F6B27A', color: '#4A0F14', border: '1px solid #4A0F14' }}
                            >
                              In Transit
                            </Button>
                          )}

                          <button
                            onClick={() => {
                              setActiveModalRma(r);
                              setActionNotes('');
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              padding: '0.32rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#444',
                            }}
                          >
                            Inspect & Details
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

        {/* Inspection & Details Modal */}
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
                maxWidth: '720px',
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
                    RMA INSPECTION INSPECTOR
                  </span>
                  <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.4rem' }}>
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

              {/* Order & Customer snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.4rem', background: '#faf8f7', padding: '1rem', borderRadius: '6px' }}>
                <div>
                  <div style={detailLabelStyle}>Customer</div>
                  <div style={{ fontWeight: 700 }}>
                    {activeModalRma.user?.first_name} {activeModalRma.user?.last_name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#777' }}>{activeModalRma.user?.email}</div>
                </div>
                <div>
                  <div style={detailLabelStyle}>Order Reference</div>
                  <div style={{ fontWeight: 700 }}>
                    {activeModalRma.order?.order_number || activeModalRma.order?.orderNumber || `Order #${activeModalRma.order_id}`}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#777' }}>
                    Order Status: <strong>{activeModalRma.order?.order_status || 'delivered'}</strong>
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              {(() => {
                const parsedModal = parseReturnReason(activeModalRma.reason);
                return (
                  <div style={{ marginBottom: '1.4rem' }}>
                    <div style={detailLabelStyle}>Customer Claim & Problem Statement</div>
                    <div style={{ padding: '1rem', background: '#fffaf6', borderLeft: '4px solid #F6B27A', borderRadius: '4px', lineHeight: 1.5 }}>
                      {parsedModal.resolution && (
                        <div style={{ marginBottom: '0.6rem' }}>
                          <span style={tagStyle(parsedModal.isReplace ? '#e8f4fd' : '#fdf0ef', parsedModal.isReplace ? '#0d47a1' : '#c0392b', parsedModal.isReplace ? '#90caf9' : '#ef9a9a')}>
                            {parsedModal.isReplace ? '🔄 Requested: ' : '💵 Requested: '} {parsedModal.resolution}
                          </span>
                        </div>
                      )}
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a', marginBottom: parsedModal.adminLogs.length > 0 ? '0.8rem' : 0 }}>
                        {parsedModal.customerText || 'No description provided.'}
                      </div>

                      {parsedModal.adminLogs.length > 0 && (
                        <div style={{ paddingTop: '0.65rem', borderTop: '1px dashed #e5dad4' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#888', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                            Decision & Processing Audit Trail:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {parsedModal.adminLogs.map((log, lIdx) => (
                              <div
                                key={lIdx}
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#4A0F14',
                                  background: '#fff',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #4A0F14',
                                  fontWeight: 600,
                                }}
                              >
                                ✓ {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Garment Line Items */}
              <div style={{ marginBottom: '1.4rem' }}>
                <div style={detailLabelStyle}>Garments Under Claim</div>
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
                            {spec || 'Standard Spec'} • Return Quantity: <strong>{item.quantity} unit(s)</strong>
                          </div>
                        </div>

                        {/* Physical Restock Action for this item */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleInspectRestock(item.id, true)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              background: '#2d7a2d',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            title="Item undamaged; add back to warehouse stock (for size exchanges)"
                          >
                            ✓ Restock to Warehouse
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInspectRestock(item.id, false)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              background: '#c0392b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            title="Item damaged/defective; do NOT restock"
                          >
                            ✕ Mark Damaged (No Restock)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Decision Form */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '1.2rem', marginBottom: '1.2rem' }}>
                <div style={detailLabelStyle}>Admin Resolution & Decision</div>
                <div style={{ marginTop: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="Decision note or dispatch exchange instruction (optional)..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="pr3-input"
                    style={{ width: '100%', padding: '0.65rem' }}
                  />
                </div>
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
                  onClick={() => handleReview(activeModalRma.id, 'approved', 'replacement')}
                  disabled={processingId === activeModalRma.id}
                  style={{ padding: '0.6rem 1.2rem', background: '#4A0F14', color: '#fff', border: 'none' }}
                >
                  🔄 Approve Replacement (Size Exchange)
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleReview(activeModalRma.id, 'approved', 'refund')}
                  disabled={processingId === activeModalRma.id}
                  style={{ padding: '0.6rem 1.2rem', background: '#2d7a2d', color: '#fff', border: 'none' }}
                >
                  💵 Approve Refund (Damaged Product)
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => handleReview(activeModalRma.id, 'rejected')}
                  disabled={processingId === activeModalRma.id}
                  style={{ padding: '0.6rem 1.2rem', color: '#c0392b', border: '1px solid #c0392b' }}
                >
                  Reject Request
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

export default AdminReturns;
