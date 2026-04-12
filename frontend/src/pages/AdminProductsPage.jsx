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
  Settings
} from 'lucide-react';
import { API_URL } from '../api/client';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Filter products
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.shortName && product.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Producten</h1>
                <p className="text-sm text-gray-500">Beheer je productcatalogus</p>
              </div>
            </div>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Zoek producten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-products"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f5efe8] rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-[#8B7355]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-gray-500">Totaal producten</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.inStock !== false).length}
                </p>
                <p className="text-sm text-gray-500">Op voorraad</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.inStock === false).length}
                </p>
                <p className="text-sm text-gray-500">Uitverkocht</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.badge).length}
                </p>
                <p className="text-sm text-gray-500">Met badge</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355] mx-auto"></div>
            <p className="mt-4 text-gray-500">Laden...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchProducts} variant="outline" className="mt-4">
              Opnieuw proberen
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Geen producten gevonden' : 'Nog geen producten aangemaakt'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow ${
                  product.inStock === false ? 'opacity-75' : ''
                }`}
                data-testid={`product-card-${product.id}`}
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {product.badge && (
                    <span className="absolute top-2 left-2 bg-[#2d2d2d] text-white text-[10px] font-bold px-2 py-1 uppercase">
                      {product.badge}
                    </span>
                  )}
                  {product.inStock === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        UITVERKOCHT
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {product.shortName || product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-[#8B7355]">
                      €{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        €{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                    <span>({product.reviews} reviews)</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
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
                        onClick={() => toggleStock(product)}
                        className={`px-3 rounded-md text-xs font-medium transition-colors ${
                          product.inStock !== false
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {product.inStock !== false ? 'Op voorraad' : 'Uitverkocht'}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        data-testid={`delete-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Link to={`/admin/products/${product.id}/advanced-editor`} className="w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-[#F5F1ED] hover:bg-[#e8dfd4] border-[#8B7355] text-[#8B7355]"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Advanced Editor
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
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

export default AdminProductsPage;
