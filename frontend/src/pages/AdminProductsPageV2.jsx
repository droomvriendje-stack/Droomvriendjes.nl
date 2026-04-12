import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft, 
  Package, 
  Search,
  Star,
  Check,
  X,
  Image as ImageIcon,
  Euro,
  Settings,
  Grid3x3,
  List as ListIcon,
  Filter,
  Eye,
  EyeOff,
  MoreVertical,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Edit2,
  Sparkles
} from 'lucide-react';
import { API_URL } from '../api/client';


const AdminProductsPageV2 = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStock, setFilterStock] = useState('all'); // 'all', 'inStock', 'outOfStock'
  const [filterBadge, setFilterBadge] = useState('all'); // 'all', 'BESTSELLER', 'POPULAIR', etc.
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    price: '',
    originalPrice: '',
    image: '',
    description: '',
    badge: '',
    inStock: true,
    rating: '4.5',
    reviews: '0',
    features: '',
    benefits: ''
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        name: formData.name,
        shortName: formData.shortName,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        image: formData.image,
        description: formData.description,
        badge: formData.badge || null,
        inStock: formData.inStock,
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        features: formData.features.split('\n').filter(f => f.trim()),
        benefits: formData.benefits.split('\n').filter(b => b.trim()),
        gallery: [formData.image],
        ageRange: "Vanaf 0 maanden",
        warranty: "14 dagen geld-terug-garantie"
      };

      const url = editingProduct 
        ? `${API_URL}/api/products/${editingProduct.id}`
        : `${API_URL}/api/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save product');
      }

      await fetchProducts();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (productId) => {
    if (!window.confirm('Weet je zeker dat je dit product wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete product');
      
      await fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      shortName: product.shortName || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      image: product.image,
      description: product.description,
      badge: product.badge || '',
      inStock: product.inStock !== false,
      rating: product.rating.toString(),
      reviews: product.reviews.toString(),
      features: (product.features || []).join('\n'),
      benefits: (product.benefits || []).join('\n')
    });
    setShowModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      shortName: '',
      price: '',
      originalPrice: '',
      image: '',
      description: '',
      badge: '',
      inStock: true,
      rating: '4.5',
      reviews: '0',
      features: '',
      benefits: ''
    });
  };

  // Toggle stock status
  const toggleStock = async (product) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !product.inStock })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      await fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Weet je zeker dat je ${selectedProducts.length} producten wilt verwijderen?`)) return;
    
    try {
      await Promise.all(
        selectedProducts.map(id => 
          fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' })
        )
      );
      await fetchProducts();
      setSelectedProducts([]);
    } catch (err) {
      alert('Fout bij het verwijderen van producten');
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.shortName && product.shortName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Stock filter
    const matchesStock = filterStock === 'all' ? true :
      filterStock === 'inStock' ? product.inStock !== false :
      product.inStock === false;
    
    // Badge filter
    const matchesBadge = filterBadge === 'all' ? true : product.badge === filterBadge;
    
    // Price filter
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
    
    return matchesSearch && matchesStock && matchesBadge && matchesPrice;
  });

  // Calculate stats
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.inStock !== false).length,
    outOfStock: products.filter(p => p.inStock === false).length,
    withBadge: products.filter(p => p.badge).length,
    avgPrice: products.length > 0 
      ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)
      : 0,
    avgRating: products.length > 0
      ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1)
      : 0,
    totalReviews: products.reduce((sum, p) => sum + (p.reviews || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#fdf8f3] to-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-7 h-7 text-[#8B7355]" />
                  Productbeheer
                </h1>
                <p className="text-sm text-gray-500">Beheer je complete productcatalogus</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedProducts.length > 0 && (
                <Button 
                  onClick={handleBulkDelete}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Verwijder ({selectedProducts.length})
                </Button>
              )}
              <Button 
                onClick={() => setShowModal(true)}
                className="bg-[#8B7355] hover:bg-[#6d5a45]"
                data-testid="add-product-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuw Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-[#8B7355] col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8B7355] to-[#6d5a45] rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Totaal</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inStock}</p>
                <p className="text-xs text-gray-500">Voorraad</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
                <p className="text-xs text-gray-500">Uitverkocht</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.withBadge}</p>
                <p className="text-xs text-gray-500">Met Badge</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Euro className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">€{stats.avgPrice}</p>
                <p className="text-xs text-gray-500">Gem. Prijs</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                <p className="text-xs text-gray-500">Gem. Rating</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                <p className="text-xs text-gray-500">Reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Zoek op naam of korte naam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-products"
              />
            </div>

            {/* View Toggle & Filters */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-[#8B7355] text-white' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#8B7355] text-white' : 'text-gray-600'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#8B7355] text-white' : 'text-gray-600'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
              
              {filteredProducts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllProducts}
                >
                  {selectedProducts.length === filteredProducts.length ? 'Deselecteer' : 'Selecteer'} Alles
                </Button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voorraad Status</label>
                <select
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="all">Alles</option>
                  <option value="inStock">Op voorraad</option>
                  <option value="outOfStock">Uitverkocht</option>
                </select>
              </div>

              {/* Badge Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Badge</label>
                <select
                  value={filterBadge}
                  onChange={(e) => setFilterBadge(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="all">Alles</option>
                  <option value="BESTSELLER">BESTSELLER</option>
                  <option value="POPULAIR">POPULAIR</option>
                  <option value="NIEUW">NIEUW</option>
                  <option value="VOORDEELSET">VOORDEELSET</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prijs: €{priceRange.min} - €{priceRange.max}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseFloat(e.target.value) || 0 })}
                    placeholder="Min"
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseFloat(e.target.value) || 1000 })}
                    placeholder="Max"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mx-auto"></div>
            <p className="mt-4 text-gray-500">Producten laden...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProducts} variant="outline">
              Opnieuw proberen
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm || filterStock !== 'all' || filterBadge !== 'all' 
                ? 'Geen producten gevonden met deze filters' 
                : 'Nog geen producten aangemaakt'}
            </p>
            {(searchTerm || filterStock !== 'all' || filterBadge !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStock('all');
                  setFilterBadge('all');
                  setPriceRange({ min: 0, max: 1000 });
                }}
                variant="outline"
                className="mt-4"
              >
                Filters wissen
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`bg-white rounded-xl overflow-hidden shadow-sm border-2 hover:shadow-xl hover:border-[#8B7355] transition-all duration-300 ${
                  product.inStock === false ? 'opacity-75' : ''
                } ${selectedProducts.includes(product.id) ? 'border-[#8B7355] ring-4 ring-[#8B7355]/20' : ''}`}
                data-testid={`product-card-${product.id}`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleSelectProduct(product.id)}
                    className="w-5 h-5 rounded border-2 border-white shadow-lg cursor-pointer"
                  />
                </div>

                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain p-6"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  {product.badge && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-[#2d2d2d] to-[#1a1a1a] text-white text-[10px] font-bold px-3 py-1.5 uppercase rounded-full shadow-lg">
                      {product.badge}
                    </span>
                  )}
                  {product.inStock === false && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        UITVERKOCHT
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">
                    {product.shortName || product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-[#8B7355]">
                      €{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        €{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{product.rating}</span>
                    <span className="text-gray-400">({product.reviews} reviews)</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                        className="flex-1"
                        data-testid={`edit-product-${product.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Bewerk
                      </Button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-2 text-sm text-red-600 border border-red-300 hover:bg-red-50 rounded-md transition-colors"
                        data-testid={`delete-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => toggleStock(product)}
                      className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        product.inStock !== false
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                      }`}
                    >
                      {product.inStock !== false ? '✓ Op voorraad' : '✗ Uitverkocht'}
                    </button>
                    
                    <Link to={`/admin/products/${product.id}/advanced-editor`} className="w-full">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#8B7355] to-[#6d5a45] hover:from-[#6d5a45] hover:to-[#5a4a3a] text-white shadow-md"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Advanced Editor
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length}
                      onChange={selectAllProducts}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prijs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Voorraad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Badge</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${
                      selectedProducts.includes(product.id) ? 'bg-[#fdf8f3]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-12 h-12 object-contain rounded-lg bg-gray-50"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{product.shortName || product.name}</p>
                          <p className="text-xs text-gray-500">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-[#8B7355]">€{product.price.toFixed(2)}</p>
                        {product.originalPrice && (
                          <p className="text-xs text-gray-400 line-through">€{product.originalPrice.toFixed(2)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.inStock !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.inStock !== false ? 'Op voorraad' : 'Uitverkocht'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.badge ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-[#2d2d2d] text-white">
                          {product.badge}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{product.rating}</span>
                        <span className="text-xs text-gray-400">({product.reviews})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Link to={`/admin/products/${product.id}/advanced-editor`}>
                          <Button
                            size="sm"
                            className="bg-[#8B7355] hover:bg-[#6d5a45]"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal (Keep existing modal code) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-testid="product-modal">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Product Bewerken' : 'Nieuw Product'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Baby Slaapmaatje Leeuw - Projector Nachtlamp"
                    required
                    data-testid="input-name"
                  />
                </div>

                {/* Short Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Korte naam
                  </label>
                  <Input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="Leeuw Projector"
                    data-testid="input-short-name"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    data-testid="input-badge"
                  >
                    <option value="">Geen badge</option>
                    <option value="BESTSELLER">BESTSELLER</option>
                    <option value="POPULAIR">POPULAIR</option>
                    <option value="NIEUW">NIEUW</option>
                    <option value="VOORDEELSET">VOORDEELSET</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prijs (€) *
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="49.95"
                    required
                    min="0"
                    step="0.01"
                    data-testid="input-price"
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Originele prijs (€)
                  </label>
                  <Input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="64.95"
                    min="0"
                    step="0.01"
                    data-testid="input-original-price"
                  />
                </div>

                {/* Image URL */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Afbeelding URL *
                  </label>
                  <Input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://i.imgur.com/..."
                    required
                    data-testid="input-image"
                  />
                  {formData.image && (
                    <div className="mt-2 w-20 h-20 bg-gray-100 rounded overflow-hidden">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Een prachtige leeuw die sterren projecteert..."
                    required
                    rows={3}
                    className="w-full border rounded-md px-3 py-2"
                    data-testid="input-description"
                  />
                </div>

                {/* Features */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features (één per regel)
                  </label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="🌟 Sterrenprojectie in 3 kleuren&#10;🎵 8 rustgevende slaapliedjes"
                    rows={4}
                    className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                    data-testid="input-features"
                  />
                </div>

                {/* Rating & Reviews */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <Input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    min="1"
                    max="5"
                    step="0.1"
                    data-testid="input-rating"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aantal reviews
                  </label>
                  <Input
                    type="number"
                    value={formData.reviews}
                    onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                    min="0"
                    data-testid="input-reviews"
                  />
                </div>

                {/* In Stock Toggle */}
                <div className="col-span-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.inStock ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.inStock ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {formData.inStock ? 'Op voorraad' : 'Uitverkocht'}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#8B7355] hover:bg-[#6d5a45]"
                  data-testid="save-product-btn"
                >
                  {editingProduct ? 'Opslaan' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPageV2;
