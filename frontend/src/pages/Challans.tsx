import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Download, FileText } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const Challans: React.FC = () => {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { hasRole } = useAuth();
  const canCreate = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    fetchChallans();
  }, [search, status, page]);

  const fetchChallans = async () => {
    try {
      const res = await api.get('/challans', {
        params: { search, status, page, limit: 10 },
      });
      setChallans(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch challans', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (challanId: string, challanNumber: string) => {
    const token = localStorage.getItem('token');
    window.open(`/api/challans/${challanId}/pdf?token=${token}`, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans & Invoices</h1>
          <p className="page-subtitle">Generate dispatch challans, verify stock deductions, and print PDF invoices</p>
        </div>
        {canCreate && (
          <Link to="/challans/new" className="btn btn-primary">
            <Plus size={18} />
            Create Sales Challan
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by Challan number or customer business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Challan # & Date</th>
              <th>Customer Profile</th>
              <th>Items & Qty</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Created By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading sales challans...
                </td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  No sales challans found.
                </td>
              </tr>
            ) : (
              challans.map((ch) => (
                <tr key={ch.id}>
                  <td>
                    <Link
                      to={`/challans/${ch.id}`}
                      style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}
                    >
                      <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {ch.challanNumber}
                    </Link>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ch.customer?.businessName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Contact: {ch.customer?.name} ({ch.customer?.mobile})
                    </p>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {ch.totalQuantity} Units ({ch._count?.items || 0} Products)
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                      ₹{ch.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <Badge type={ch.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {ch.createdBy?.name} ({ch.createdBy?.role})
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadPDF(ch.id, ch.challanNumber)}
                        title="Download PDF Invoice"
                      >
                        <Download size={14} /> PDF
                      </button>
                      <Link to={`/challans/${ch.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
