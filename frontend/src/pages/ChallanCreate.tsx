import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ShieldAlert, CheckCircle, Save, Package } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  customerType: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

interface ErrorState {
  message?: string;
  errors?: Array<string | { message?: string }>;
}

export const ChallanCreate: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [items, setItems] = useState<ChallanItemInput[]>([
    { productId: '', quantity: 1 },
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100'),
      ]);
      setCustomers(custRes.data.data || []);
      setProducts(prodRes.data.data || []);
      if (custRes.data.data && custRes.data.data.length > 0) {
        setSelectedCustomer(custRes.data.data[0].id);
      }
      if (prodRes.data.data && prodRes.data.data.length > 0) {
        setItems([{ productId: prodRes.data.data[0].id, quantity: 1 }]);
      }
    } catch (err) {
      console.error('Failed to load customers/products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems((prev) => [...prev, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Product lookup map
  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

  // Calculate Totals & Stock Sufficiency
  let totalQty = 0;
  let totalAmount = 0;
  let hasInsufficientStock = false;

  items.forEach((item) => {
    const p = productMap.get(item.productId);
    const qty = item.quantity || 0;
    const price = p?.unitPrice || 0;
    totalQty += qty;
    totalAmount += price * qty;
    if (p && p.currentStock < qty) {
      hasInsufficientStock = true;
    }
  });

  const handleSubmit = async (status: 'DRAFT' | 'CONFIRMED') => {
    setError(null);

    if (!selectedCustomer) {
      setError({ message: 'Please select a customer before dispatch.' });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomer,
        status,
        items,
      };

      const res = await api.post('/challans', payload);
      const created = res.data.challan;

      showToast(
        `Sales Challan ${created.challanNumber}`,
        `Challan generated as ${status} successfully.`,
        'success'
      );
      navigate(`/challans/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data || { message: 'Failed to create Sales Challan' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading customer & product options...</div>;
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
          <h1 className="page-title">Generate New Sales Dispatch Challan</h1>
          <p className="page-subtitle">
            Select wholesale customer, add items, verify available stock, and issue Draft or Confirmed Challan
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <ShieldAlert size={20} />
            {error.message || 'Cannot Process Sales Challan'}
          </div>
          {error.errors && (
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.85rem' }}>
              {error.errors.map((e, idx) => (
                <li key={idx}>{typeof e === 'string' ? e : e.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Customer Selection */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem' }}>
          1. Select Customer Account
        </h3>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Customer / Business Name</label>
          <select
            className="form-select"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.businessName} — ({c.name}, Mobile: {c.mobile}, {c.customerType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Selection Table */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>2. Order Product Items & Quantities</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
            <Plus size={14} /> Add Product Line
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {items.map((item, idx) => {
            const p = productMap.get(item.productId);
            const subtotal = (p?.unitPrice || 0) * (item.quantity || 0);
            const isStockInsufficient = Boolean(p && p.currentStock < item.quantity);

            return (
              <div
                key={idx}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: isStockInsufficient
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr 36px',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: '0.725rem' }}>
                    Select Inventory Product
                  </label>
                  <select
                    className="form-select"
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (SKU: {prod.sku}) — ₹{prod.unitPrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.725rem' }}>
                    Available Stock
                  </label>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: isStockInsufficient ? '#ef4444' : '#10b981',
                      padding: '0.4rem 0',
                    }}
                  >
                    {p ? `${p.currentStock} Units` : '-'}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.725rem' }}>
                    Order Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.725rem' }}>
                    Subtotal (₹)
                  </label>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      padding: '0.4rem 0',
                      color: '#38bdf8',
                    }}
                  >
                    ₹{subtotal.toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals Summary Box */}
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
              Total Line Items: <strong>{items.length} Products</strong>
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Total Quantity: <strong>{totalQty} Units</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Order Total</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={submitting}
          onClick={() => handleSubmit('DRAFT')}
        >
          <Save size={18} /> Save as Draft
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={submitting}
          onClick={() => handleSubmit('CONFIRMED')}
        >
          <CheckCircle size={18} /> {submitting ? 'Confirming...' : 'Confirm & Deduct Stock'}
        </button>
      </div>
    </div>
  );
};
