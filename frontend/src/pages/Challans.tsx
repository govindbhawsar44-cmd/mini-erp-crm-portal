import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Download, FileText } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
export const Challans: React.FC = () => {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { hasRole } = useAuth();
  const { showToast } = useToast();
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
    const renderBackendUrl = 'https://mini-erp-crm-portal-4bg4.onrender.com';
    const apiBase = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL
      : import.meta.env.PROD
      ? renderBackendUrl
      : '';
