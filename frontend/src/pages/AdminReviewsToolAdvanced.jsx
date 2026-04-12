import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  ArrowLeft, Star, Trash2, Search, RefreshCw, Plus, Eye, EyeOff,
  User, Package, X, Check, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { API_URL } from '../api/client';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [message, setMessage] = useState(null);

  // Add review form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState({
    product_id: '', customer_name: '', rating: 5, content: '', verified: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, productsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/reviews/admin`),
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/reviews/stats`)
      ]);
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.map(p => ({ id: p.id, name: p.short_name || p.name })));
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleVisibility = async (reviewId, currentVisible) => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/visibility?visible=${!currentVisible}`, { method: 'PUT' });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, visible: !currentVisible } : r));
        showMsg('success', `Review ${!currentVisible ? 'zichtbaar' : 'verborgen'}`);
      }
    } catch (error) { showMsg('error', 'Fout bij wijzigen'); }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Weet je zeker dat je deze review wilt verwijderen?')) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        showMsg('success', 'Review verwijderd');
      }
    } catch (error) { showMsg('error', 'Fout bij verwijderen'); }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.product_id || !newReview.customer_name || !newReview.content) {
      showMsg('error', 'Vul alle velden in');
      return;
    }
    setSubmitting(true);
    const product = products.find(p => p.id === newReview.product_id);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReview,
          product_name: product?.name || '',
          source: 'admin'
        })
      });
      if (res.ok) {
        showMsg('success', 'Review toegevoegd!');
        setNewReview({ product_id: '', customer_name: '', rating: 5, content: '', verified: true });
        setShowAddForm(false);
        fetchAll();
      } else {
        const err = await res.json();
        showMsg('error', err.detail || 'Fout bij toevoegen');
      }
    } catch (error) { showMsg('error', 'Fout bij verbinden'); }
    setSubmitting(false);
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Filter reviews
  const filtered = reviews.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!((r.name || r.customer_name || '').toLowerCase().includes(term) ||
            (r.content || '').toLowerCase().includes(term) ||
            (r.product_name || '').toLowerCase().includes(term))) return false;
    }
    if (filterProduct && r.product_id !== filterProduct) return false;
    if (filterRating && r.rating !== parseInt(filterRating)) return false;
    return true;
  });

  const avgRating = stats?.average || stats?.average_rating || 0;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-reviews-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reviews Beheer</h1>
              <p className="text-xs text-gray-500">{reviews.length} reviews | gem. {avgRating.toFixed(1)} sterren</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#8B7355] hover:bg-[#7a6349] h-8 text-xs" data-testid="add-review-btn">
              <Plus className="w-3.5 h-3.5 mr-1" /> Review Toevoegen
            </Button>
            <Button onClick={fetchAll} variant="outline" size="sm" className="h-8">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="review-stats">
            {[5, 4, 3, 2, 1].map(rating => (
              <Card key={rating} className="overflow-hidden">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {Array.from({ length: rating }, (_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-2xl font-bold">{stats.distribution?.[String(rating)] || stats.rating_distribution?.[String(rating)] || 0}</div>
                  <div className="text-xs text-gray-500">reviews</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Review Form */}
        {showAddForm && (
          <Card className="border-2 border-[#8B7355]/30" data-testid="add-review-form">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#8B7355]" /> Nieuwe Review Toevoegen
              </h3>
              <form onSubmit={handleAddReview} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
                  <select value={newReview.product_id}
                    onChange={(e) => setNewReview(prev => ({ ...prev, product_id: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white" data-testid="review-product-select">
                    <option value="">Kies een product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Klantnaam *</label>
                  <Input value={newReview.customer_name} placeholder="Naam van de klant"
                    onChange={(e) => setNewReview(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="h-9" data-testid="review-name-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rating *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} type="button" onClick={() => setNewReview(prev => ({ ...prev, rating: r }))}
                        className="p-1" data-testid={`rating-star-${r}`}>
                        <Star className={`w-6 h-6 ${r <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newReview.verified}
                      onChange={(e) => setNewReview(prev => ({ ...prev, verified: e.target.checked }))}
                      className="rounded" />
                    <span className="text-sm">Geverifieerde aankoop</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Review tekst *</label>
                  <textarea value={newReview.content} placeholder="Schrijf de review..."
                    onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-y" data-testid="review-content-input" />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={submitting} className="bg-[#8B7355] hover:bg-[#7a6349]"
                    data-testid="submit-review-btn">
                    {submitting ? 'Opslaan...' : 'Review Opslaan'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Annuleren</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Zoek op naam, tekst of product..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" data-testid="review-search" />
          </div>
          <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white h-9" data-testid="filter-product">
            <option value="">Alle producten</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white h-9" data-testid="filter-rating">
            <option value="">Alle ratings</option>
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} sterren</option>)}
          </select>
          <span className="text-sm text-gray-500">{filtered.length} resultaten</span>
        </div>

        {/* Reviews List */}
        <Card>
          <CardContent className="p-0 divide-y">
            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" /> Laden...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Geen reviews gevonden</p>
              </div>
            ) : (
              filtered.map((review) => (
                <div key={review.id} className={`p-4 hover:bg-gray-50/80 transition-colors ${!review.visible ? 'opacity-50' : ''}`}
                  data-testid={`review-item-${review.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="font-medium text-sm text-gray-900">{review.name || review.customer_name}</span>
                        {review.verified && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Geverifieerd</span>
                        )}
                        {!review.visible && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Verborgen</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {review.product_name || 'Geen product'}
                        </span>
                        <span>{review.created_at ? new Date(review.created_at).toLocaleDateString('nl-NL') : ''}</span>
                        <span>{review.source || 'website'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggleVisibility(review.id, review.visible)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title={review.visible ? 'Verbergen' : 'Tonen'} data-testid={`toggle-vis-${review.id}`}>
                        {review.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(review.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                        title="Verwijderen" data-testid={`delete-review-${review.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReviewsPage;
