import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ArrowLeft, Package, Truck, Mail, Check, X, Search, RefreshCw,
  Printer, ExternalLink, ChevronDown, ChevronUp, Eye, Clock,
  CreditCard, MapPin, Phone, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { API_URL } from '../api/client';

const CARRIERS = {
  postnl: { name: 'PostNL', trackingUrl: (code) => `https://postnl.nl/tracktrace/?B=${code}&P=&D=NL&T=C` },
  dhl: { name: 'DHL', trackingUrl: (code) => `https://www.dhl.com/nl-nl/home/tracking/tracking-parcel.html?submit=1&tracking-id=${code}` },
  dpd: { name: 'DPD', trackingUrl: (code) => `https://tracking.dpd.de/parcelstatus?locale=nl_NL&query=${code}` },
  gls: { name: 'GLS', trackingUrl: (code) => `https://gls-group.eu/NL/nl/volg-je-pakket?match=${code}` },
  bpost: { name: 'bpost', trackingUrl: (code) => `https://track.bpost.cloud/btr/web/#/search?itemCode=${code}` }
};

const STATUS_CONFIG = {
  pending: { label: 'In afwachting', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  paid: { label: 'Betaald', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  shipped: { label: 'Verzonden', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  delivered: { label: 'Afgeleverd', color: 'bg-violet-100 text-violet-800 border-violet-200', dot: 'bg-violet-500' },
  cancelled: { label: 'Geannuleerd', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
  failed: { label: 'Mislukt', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' }
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState({});
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Shipping state
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('postnl');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const LIMIT = 25;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString() });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      
      const response = await fetch(`${API_URL}/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalOrders(data.total || data.count || 0);
        setStatusCounts(data.status_counts || {});
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  }, [page, statusFilter, searchTerm]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fetchOrderDetail = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderDetail(null);
      return;
    }
    setExpandedOrder(orderId);
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetail(data);
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
    }
    setLoadingDetail(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setMessage({ type: 'success', text: `Status gewijzigd naar "${STATUS_CONFIG[newStatus]?.label}"` });
        fetchOrders();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.detail || 'Fout bij status wijzigen' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij verbinden met server' });
    }
  };

  const handleManualTracking = async (orderId) => {
    if (!trackingCode.trim()) {
      setMessage({ type: 'error', text: 'Voer een track & trace code in' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_code: trackingCode.trim(), carrier: selectedCarrier, send_email: true })
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Track & trace toegevoegd en email verzonden!' });
        setShippingOrderId(null);
        setTrackingCode('');
        fetchOrders();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Fout bij opslaan' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fout bij verbinden met server' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 4000);
  };

  const totalPages = Math.ceil(totalOrders / LIMIT);
  const allCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-orders-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bestellingen</h1>
                <p className="text-xs text-gray-500">{totalOrders} totaal</p>
              </div>
            </div>
            <Button onClick={fetchOrders} variant="outline" size="sm" data-testid="refresh-orders-btn">
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Alert Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`} data-testid="order-message">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {message.text}
            </div>
            <button onClick={() => setMessage(null)} className="text-lg leading-none">&times;</button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="status-filters">
          {[
            { key: 'all', label: 'Alles', count: allCount },
            { key: 'pending', label: 'In afwachting', count: statusCounts.pending || 0 },
            { key: 'paid', label: 'Betaald', count: statusCounts.paid || 0 },
            { key: 'shipped', label: 'Verzonden', count: statusCounts.shipped || 0 },
            { key: 'delivered', label: 'Afgeleverd', count: statusCounts.delivered || 0 },
            { key: 'cancelled', label: 'Geannuleerd', count: (statusCounts.cancelled || 0) + (statusCounts.failed || 0) }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
              data-testid={`filter-${tab.key}`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Zoek op naam, email of bestelnummer..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9 h-9"
            data-testid="order-search-input"
          />
        </div>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
                <p>Laden...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Geen bestellingen gevonden</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="orders-table">
                  <thead>
                    <tr className="border-b bg-gray-50/80">
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bestelling</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Klant</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bedrag</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Datum</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((order) => (
                      <React.Fragment key={order.order_id}>
                        <tr className={`hover:bg-gray-50/80 transition-colors ${expandedOrder === order.order_id ? 'bg-blue-50/50' : ''}`}>
                          <td className="p-3">
                            <button
                              onClick={() => fetchOrderDetail(order.order_id)}
                              className="text-left group"
                              data-testid={`order-row-${order.order_id}`}
                            >
                              <div className="font-mono text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                #{(order.order_number || order.order_id)?.slice(-8).toUpperCase()}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                <Eye className="w-3 h-3" />
                                Details
                                {expandedOrder === order.order_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </div>
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-sm text-gray-900">{order.customer_name || '-'}</div>
                            <div className="text-xs text-gray-500">{order.customer_email}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-sm">&euro;{order.total_amount?.toFixed(2)}</span>
                          </td>
                          <td className="p-3">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                              className={`text-xs font-medium px-2 py-1 rounded-lg border cursor-pointer ${STATUS_CONFIG[order.status]?.color || 'bg-gray-100'}`}
                              data-testid={`status-select-${order.order_id}`}
                            >
                              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            {order.tracking_code ? (
                              <a
                                href={CARRIERS[order.carrier]?.trackingUrl(order.tracking_code) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-mono"
                              >
                                {order.tracking_code.slice(0, 14)}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-3 text-xs text-gray-500">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              {order.status === 'paid' && !order.tracking_code && (
                                <Button
                                  size="sm"
                                  onClick={() => setShippingOrderId(shippingOrderId === order.order_id ? null : order.order_id)}
                                  className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                                  data-testid={`ship-btn-${order.order_id}`}
                                >
                                  <Truck className="w-3.5 h-3.5 mr-1" />
                                  Verzenden
                                </Button>
                              )}
                              {order.label_url && (
                                <a href={order.label_url} target="_blank" rel="noopener noreferrer"
                                   className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200">
                                  <Printer className="w-3.5 h-3.5" /> Label
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Shipping Panel */}
                        {shippingOrderId === order.order_id && (
                          <tr className="bg-blue-50/80">
                            <td colSpan="7" className="p-4">
                              <div className="flex flex-wrap items-end gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Verzendservice</label>
                                  <select value={selectedCarrier} onChange={(e) => setSelectedCarrier(e.target.value)}
                                    className="border rounded-lg px-3 py-1.5 text-sm bg-white">
                                    {Object.entries(CARRIERS).map(([key, c]) => (
                                      <option key={key} value={key}>{c.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Track & Trace Code</label>
                                  <Input placeholder="3SABCD1234567890" value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} className="h-8" />
                                </div>
                                <Button onClick={() => handleManualTracking(order.order_id)} disabled={saving}
                                  className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                                  {saving ? 'Opslaan...' : <><Mail className="w-3.5 h-3.5 mr-1" /> Opslaan & Email</>}
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs"
                                  onClick={() => { setShippingOrderId(null); setTrackingCode(''); }}>
                                  Annuleren
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Order Detail Panel */}
                        {expandedOrder === order.order_id && (
                          <tr className="bg-gray-50/80">
                            <td colSpan="7" className="p-0">
                              {loadingDetail ? (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                  <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" /> Details laden...
                                </div>
                              ) : orderDetail ? (
                                <div className="p-5 grid md:grid-cols-3 gap-5" data-testid="order-detail-panel">
                                  {/* Customer Info */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Klantgegevens</h4>
                                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm border">
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{orderDetail.order?.customer_email || '-'}</span>
                                      </div>
                                      {orderDetail.order?.customer_phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                                          <span>{orderDetail.order.customer_phone}</span>
                                        </div>
                                      )}
                                      <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                        <div>
                                          <div>{orderDetail.order?.shipping_address}</div>
                                          <div>{orderDetail.order?.shipping_zipcode} {orderDetail.order?.shipping_city}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order Items */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Producten</h4>
                                    <div className="bg-white rounded-lg border divide-y">
                                      {(orderDetail.items || []).map((item, idx) => (
                                        <div key={idx} className="p-3 flex items-center gap-3 text-sm">
                                          {/* Product Image */}
                                          <div className="w-12 h-12 rounded-lg bg-gray-100 border flex-shrink-0 overflow-hidden">
                                            {item.image_url || item.product_image ? (
                                              <img 
                                                src={item.image_url || item.product_image} 
                                                alt={item.product_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.target.onerror = null;
                                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product_name?.charAt(0) || 'P')}&background=8B7355&color=fff&size=48`;
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Package className="w-6 h-6" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{item.product_name}</div>
                                            <div className="text-xs text-gray-500">{item.quantity}x €{item.unit_price?.toFixed(2)}</div>
                                          </div>
                                          <span className="font-semibold">€{item.total_price?.toFixed(2)}</span>
                                        </div>
                                      ))}
                                      <div className="p-3 flex justify-between items-center bg-gray-50 font-semibold text-sm">
                                        <span>Totaal</span>
                                        <span className="text-[#8B7355]">€{orderDetail.order?.total_amount?.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Payment & Shipping */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Betaling & Verzending</h4>
                                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm border">
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{orderDetail.order?.payment_method || 'Mollie'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{orderDetail.order?.created_at ? new Date(orderDetail.order.created_at).toLocaleString('nl-NL') : '-'}</span>
                                      </div>
                                      {orderDetail.order?.shipped_at && (
                                        <div className="flex items-center gap-2">
                                          <Truck className="w-3.5 h-3.5 text-gray-400" />
                                          <span>Verzonden: {new Date(orderDetail.order.shipped_at).toLocaleString('nl-NL')}</span>
                                        </div>
                                      )}
                                      {orderDetail.order?.coupon_code && (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Kortingscode: {orderDetail.order.coupon_code} (-&euro;{orderDetail.order.discount_amount?.toFixed(2)})</span>
                                        </div>
                                      )}
                                      {orderDetail.order?.notes && (
                                        <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                                          {orderDetail.order.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between" data-testid="orders-pagination">
            <p className="text-sm text-gray-500">
              Pagina {page} van {totalPages} ({totalOrders} bestellingen)
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1}
                onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const num = start + i;
                if (num > totalPages) return null;
                return (
                  <Button key={num} variant={page === num ? 'default' : 'outline'} size="sm"
                    onClick={() => setPage(num)} className="h-8 w-8 p-0 text-xs">
                    {num}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
