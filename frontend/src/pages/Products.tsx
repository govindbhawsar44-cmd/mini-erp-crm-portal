import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Package as PackageIcon, MapPin } from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const locationState = useLocation();
  const queryParams = new URLSearchParams(locationState.search);
  const initialLowStock = queryParams.get('lowStock') === 'true';

  const [lowStock, setLowStock] = useState(initialLowStock);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Valves & Fittings',
    unitPrice: 100,
    currentStock: 10,
    minStockAlert: 5,
    location: 'Warehouse A',
  });
  const [productError, setProductError] = useState('');

  // Stock Adjust Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockSubmitting, setStockSubmitting] = useState(false);
  const [stockForm, setStockForm] = useState({
    quantityChanged: 1,
    movementType: 'IN',
    reason: 'Stock Audit Inward',
  });
  const [stockError, setStockError] = useState('');

  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canEdit = hasRole(['ADMIN', 'WAREHOUSE']);

  useEffect(() => {
    fetchProducts();
  }, [search, category, lowStock, page]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', {
        params: { search, category, lowStock, page, limit: 10 },
      });
      setProducts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Valves & Fittings',
      unitPrice: 500,
      currentStock: 20,
      minStockAlert: 5,
      location: 'Warehouse A',
    });
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
    });
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');
    setProductSubmitting(true);

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, productForm);
        showToast('Product Catalog Updated', `${productForm.name} updated successfully.`, 'success');
      } else {
        await api.post('/products', productForm);
        showToast('New Product Created', `${productForm.name} added to inventory.`, 'success');
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setProductError(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleOpenStockModal = (p: any) => {
    setSelectedProduct(p);
    setStockForm({
      quantityChanged: 1,
      movementType: 'IN',
      reason: 'Manual Warehouse Adjustment',
    });
    setStockError('');
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockError('');
    setStockSubmitting(true);

    try {
      const res = await api.post(`/products/${selectedProduct.id}/stock`, stockForm);
      showToast(
        'Stock Adjusted',
        `${stockForm.movementType === 'IN' ? '+' : '-'}${stockForm.quantityChanged} units logged for ${selectedProduct.name}`,
        'success'
      );
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setStockError(err.response?.data?.message || 'Stock adjustment failed');
    } finally {
      setStockSubmitting(false);
    }
  };

  // Stock preview calculation
  const stockPreview = selectedProduct
    ? stockForm.movementType === 'IN'
      ? selectedProduct.currentStock + (stockForm.quantityChanged || 0)
      : selectedProduct.currentStock - (stockForm.quantityChanged || 0)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product & Inventory Manager</h1>
          <p className="page-subtitle">Manage catalog SKUs, stock levels, warehouse locations, and audit logs</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            Add New Product
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
              placeholder="Search product description or SKU code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Filter Category..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: lowStock ? '#f59e0b' : 'var(--text-secondary)',
            }}
          >
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => setLowStock(e.target.checked)}
            />
            <AlertTriangle size={16} /> Low Stock Alert Filter
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : products.length === 0 ? (
          <div className="empty-state-box">
            <PackageIcon size={40} color="var(--text-muted)" />
            <h4>No Products Found</h4>
            <p style={{ fontSize: '0.875rem' }}>
              {search || category || lowStock
                ? 'No inventory items match your search or low-stock filter.'
                : 'No products registered in the inventory catalog yet.'}
            </p>
            {canEdit && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={handleOpenAddModal}
              >
                <Plus size={14} /> Add Product
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product Description & SKU</th>
                <th>Category</th>
                <th>Unit Price (₹)</th>
                <th>Available Stock</th>
                <th>Warehouse Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id}>
                    <td>
                      <Link
                        to={`/products/${p.id}`}
                        style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.925rem' }}
                      >
                        {p.name}
                      </Link>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</p>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{p.category}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>₹{p.unitPrice.toLocaleString()}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: isLow ? '#ef4444' : '#10b981',
                          }}
                        >
                          {p.currentStock} Units
                        </span>
                        {isLow && (
                          <span
                            className="badge badge-inactive"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <AlertTriangle size={12} /> Low Alert (Limit: {p.minStockAlert})
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {p.location}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {canEdit && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenStockModal(p)}
                            >
                              Adjust Stock
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditModal(p)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                        <Link to={`/products/${p.id}`} className="btn btn-secondary btn-sm">
                          Logs History
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {products.length > 0 && (
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingId ? 'Edit Product Catalog Details' : 'Add New Inventory Product'}
      >
        {productError && (
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
            {productError}
          </div>
        )}

        <form onSubmit={handleProductSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name / Description</label>
            <input
              type="text"
              className="form-input"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">SKU Code</label>
              <input
                type="text"
                className="form-input"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unit Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={productForm.unitPrice}
                onChange={(e) =>
                  setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input
                type="number"
                className="form-input"
                value={productForm.currentStock}
                onChange={(e) =>
                  setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Alert Stock</label>
              <input
                type="number"
                className="form-input"
                value={productForm.minStockAlert}
                onChange={(e) =>
                  setProductForm({ ...productForm, minStockAlert: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Rack Location</label>
            <input
              type="text"
              className="form-input"
              value={productForm.location}
              onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsProductModalOpen(false)}
              disabled={productSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={productSubmitting}>
              {productSubmitting ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjust Modal with Real-time Preview */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Inventory Stock: ${selectedProduct?.name || ''}`}
      >
        {stockError && (
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
            {stockError}
          </div>
        )}

        <form onSubmit={handleStockSubmit}>
          {/* Stock Preview Banner */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Available Stock</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedProduct?.currentStock} Units</p>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected Stock After Adjustment</p>
              <p
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: stockPreview < 0 ? '#ef4444' : '#38bdf8',
                }}
              >
                {stockPreview} Units
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type</label>
              <select
                className="form-select"
                value={stockForm.movementType}
                onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value })}
              >
                <option value="IN">IN (Warehouse Inward Addition)</option>
                <option value="OUT">OUT (Stock Dispatch / Outward)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={stockForm.quantityChanged}
                onChange={(e) =>
                  setStockForm({ ...stockForm, quantityChanged: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Movement / Audit Reference</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Vendor PO Receipt, Damaged Goods, Audit Adjustment"
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsStockModalOpen(false)}
              disabled={stockSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={stockSubmitting || stockPreview < 0}
            >
              {stockSubmitting ? 'Updating...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
