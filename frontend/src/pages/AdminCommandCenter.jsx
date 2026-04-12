import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_URL } from '../api/client';
import { 
  LayoutDashboard, Package, Star, ShoppingCart, TrendingUp, 
  Settings, LogOut, Users, Euro, Eye, Clock, CheckCircle, 
  XCircle, Edit3, Trash2, Search, Filter, RefreshCw, 
  ChevronDown, ChevronRight, Bell, Moon, Sun, BarChart3,
  Target, Zap, Globe, Mail, MessageSquare, Image, Plus,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Sparkles,
  X, Save, Upload, Grip, Camera, ImagePlus, Layers
} from 'lucide-react';


const AdminCommandCenter = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  
  // State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDays, setSelectedDays] = useState(30);
  const [reviewFilter, setReviewFilter] = useState('all'); // all, pending, approved
  
  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [productForm, setProductForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(null); // 'main' | 'dimensions' | 'features' | 'gallery'
  const [imagePreview, setImagePreview] = useState({});
  const mainImageRef = useRef(null);
  const dimensionsImageRef = useRef(null);
  const featuresImageRef = useRef(null);
  const galleryImageRef = useRef(null);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, [selectedDays]);

  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    
    try {
      // Fetch dashboard stats
      const statsRes = await fetch(`${API_URL}/api/admin/dashboard?days=${selectedDays}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Fetch products
      const productsRes = await fetch(`${API_URL}/api/products`);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      }

      // Fetch reviews for admin
      const reviewsRes = await fetch(`${API_URL}/api/reviews/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data);
      }

      // Fetch orders
      const ordersRes = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Review actions
  const handleApproveReview = async (reviewId) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/visibility`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visible: true })
      });
      if (res.ok) {
        setReviews(reviews.map(r => r.id === reviewId ? {...r, visible: true} : r));
      }
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Weet je zeker dat je deze review wilt verwijderen?')) return;
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  // Product Edit Functions
  const openProductEditor = (product) => {
    setEditingProduct(product);
    setIsCreatingNew(false);
    setProductForm({
      name: product.name || '',
      shortName: product.shortName || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      description: product.description || '',
      features: product.features || [],
      benefits: product.benefits || [],
      sku: product.sku || '',
      series: product.series || 'basic',
      badge: product.badge || '',
      inStock: product.inStock !== false,
      stock: product.stock || 100,
      ageRange: product.ageRange || 'Vanaf 0 maanden',
      warranty: product.warranty || '30 dagen slaapgarantie',
      image: product.image || '',
      gallery: product.gallery || [],
      dimensionsImage: product.dimensionsImage || '',
      macroImage: product.macroImage || '',
      itemCategory: product.itemCategory || 'Knuffels',
      itemCategory2: product.itemCategory2 || '',
      itemCategory3: product.itemCategory3 || '',
    });
    setImagePreview({
      main: product.image || '',
      dimensions: product.dimensionsImage || '',
      features: product.macroImage || '',
    });
    setSaveMessage(null);
  };

  const openNewProductEditor = () => {
    setEditingProduct({ id: 'new' });
    setIsCreatingNew(true);
    setProductForm({
      name: '',
      shortName: '',
      price: 0,
      originalPrice: 0,
      description: '',
      features: [''],
      benefits: [''],
      sku: '',
      series: 'basic',
      badge: '',
      inStock: true,
      stock: 100,
      ageRange: 'Vanaf 0 maanden',
      warranty: '30 dagen slaapgarantie',
      itemCategory: 'Knuffels',
      itemCategory2: '',
      itemCategory3: '',
    });
    setImagePreview({});
    setSaveMessage(null);
  };

  const closeProductEditor = () => {
    setEditingProduct(null);
    setIsCreatingNew(false);
    setProductForm({});
    setImagePreview({});
    setSaveMessage(null);
  };

  const handleProductFormChange = (field, value) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...(productForm.features || [])];
    newFeatures[index] = value;
    setProductForm(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setProductForm(prev => ({ ...prev, features: [...(prev.features || []), ''] }));
  };

  const removeFeature = (index) => {
    const newFeatures = (productForm.features || []).filter((_, i) => i !== index);
    setProductForm(prev => ({ ...prev, features: newFeatures }));
  };

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...(productForm.benefits || [])];
    newBenefits[index] = value;
    setProductForm(prev => ({ ...prev, benefits: newBenefits }));
  };

  const addBenefit = () => {
    setProductForm(prev => ({ ...prev, benefits: [...(prev.benefits || []), ''] }));
  };

  const removeBenefit = (index) => {
    const newBenefits = (productForm.benefits || []).filter((_, i) => i !== index);
    setProductForm(prev => ({ ...prev, benefits: newBenefits }));
  };

  // Image Upload Handler
  const handleImageUpload = async (file, imageType) => {
    if (!file || !editingProduct || editingProduct.id === 'new') return;
    
    setUploadingImage(imageType);
    const token = localStorage.getItem('admin_token');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/products/${editingProduct.id}/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const result = await res.json();
      
      if (res.ok) {
        // Update preview and form
        setImagePreview(prev => ({ ...prev, [imageType]: result.image_url }));
        
        if (imageType === 'main') {
          setProductForm(prev => ({ ...prev, image: result.image_url }));
        } else if (imageType === 'dimensions') {
          setProductForm(prev => ({ ...prev, dimensionsImage: result.image_url }));
        } else if (imageType === 'features') {
          setProductForm(prev => ({ ...prev, macroImage: result.image_url }));
        } else if (imageType === 'gallery') {
          setProductForm(prev => ({ ...prev, gallery: [...(prev.gallery || []), result.image_url] }));
        }
        
        setSaveMessage({ type: 'success', text: `${imageType} afbeelding geüpload!` });
        setTimeout(() => setSaveMessage(null), 2000);
      } else {
        setSaveMessage({ type: 'error', text: result.detail || 'Upload mislukt' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setSaveMessage({ type: 'error', text: 'Netwerkfout bij uploaden' });
    } finally {
      setUploadingImage(null);
    }
  };

  const removeGalleryImage = async (index) => {
    if (!editingProduct || editingProduct.id === 'new') return;
    
    try {
      const res = await fetch(`${API_URL}/api/products/${editingProduct.id}/gallery/${index}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const newGallery = [...(productForm.gallery || [])];
        newGallery.splice(index, 1);
        setProductForm(prev => ({ ...prev, gallery: newGallery }));
      }
    } catch (error) {
      console.error('Error removing gallery image:', error);
    }
  };

  const saveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    setSaveMessage(null);
    
    const token = localStorage.getItem('admin_token');
    
    try {
      let res;
      
      if (isCreatingNew) {
        // Create new product
        res = await fetch(`${API_URL}/api/products/create`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productForm)
        });
      } else {
        // Update existing product
        res = await fetch(`${API_URL}/api/products/${editingProduct.id}/full`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productForm)
        });
      }
      
      if (res.ok) {
        const result = await res.json();
        if (isCreatingNew) {
          setProducts([...products, result.product]);
        } else {
          setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p));
        }
        setSaveMessage({ type: 'success', text: isCreatingNew ? 'Product aangemaakt!' : 'Product opgeslagen!' });
        
        // Refresh products list
        fetchAllData();
        
        setTimeout(() => closeProductEditor(), 1500);
      } else {
        const error = await res.json();
        setSaveMessage({ type: 'error', text: error.detail || 'Fout bij opslaan' });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setSaveMessage({ type: 'error', text: 'Netwerkfout bij opslaan' });
    } finally {
      setSaving(false);
    }
  };

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let filtered = reviews;
    if (reviewFilter === 'pending') {
      filtered = reviews.filter(r => !r.visible);
    } else if (reviewFilter === 'approved') {
      filtered = reviews.filter(r => r.visible);
    }
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.product?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [reviews, reviewFilter, searchQuery]);

  // Stats calculations
  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => !r.visible).length;
    const approved = reviews.filter(r => r.visible).length;
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0';
    return { total, pending, approved, avgRating };
  }, [reviews]);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Producten', icon: Package },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: reviewStats.pending > 0 ? reviewStats.pending : null },
    { id: 'orders', label: 'Bestellingen', icon: ShoppingCart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'marketing', label: 'Marketing', icon: Target },
  ];

  // Render sidebar
  const renderSidebar = () => (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Droomvriendjes</h1>
            <p className="text-xs text-slate-400">Command Center 2026</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeSection === item.id 
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <span className="text-white font-bold">{admin?.username?.[0]?.toUpperCase() || 'A'}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{admin?.username || 'Admin'}</p>
            <p className="text-xs text-slate-400">Beheerder</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Uitloggen</span>
        </button>
      </div>
    </aside>
  );

  // Render dashboard section
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Omzet" 
          value={`€${stats?.stats?.total_revenue?.toFixed(2) || '0.00'}`}
          change="+12.5%"
          positive={true}
          icon={Euro}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard 
          title="Bestellingen" 
          value={stats?.stats?.total_orders || 0}
          change="+8.2%"
          positive={true}
          icon={ShoppingCart}
          gradient="from-blue-500 to-indigo-500"
        />
        <StatCard 
          title="Reviews" 
          value={reviewStats.total}
          subtext={`${reviewStats.pending} wachtend`}
          icon={Star}
          gradient="from-amber-500 to-orange-500"
        />
        <StatCard 
          title="Producten" 
          value={products.length}
          subtext="Live in shop"
          icon={Package}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Recente Activiteit
          </h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order, i) => (
              <div key={order.id || i} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{order.customer_name || 'Klant'}</p>
                  <p className="text-xs text-slate-400">{order.items?.length || 0} items • €{order.total?.toFixed(2) || '0.00'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {order.status || 'pending'}
                </span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Geen recente bestellingen</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Top Producten
          </h3>
          <div className="space-y-3">
            {products.slice(0, 5).map((product, i) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden">
                  <img src={product.image} alt={product.shortName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{product.shortName}</p>
                  <p className="text-xs text-slate-400">€{product.price} • {product.reviews || 0} reviews</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm text-white">{product.rating || '0.0'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Overview */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Review Overzicht
          </h3>
          <button 
            onClick={() => setActiveSection('reviews')}
            className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            Alle reviews <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{reviewStats.avgRating}</p>
            <p className="text-sm text-slate-400">Gem. Rating</p>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{reviewStats.total}</p>
            <p className="text-sm text-slate-400">Totaal Reviews</p>
          </div>
          <div className="bg-emerald-500/20 rounded-xl p-4 text-center border border-emerald-500/30">
            <p className="text-3xl font-bold text-emerald-400">{reviewStats.approved}</p>
            <p className="text-sm text-emerald-400/80">Goedgekeurd</p>
          </div>
          <div className="bg-amber-500/20 rounded-xl p-4 text-center border border-amber-500/30">
            <p className="text-3xl font-bold text-amber-400">{reviewStats.pending}</p>
            <p className="text-sm text-amber-400/80">Wachtend</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render reviews section
  const renderReviews = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Review Beheer</h2>
          <p className="text-slate-400">Bekijk, modereer en beheer klantreviews</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAllData}
            className="p-2 bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Zoek reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved'].map(filter => (
            <button
              key={filter}
              onClick={() => setReviewFilter(filter)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                reviewFilter === filter
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              {filter === 'all' ? 'Alle' : filter === 'pending' ? 'Wachtend' : 'Goedgekeurd'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{reviewStats.total}</p>
            <p className="text-sm text-slate-400">Totaal Reviews</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-emerald-500/30 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{reviewStats.approved}</p>
            <p className="text-sm text-slate-400">Goedgekeurd</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-amber-500/30 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{reviewStats.pending}</p>
            <p className="text-sm text-slate-400">Wachtend op goedkeuring</p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <ReviewCard 
            key={review.id} 
            review={review}
            onApprove={() => handleApproveReview(review.id)}
            onDelete={() => handleDeleteReview(review.id)}
          />
        ))}
        {filteredReviews.length === 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
            <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Geen reviews gevonden</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render products section
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Producten Beheer</h2>
          <p className="text-slate-400">{products.length} producten in de database</p>
        </div>
        <button 
          onClick={openNewProductEditor}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nieuw Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-amber-500/30 transition-all group">
            <div className="aspect-square bg-slate-700/50 relative overflow-hidden">
              <img src={product.image} alt={product.shortName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  product.series === 'ai' ? 'bg-purple-500/80 text-white' :
                  product.series === 'nodding' ? 'bg-blue-500/80 text-white' :
                  'bg-slate-500/80 text-white'
                }`}>
                  {product.series === 'ai' ? 'AI Serie' : product.series === 'nodding' ? 'Nodding Off' : 'Basic'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white mb-1">{product.shortName}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-400">€{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-slate-500 line-through">€{product.originalPrice}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm text-white">{product.rating}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => openProductEditor(product)}
                  className="flex-1 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-all"
                >
                  <Edit3 className="w-4 h-4 inline mr-1" />
                  Bewerken
                </button>
                <button 
                  onClick={() => window.open(`/product/${product.id}`, '_blank')}
                  className="py-2 px-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Product Edit Modal
  const renderProductEditModal = () => {
    if (!editingProduct) return null;
    
    // Image Upload Zone Component
    const ImageUploadZone = ({ type, label, description, imageUrl, inputRef }) => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-400">{label}</label>
        <div 
          onClick={() => !isCreatingNew && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${
            imageUrl ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-600 hover:border-amber-500/50 hover:bg-slate-700/30'
          } ${isCreatingNew ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {imageUrl ? (
            <div className="aspect-video relative">
              <img src={imageUrl} alt={type} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-sm font-medium">Klik om te wijzigen</span>
              </div>
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center p-4">
              {uploadingImage === type ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Uploaden...</span>
                </div>
              ) : (
                <>
                  <Camera className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400 text-center">{description}</p>
                  {isCreatingNew && <p className="text-xs text-amber-400 mt-1">Sla eerst het product op</p>}
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], type)}
          className="hidden"
        />
      </div>
    );
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isCreatingNew ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-slate-700 overflow-hidden'}`}>
                {isCreatingNew ? (
                  <Plus className="w-8 h-8 text-white" />
                ) : (
                  <img src={imagePreview.main || editingProduct.image} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{isCreatingNew ? 'Nieuw Product Aanmaken' : 'Product Bewerken'}</h2>
                <p className="text-slate-400">{isCreatingNew ? 'Vul alle velden in' : `${editingProduct.shortName} • SKU: ${editingProduct.sku}`}</p>
              </div>
            </div>
            <button 
              onClick={closeProductEditor}
              className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Save Message */}
            {saveMessage && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                saveMessage.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {saveMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {saveMessage.text}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Productnaam (volledig)</label>
                <input
                  type="text"
                  value={productForm.name || ''}
                  onChange={(e) => handleProductFormChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="Volledige productnaam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Korte naam</label>
                <input
                  type="text"
                  value={productForm.shortName || ''}
                  onChange={(e) => handleProductFormChange('shortName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="Bijv. Slaperig Schaapje"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Prijs (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price || ''}
                  onChange={(e) => handleProductFormChange('price', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Originele prijs (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.originalPrice || ''}
                  onChange={(e) => handleProductFormChange('originalPrice', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Voorraad</label>
                <input
                  type="number"
                  value={productForm.stock || ''}
                  onChange={(e) => handleProductFormChange('stock', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Series & Badge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Product Serie</label>
                <select
                  value={productForm.series || 'basic'}
                  onChange={(e) => handleProductFormChange('series', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ai">AI Serie (USB-C)</option>
                  <option value="nodding">Nodding Off (60 melodieën)</option>
                  <option value="basic">Basic Serie</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Badge</label>
                <select
                  value={productForm.badge || ''}
                  onChange={(e) => handleProductFormChange('badge', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Geen badge</option>
                  <option value="BESTSELLER">BESTSELLER</option>
                  <option value="POPULAIR">POPULAIR</option>
                  <option value="NIEUW">NIEUW</option>
                  <option value="FAVORIET">FAVORIET</option>
                  <option value="MAGISCH">MAGISCH</option>
                  <option value="VOORDEELSET">VOORDEELSET</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">SKU</label>
                <input
                  type="text"
                  value={productForm.sku || ''}
                  onChange={(e) => handleProductFormChange('sku', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Beschrijving</label>
              <textarea
                value={productForm.description || ''}
                onChange={(e) => handleProductFormChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500 resize-none"
                placeholder="Productbeschrijving..."
              />
            </div>

            {/* ============== MEDIA GALERIJ ============== */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Media Galerij
              </h3>
              
              {/* Main Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <ImageUploadZone 
                  type="main"
                  label="Hoofdfoto"
                  description="Primaire afbeelding voor de shop"
                  imageUrl={imagePreview.main}
                  inputRef={mainImageRef}
                />
                <ImageUploadZone 
                  type="dimensions"
                  label="Detailfoto 1 (Afmetingen)"
                  description="Technische specificaties"
                  imageUrl={imagePreview.dimensions}
                  inputRef={dimensionsImageRef}
                />
                <ImageUploadZone 
                  type="features"
                  label="Detailfoto 2 (Kenmerken)"
                  description="Marketing features"
                  imageUrl={imagePreview.features}
                  inputRef={featuresImageRef}
                />
              </div>

              {/* Gallery Carousel */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-400">Extra Carrousel Foto's</label>
                  {!isCreatingNew && (
                    <button 
                      onClick={() => galleryImageRef.current?.click()}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <ImagePlus className="w-3 h-3" /> Foto toevoegen
                    </button>
                  )}
                </div>
                <input
                  ref={galleryImageRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'gallery')}
                  className="hidden"
                />
                
                {/* Gallery Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(productForm.gallery || []).map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-600">
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button 
                          onClick={() => removeGalleryImage(idx)}
                          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                  {(productForm.gallery || []).length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-500 border border-dashed border-slate-600 rounded-lg">
                      {isCreatingNew ? 'Sla eerst het product op om foto\'s toe te voegen' : 'Nog geen extra foto\'s toegevoegd'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* ============== END MEDIA GALERIJ ============== */}

            {/* Features */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-400">Features</label>
                <button 
                  onClick={addFeature}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Toevoegen
                </button>
              </div>
              <div className="space-y-2">
                {(productForm.features || []).map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                      placeholder="Feature..."
                    />
                    <button 
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-400">Voordelen (met emoji's)</label>
                <button 
                  onClick={addBenefit}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Toevoegen
                </button>
              </div>
              <div className="space-y-2">
                {(productForm.benefits || []).map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                      placeholder="🎶 Voordeel met emoji..."
                    />
                    <button 
                      onClick={() => removeBenefit(index)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Toggle */}
            <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.inStock}
                  onChange={(e) => handleProductFormChange('inStock', e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-white font-medium">Product is op voorraad</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex items-center justify-end gap-3">
            <button 
              onClick={closeProductEditor}
              className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all"
            >
              Annuleren
            </button>
            <button 
              onClick={saveProduct}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Opslaan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render orders section
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Bestellingen</h2>
          <p className="text-slate-400">{orders.length} bestellingen in de database</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Order ID</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Klant</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Items</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Totaal</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Datum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {orders.map((order, i) => (
              <tr key={order.id || i} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4 text-sm text-white font-mono">#{order.id?.slice(0, 8) || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-white">{order.customer_name || 'Onbekend'}</td>
                <td className="px-6 py-4 text-sm text-slate-300">{order.items?.length || 0} items</td>
                <td className="px-6 py-4 text-sm text-amber-400 font-medium">€{order.total?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                    order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {order.status || 'pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString('nl-NL') : 'N/A'}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                  Geen bestellingen gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render analytics section
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-slate-400">Inzichten in je webshop prestaties</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Conversie Funnel</h3>
          <div className="space-y-4">
            {[
              { label: 'Bezoekers', value: stats?.funnel?.page_views || 0, color: 'bg-blue-500' },
              { label: 'Product Views', value: stats?.funnel?.product_views || 0, color: 'bg-indigo-500' },
              { label: 'Winkelwagen', value: stats?.funnel?.cart_adds || 0, color: 'bg-purple-500' },
              { label: 'Checkout', value: stats?.funnel?.checkouts || 0, color: 'bg-pink-500' },
              { label: 'Aankopen', value: stats?.funnel?.purchases || 0, color: 'bg-emerald-500' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32 text-sm text-slate-400">{step.label}</div>
                <div className="flex-1 h-8 bg-slate-700/30 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full ${step.color} flex items-center justify-end pr-3`}
                    style={{ width: `${Math.min(100, (step.value / (stats?.funnel?.page_views || 1)) * 100)}%` }}
                  >
                    <span className="text-xs font-medium text-white">{step.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Gem. Orderwaarde</p>
              <p className="text-2xl font-bold text-white">€{stats?.stats?.avg_order_value?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Conversie Rate</p>
              <p className="text-2xl font-bold text-emerald-400">{stats?.funnel?.conversion_rate?.toFixed(1) || '0'}%</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Totale Omzet</p>
              <p className="text-2xl font-bold text-amber-400">€{stats?.stats?.total_revenue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4">
              <p className="text-sm text-slate-400 mb-1">Aantal Orders</p>
              <p className="text-2xl font-bold text-white">{stats?.stats?.total_orders || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render marketing section
  const renderMarketing = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Marketing Hub</h2>
        <p className="text-slate-400">Beheer je marketing campagnes en kanalen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Globe, title: 'SEO Optimalisatie', desc: 'Meta tags & content', color: 'from-blue-500 to-indigo-500', link: '/admin/merchant-feed' },
          { icon: Mail, title: 'Email Campagnes', desc: 'Nieuwsbrieven & flows', color: 'from-emerald-500 to-teal-500', link: '/admin/email-marketing' },
          { icon: Target, title: 'Google Ads', desc: 'PPC campagnes', color: 'from-red-500 to-orange-500', link: '/admin/google-ads' },
        ].map((item, i) => (
          <div 
            key={i} 
            onClick={() => navigate(item.link)}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-amber-500/30 transition-all cursor-pointer group"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <item.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
            <p className="text-sm text-slate-400">{item.desc}</p>
            <div className="mt-4 flex items-center text-amber-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Openen <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Additional Marketing Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => navigate('/admin/shopping-campaigns')}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Shopping Campaigns</h3>
              <p className="text-sm text-slate-400">Google Shopping beheer</p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => navigate('/admin/keywords')}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Keyword Research</h3>
              <p className="text-sm text-slate-400">Zoekwoorden analyse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'reviews': return renderReviews();
      case 'products': return renderProducts();
      case 'orders': return renderOrders();
      case 'analytics': return renderAnalytics();
      case 'marketing': return renderMarketing();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {renderSidebar()}
      
      {/* Main content */}
      <main className="ml-64 p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white capitalize">{activeSection}</h1>
            <p className="text-slate-400">
              {new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value={7}>Laatste 7 dagen</option>
              <option value={30}>Laatste 30 dagen</option>
              <option value={90}>Laatste 90 dagen</option>
            </select>
            <button className="relative p-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-all">
              <Bell className="w-5 h-5" />
              {reviewStats.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {reviewStats.pending}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          renderContent()
        )}
      </main>
      
      {/* Product Edit Modal */}
      {renderProductEditModal()}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, positive, subtext, icon: Icon, gradient }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change && (
        <span className={`flex items-center gap-1 text-sm font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {change}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-slate-400">{subtext || title}</p>
  </div>
);

// Review Card Component
const ReviewCard = ({ review, onApprove, onDelete }) => (
  <div className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl border ${review.visible ? 'border-emerald-500/30' : 'border-amber-500/30'} p-6 transition-all`}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{review.name?.[0]?.toUpperCase() || '?'}</span>
        </div>
        <div>
          <p className="font-medium text-white">{review.name || 'Anoniem'}</p>
          <p className="text-sm text-slate-400">{review.product || 'Onbekend product'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
            />
          ))}
        </div>
        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
          review.visible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {review.visible ? 'Live' : 'Wachtend'}
        </span>
      </div>
    </div>
    
    {review.title && (
      <h4 className="font-medium text-white mb-2">"{review.title}"</h4>
    )}
    <p className="text-slate-300 mb-4 line-clamp-3">{review.text || 'Geen tekst'}</p>
    
    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
      <p className="text-xs text-slate-500">
        {review.created_at ? new Date(review.created_at).toLocaleDateString('nl-NL') : 'Onbekende datum'}
      </p>
      <div className="flex items-center gap-2">
        {!review.visible && (
          <button 
            onClick={onApprove}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Goedkeuren
          </button>
        )}
        <button 
          onClick={onDelete}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Verwijderen
        </button>
      </div>
    </div>
  </div>
);

export default AdminCommandCenter;
