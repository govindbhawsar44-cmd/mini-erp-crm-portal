import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Package,
  AlertTriangle,
  IndianRupee,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canCreateChallan = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/metrics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const { metrics, recentMovements, recentChallans } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Wholesale Operations Dashboard</h1>
          <p className="page-subtitle">Real-time status of CRM leads, inventory stock alerts, and sales dispatch challans</p>
        </div>
        {canCreateChallan && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/challans/new" className="btn btn-primary">
              <Plus size={18} />
              Create Sales Challan
            </Link>
          </div>
        )}
      </div>

      {/* Metric KPI Cards (Clickable) */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        {loading ? (
          <>
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Customers"
              value={metrics?.totalCustomers || 0}
              subtitle={`${metrics?.leadCustomers || 0} Leads pending follow-up`}
              icon={<Users size={24} />}
              onClick={() => navigate('/customers')}
            />
            <StatCard
              title="Product Inventory"
              value={metrics?.totalProducts || 0}
              subtitle="Active catalog SKUs"
              icon={<Package size={24} />}
              onClick={() => navigate('/products')}
            />
            <StatCard
              title="Low Stock Alerts"
              value={metrics?.lowStockCount || 0}
              subtitle="Items at or below alert limit"
              icon={<AlertTriangle size={24} color="#f59e0b" />}
              onClick={() => navigate('/products?lowStock=true')}
            />
            <StatCard
              title="Confirmed Sales Revenue"
              value={`₹${(metrics?.totalConfirmedRevenue || 0).toLocaleString()}`}
              subtitle={`${metrics?.confirmedChallansCount || 0} Confirmed Challans`}
              icon={<IndianRupee size={24} />}
              onClick={() => navigate('/challans?status=CONFIRMED')}
            />
          </>
        )}
      </div>

      {/* Two Column Section */}
      <div className="grid-cols-2">
        {/* Recent Stock Movements */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Stock Movement Activity</h3>
            <Link to="/products" style={{ color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              View Inventory Logs <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton height="56px" />
              <Skeleton height="56px" />
              <Skeleton height="56px" />
            </div>
          ) : recentMovements?.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
              No stock movements recorded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentMovements?.map((log: any) => (
                <div
                  key={log.id}
                  className="card-clickable"
                  onClick={() => navigate(`/products/${log.productId}`)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background:
                          log.movementType === 'IN'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)',
                        color: log.movementType === 'IN' ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {log.movementType === 'IN' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.product?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.reason} • by {log.createdBy?.name}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: log.movementType === 'IN' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {log.movementType === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`} Units
                    </span>
                    <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales Challans */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Dispatch Challans</h3>
            <Link to="/challans" style={{ color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              All Sales Challans <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton height="56px" />
              <Skeleton height="56px" />
              <Skeleton height="56px" />
            </div>
          ) : recentChallans?.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
              No sales challans generated yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentChallans?.map((challan: any) => (
                <div
                  key={challan.id}
                  className="card-clickable"
                  onClick={() => navigate(`/challans/${challan.id}`)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(2, 132, 199, 0.12)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>
                        {challan.challanNumber}
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {challan.customer?.businessName} ({challan.customer?.name})
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      ₹{challan.totalAmount.toLocaleString()}
                    </p>
                    <div style={{ marginTop: '0.2rem' }}>
                      <Badge type={challan.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
