import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Plus,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const { hasRole } = useAuth();
  const canAddNote = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data.customer);
    } catch (err) {
      console.error('Failed to load customer details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      await api.post(`/customers/${id}/notes`, { note: newNote });
      setNewNote('');
      fetchCustomer();
    } catch (err) {
      console.error('Failed to add follow up note', err);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading customer profile...</div>;
  }

  if (!customer) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Customer profile not found.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/customers"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Customers Directory
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{customer.name}</h1>
            <Badge type={customer.status} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              ({customer.customerType})
            </span>
          </div>
          <p className="page-subtitle">{customer.businessName}</p>
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '2rem' }}>
        {/* Customer Information Card */}
        <div className="card">
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
            }}
          >
            Business & Contact Information
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Building size={18} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Business & GST</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {customer.businessName} {customer.gstNumber ? `• GST: ${customer.gstNumber}` : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Phone size={18} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile Number</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{customer.mobile}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{customer.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapPin size={18} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Address</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{customer.address}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={18} color="#fbbf24" />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next Follow-up Date</p>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fbbf24' }}>
                  {customer.followUpDate
                    ? new Date(customer.followUpDate).toLocaleDateString()
                    : 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Challans History */}
        <div className="card">
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
            }}
          >
            Challans History ({customer.challans?.length || 0})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {customer.challans?.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                No sales challans recorded for this customer yet.
              </p>
            ) : (
              customer.challans?.map((challan: any) => (
                <div
                  key={challan.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Link
                      to={`/challans/${challan.id}`}
                      style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}
                    >
                      <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {challan.challanNumber}
                    </Link>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(challan.createdAt).toLocaleDateString()} • {challan.totalQuantity} items
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      ₹{challan.totalAmount.toLocaleString()}
                    </p>
                    <Badge type={challan.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Notes Timeline */}
      <div className="card">
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <MessageSquare size={20} color="var(--primary)" />
          CRM Follow-up Notes & Interactions Log
        </h3>

        {canAddNote && (
          <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Write a new CRM follow-up note or meeting summary..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={addingNote || !newNote.trim()}
            >
              <Plus size={14} /> {addingNote ? 'Saving Note...' : 'Add Follow-up Note'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {customer.followUpNotes?.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              No follow-up notes logged yet.
            </p>
          ) : (
            customer.followUpNotes?.map((n: any) => (
              <div
                key={n.id}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid var(--primary)',
                }}
              >
                <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {n.note}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>
                    Added by: <strong>{n.createdBy?.name}</strong> ({n.createdBy?.role})
                  </span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
