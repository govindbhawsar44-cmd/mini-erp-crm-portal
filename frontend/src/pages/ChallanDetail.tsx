import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, FileText, Building } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [updating, setUpdating] = useState(false);

  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canUpdateStatus = hasRole(['ADMIN', 'SALES', 'ACCOUNTS']);

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const fetchChallan = async () => {
    try {
      const res = await api.get(`/challans/${id}`);
      setChallan(res.data.challan);
    } catch (err) {
      console.error('Failed to fetch challan detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'CONFIRMED' | 'CANCELLED') => {
    setActionError('');
    setUpdating(true);

    try {
      const res = await api.put(`/challans/${id}/status`, { status: newStatus });
      showToast(
        `Challan #${challan.challanNumber}`,
        res.data.message || `Status updated to ${newStatus}`,
        newStatus === 'CONFIRMED' ? 'success' : 'info'
      );
      fetchChallan();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update challan status');
      showToast('Status Update Failed', err.response?.data?.message || 'Error updating status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    const token = localStorage.getItem('token');
    showToast('Exporting PDF Invoice', `Downloading Challan ${challan.challanNumber}...`, 'info');
    window.open(`/api/challans/${id}/pdf?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem' }}>
        <Skeleton height="30px" width="200px" style={{ marginBottom: '20px' }} />
        <Skeleton height="120px" borderRadius="12px" style={{ marginBottom: '20px' }} />
        <Skeleton height="200px" borderRadius="12px" />
      </div>
    );
  }

  if (!challan) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Sales Challan record not found.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/challans"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Sales Challans Directory
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{challan.challanNumber}</h1>
            <Badge type={challan.status} />
          </div>
          <p className="page-subtitle">
            Generated on {new Date(challan.createdAt).toLocaleString()} by {challan.createdBy?.name} ({challan.createdBy?.role})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <Download size={16} /> Export PDF Invoice
          </button>

          {canUpdateStatus && challan.status === 'DRAFT' && (
            <button
              className="btn btn-primary"
              disabled={updating}
              onClick={() => handleUpdateStatus('CONFIRMED')}
            >
              <CheckCircle size={16} /> {updating ? 'Confirming...' : 'Confirm & Deduct Stock'}
            </button>
          )}

          {canUpdateStatus && challan.status === 'CONFIRMED' && (
            <button
              className="btn btn-danger"
              disabled={updating}
              onClick={() => handleUpdateStatus('CANCELLED')}
            >
              <XCircle size={16} /> {updating ? 'Cancelling...' : 'Cancel & Restore Stock'}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          <strong>Status Update Alert:</strong> {actionError}
        </div>
      )}

      {/* Customer Info Card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.5rem',
          }}
        >
          Customer Profile & Commercial Info
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{challan.customer?.businessName}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Contact Person: {challan.customer?.name}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Mobile: {challan.customer?.mobile} | Email: {challan.customer?.email}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              GST Number: <strong>{challan.customer?.gstNumber || 'N/A'}</strong>
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Dispatch Address: {challan.customer?.address}
            </p>
          </div>
        </div>
      </div>

      {/* Items Snapshot Table */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem' }}>
          Dispatched Line Items (Snapshot Pricing & Product Specs)
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th>SKU Code</th>
                <th>Unit Price (Snapshot)</th>
                <th>Dispatched Qty</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.productName}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</td>
                  <td>₹{item.unitPrice.toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>{item.quantity} Units</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                    ₹{item.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Total Line Items: <strong>{challan.items?.length || 0} Products</strong>
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Total Dispatched Quantity: <strong>{challan.totalQuantity} Units</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Invoice Amount</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{challan.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
