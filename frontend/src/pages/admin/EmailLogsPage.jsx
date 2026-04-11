import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Mail, Send, CheckCircle, XCircle, RefreshCw, Filter,
  Calendar, User, Package, Search, ArrowLeft, BarChart3,
  TrendingUp, Clock, Inbox, AlertCircle, Eye, MousePointerClick
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const BACKEND_URL = import.meta.env.VITE_API_URL || '';

const EMAIL_TYPE_CONFIG = {
  order_confirmation: { label: 'Bevestigingsmail', icon: '📦', color: 'bg-green-100 text-green-800' },
  review_request: { label: 'Review verzoek', icon: '⭐', color: 'bg-yellow-100 text-yellow-800' },
  abandoned_cart: { label: 'Verlaten winkelwagen', icon: '🛒', color: 'bg-orange-100 text-orange-800' },
  marketing: { label: 'Marketing', icon: '📣', color: 'bg-purple-100 text-purple-800' },
  contact_form: { label: 'Contactformulier', icon: '📬', color: 'bg-blue-100 text-blue-800' },
  checkout_started: { label: 'Checkout gestart', icon: '💳', color: 'bg-indigo-100 text-indigo-800' },
  payment_success: { label: 'Betaling geslaagd', icon: '✅', color: 'bg-emerald-100 text-emerald-800' },
  payment_failed: { label: 'Betaling mislukt', icon: '❌', color: 'bg-red-100 text-red-800' },
  order_placed: { label: 'Bestelling geplaatst', icon: '📦', color: 'bg-blue-100 text-blue-800' },
  shipping_notification: { label: 'Verzendnotificatie', icon: '🚚', color: 'bg-cyan-100 text-cyan-800' },
  gift_card: { label: 'Cadeaubon', icon: '🎁', color: 'bg-pink-100 text-pink-800' },
  general: { label: 'Algemeen', icon: '📧', color: 'bg-gray-100 text-gray-800' },
};

const AdminEmailLogsPage = () => {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', status: 'all', search: '' });
  const [days, setDays] = useState(30);

  const fetchEmailLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_token');
      
      // Build query params
      let url = `${BACKEND_URL}/api/email-logs/?days=${days}&limit=200`;
      if (filter.type !== 'all') {
        url += `&email_type=${filter.type}`;
      }
      if (filter.status !== 'all') {
        url += `&status=${filter.status}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Kon email logs niet laden');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching email logs:', err);
      setError(err.message);
    }
    
    setLoading(false);
  }, [days, filter.type, filter.status]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${BACKEND_URL}/api/email-logs/stats?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [days]);

  useEffect(() => {
    fetchEmailLogs();
    fetchStats();
  }, [fetchEmailLogs, fetchStats]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getEmailTypeConfig = (type) => {
    return EMAIL_TYPE_CONFIG[type] || EMAIL_TYPE_CONFIG.general;
  };

  const filteredLogs = logs.filter(log => {
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        log.to_email?.toLowerCase().includes(search) ||
        log.subject?.toLowerCase().includes(search) ||
        log.customer_name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-violet-600" />
                  Verzonden E-mails
                </h1>
                <p className="text-sm text-gray-500">Overzicht van alle verzonden e-mails</p>
              </div>
            </div>
            <Button onClick={() => { fetchEmailLogs(); fetchStats(); }} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Vernieuwen
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-100 rounded-lg">
                  <Send className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Totaal</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_emails}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Succesvol</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mislukt</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Eye className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Geopend</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.total_opens || 0}</p>
                  <p className="text-xs text-gray-400">{stats.open_rate || 0}% open rate</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 rounded-lg">
                  <MousePointerClick className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kliks</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.total_clicks || 0}</p>
                  <p className="text-xs text-gray-400">{stats.click_rate || 0}% click rate</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Succes rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.success_rate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Type Breakdown */}
        {stats?.by_type && Object.keys(stats.by_type).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              E-mails per Type
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.by_type).map(([type, count]) => {
                const config = getEmailTypeConfig(type);
                return (
                  <div
                    key={type}
                    className={`px-4 py-2 rounded-lg ${config.color} flex items-center gap-2`}
                  >
                    <span>{config.icon}</span>
                    <span className="font-medium">{config.label}</span>
                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Zoek op email, onderwerp of naam..."
                  value={filter.search}
                  onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filter.type} onValueChange={(v) => setFilter(f => ({ ...f, type: v }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type e-mail" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle types</SelectItem>
                <SelectItem value="order_confirmation">📦 Bevestigingsmail</SelectItem>
                <SelectItem value="review_request">⭐ Review verzoek</SelectItem>
                <SelectItem value="abandoned_cart">🛒 Verlaten wagen</SelectItem>
                <SelectItem value="marketing">📣 Marketing</SelectItem>
                <SelectItem value="contact_form">📬 Contactformulier</SelectItem>
                <SelectItem value="payment_success">✅ Betaling geslaagd</SelectItem>
                <SelectItem value="payment_failed">❌ Betaling mislukt</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.status} onValueChange={(v) => setFilter(f => ({ ...f, status: v }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="sent">✅ Verzonden</SelectItem>
                <SelectItem value="failed">❌ Mislukt</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Laatste 7 dagen</SelectItem>
                <SelectItem value="30">Laatste 30 dagen</SelectItem>
                <SelectItem value="90">Laatste 90 dagen</SelectItem>
                <SelectItem value="365">Laatste jaar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Email Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">E-mails laden...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-gray-500 text-sm mt-2">De email_logs tabel moet mogelijk nog aangemaakt worden in Supabase.</p>
              <Button onClick={fetchEmailLogs} variant="outline" className="mt-4">
                Opnieuw proberen
              </Button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Geen e-mails gevonden</p>
              <p className="text-gray-400 text-sm">Wijzig de filters of wacht tot er emails worden verzonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ontvanger</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Onderwerp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Opens</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Kliks</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log) => {
                    const typeConfig = getEmailTypeConfig(log.email_type);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.icon} {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.to_email}</p>
                            {log.customer_name && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.customer_name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 max-w-xs truncate">{log.subject}</p>
                        </td>
                        <td className="px-4 py-3">
                          {log.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Verzonden
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                              <XCircle className="w-4 h-4" />
                              Mislukt
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-sm font-medium text-gray-700">{log.opens || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MousePointerClick className="w-3.5 h-3.5 text-cyan-500" />
                            <span className="text-sm font-medium text-gray-700">{log.clicks || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(log.created_at)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Totaal {filteredLogs.length} e-mails gevonden in de laatste {days} dagen
        </div>
      </div>
    </div>
  );
};

export default AdminEmailLogsPage;
