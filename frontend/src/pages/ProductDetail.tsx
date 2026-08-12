import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Tag, History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import api from '../services/api';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.product);
    } catch (err) {
      console.error('Failed to load product details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading product details...</div>;
  }

  if (!product) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Product not found.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Products Catalog
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{product.name}</h1>
          <p className="page-subtitle">SKU Code: {product.sku}</p>
        </div>
      </div>

      {/* Product Summary Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit Selling Price</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
            ₹{product.unitPrice.toLocaleString()}
          </p>
        </div>

        <div className="card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Available Stock</p>
          <p
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              marginTop: '0.25rem',
              color: product.currentStock <= product.minStockAlert ? '#f87171' : '#34d399',
            }}
          >
            {product.currentStock} Units
          </p>
        </div>

        <div className="card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Minimum Stock Alert Level</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#fbbf24' }}>
            {product.minStockAlert} Units
          </p>
        </div>

        <div className="card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Warehouse Location</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
            <MapPin size={16} style={{ display: 'inline', marginRight: '4px' }} />
            {product.location}
          </p>
        </div>
      </div>

      {/* Stock Movement History Table */}
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
          <History size={20} color="var(--primary)" />
          Stock Movement Log Audit History
        </h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantity Changed</th>
                <th>Reason / Transaction</th>
                <th>Logged By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {product.stockLogs?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    No stock movements recorded for this product yet.
                  </td>
                </tr>
              ) : (
                product.stockLogs?.map((log: any) => (
                  <tr key={log.id}>
                    <td>
                      <span
                        className={`badge ${
                          log.movementType === 'IN' ? 'badge-active' : 'badge-inactive'
                        }`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        {log.movementType === 'IN' ? (
                          <ArrowDownRight size={12} />
                        ) : (
                          <ArrowUpRight size={12} />
                        )}
                        {log.movementType}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: log.movementType === 'IN' ? '#34d399' : '#f87171',
                        }}
                      >
                        {log.movementType === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`} Units
                      </span>
                    </td>
                    <td>{log.reason}</td>
                    <td>
                      {log.createdBy?.name} ({log.createdBy?.role})
                    </td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
