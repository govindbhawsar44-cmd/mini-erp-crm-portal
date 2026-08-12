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
