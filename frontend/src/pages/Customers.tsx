import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Phone, Mail, Building, Users as UsersIcon } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canEdit = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    fetchCustomers();
  }, [search, status, customerType, page]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers', {
        params: { search, status, customerType, page, limit: 10 },
      });
      setCustomers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    });
    setFormError('');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: any) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? new Date(c.followUpDate).toISOString().slice(0, 10) : '',
      notes: c.notes || '',
    });
    setFormError('');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
        showToast('Customer Profile Updated', `${formData.businessName} updated successfully.`, 'success');
      } else {
        await api.post('/customers', formData);
        showToast('Customer Registered', `${formData.businessName} created in CRM.`, 'success');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        const fieldMap: Record<string, string> = {};
        resp.errors.forEach((e: any) => {
          if (e.field) fieldMap[e.field] = e.message;
        });
        setFieldErrors(fieldMap);
      }
      setFormError(resp?.message || 'Failed to save customer record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer CRM Directory</h1>
          <p className="page-subtitle">Manage customer profiles, commercial terms, and sales follow-up schedules</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            Add New Customer
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.85rem 1rem' }}>
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
              placeholder="Search customer name, business, mobile, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '170px' }}>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="LEAD">LEAD</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ width: '170px' }}>
            <select
              className="form-select"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="table-container">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : customers.length === 0 ? (
          <div className="empty-state-box">
            <UsersIcon size={40} color="var(--text-muted)" />
            <h4>No Customers Found</h4>
            <p style={{ fontSize: '0.875rem' }}>
              {search || status || customerType
                ? 'No customer records match your filter criteria.'
                : 'Get started by adding your first wholesale customer or distributor profile.'}
            </p>
            {canEdit && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={handleOpenAddModal}
              >
                <Plus size={14} /> Add Customer
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer & Business Name</th>
                <th>Contact Details</th>
                <th>Category</th>
                <th>CRM Status</th>
                <th>Next Follow-up</th>
                <th>History</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      to={`/customers/${c.id}`}
                      style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.925rem' }}
                    >
                      {c.name}
                    </Link>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <Building size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {c.businessName} {c.gstNumber ? `(GST: ${c.gstNumber})` : ''}
                    </p>
                  </td>
                  <td>
                    <p style={{ fontSize: '0.8125rem' }}>
                      <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {c.mobile}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {c.email}
                    </p>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.customerType}</span>
                  </td>
                  <td>
                    <Badge type={c.status} />
                  </td>
                  <td>
                    {c.followUpDate ? (
                      <span style={{ fontSize: '0.8125rem', color: '#fbbf24', fontWeight: 600 }}>
                        {new Date(c.followUpDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not set</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c._count?.followUpNotes || 0} Notes • {c._count?.challans || 0} Challans
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Link to={`/customers/${c.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> View Profile
                      </Link>
                      {canEdit && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(c)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {customers.length > 0 && (
          <div className="pagination">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Customer Details' : 'Register New Customer (CRM)'}
      >
        {formError && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Person Name</label>
              <input
                type="text"
                className={`form-input ${fieldErrors.name ? 'form-input-error' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {fieldErrors.name && <p className="field-error-msg">{fieldErrors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                className={`form-input ${fieldErrors.businessName ? 'form-input-error' : ''}`}
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
              {fieldErrors.businessName && (
                <p className="field-error-msg">{fieldErrors.businessName}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className={`form-input ${fieldErrors.mobile ? 'form-input-error' : ''}`}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
              {fieldErrors.mobile && <p className="field-error-msg">{fieldErrors.mobile}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {fieldErrors.email && <p className="field-error-msg">{fieldErrors.email}</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Type</label>
              <select
                className="form-select"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              >
                <option value="RETAIL">RETAIL</option>
                <option value="WHOLESALE">WHOLESALE</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="LEAD">LEAD</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">GST Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="24AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Registered Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Next Sales Follow-up Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
