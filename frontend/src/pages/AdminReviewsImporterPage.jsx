import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { API_URL } from '../api/client';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  Star, 
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Package,
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  FileText
} from 'lucide-react';
import { products as mockProducts } from '../mockData';


const AdminReviewsImporterPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');

  // Products from Supabase
  const [products, setProducts] = useState([]);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.map(p => ({
          id: p.id,
          shortName: p.short_name || p.shortName || p.name,
          name: p.name,
          image: p.image,
          price: p.price
        })));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch reviews from database (including hidden for admin)
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoadingReviews(false);
  };

  // Fetch review stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchStats();
  }, []);

  // Handle toggle visibility
  const handleToggleVisibility = async (reviewId, currentVisible) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}/visibility?visible=${!currentVisible}`, {
        method: 'PUT'
      });

      if (response.ok) {
        fetchReviews();
      } else {
        alert('Wijzigen mislukt');
      }
    } catch (error) {
      alert('Er ging iets mis');
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Selecteer een CSV-bestand');
    }
  };

  // Handle CSV import
  const handleImport = async () => {
    if (!selectedProduct || !file) {
      alert('Selecteer een product en CSV-bestand');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', selectedProduct.id);
      formData.append('product_name', selectedProduct.shortName);

      const response = await fetch(`${API_URL}/api/reviews/import-csv`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportResult({
          success: true,
          ...result
        });
        // Refresh reviews and stats
        fetchReviews();
        fetchStats();
        setFile(null);
      } else {
        setImportResult({
          success: false,
          errors: [result.detail || 'Import mislukt']
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [error.message]
      });
    }

    setImporting(false);
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Weet je zeker dat je deze review wilt verwijderen?')) return;

    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchReviews();
        fetchStats();
      } else {
        alert('Verwijderen mislukt');
      }
    } catch (error) {
      alert('Er ging iets mis');
    }
  };

  // Handle delete all reviews
  const handleDeleteAllReviews = async () => {
    if (!window.confirm(`Weet je zeker dat je ALLE ${reviews.length} reviews wilt verwijderen? Dit kan niet ongedaan worden gemaakt!`)) return;

    try {
      const ids = reviews.map(r => r.id);
      const response = await fetch(`${API_URL}/api/reviews/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.deleted} reviews verwijderd`);
        fetchReviews();
        fetchStats();
      } else {
        alert('Verwijderen mislukt');
      }
    } catch (error) {
      alert('Er ging iets mis');
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = 'name,rating,title,text,verified,avatar_url,date\nJan Jansen,5,Geweldige knuffel!,Mijn kind slaapt nu veel beter. Aanrader!,true,,2 weken geleden\nMarie de Vries,4,Fijn product,Goede kwaliteit en snelle levering.,true,,1 maand geleden';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reviews_template.csv';
    a.click();
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = !filterProduct || review.product_name === filterProduct;
    const matchesSource = !filterSource || review.source === filterSource;
    const matchesVisibility = !filterVisibility || 
      (filterVisibility === 'visible' && review.visible !== false) ||
      (filterVisibility === 'hidden' && review.visible === false);
    return matchesSearch && matchesProduct && matchesSource && matchesVisibility;
  });

  // Get unique product names for filter
  const productNames = [...new Set(reviews.map(r => r.product_name))];

  // Count stats
  const userSubmittedCount = reviews.filter(r => r.source === 'user_submitted').length;
  const csvImportedCount = reviews.filter(r => r.source === 'csv_import').length;
  const hiddenCount = reviews.filter(r => r.visible === false).length;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-reviews-importer">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reviews Importeren</h1>
                <p className="text-sm text-gray-500">Importeer reviews via CSV voor elk product</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {reviews.length > 0 && (
                <Button
                  onClick={handleDeleteAllReviews}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  data-testid="delete-all-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  Alles Verwijderen ({reviews.length})
                </Button>
              )}
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="download-template-btn"
              >
                <Download className="w-4 h-4" />
                CSV Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Import Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#8B7355]" />
                CSV Importeren
              </h2>

              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[#f5efe8] rounded-lg p-3">
                    <p className="text-2xl font-bold text-[#8B7355]">{stats.total_reviews}</p>
                    <p className="text-xs text-gray-600">Totaal reviews</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-amber-600">{stats.by_product?.length || 0}</p>
                    <p className="text-xs text-gray-600">Producten</p>
                  </div>
                </div>
              )}

              {/* Step 1: Select Product */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Selecteer product
                </label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  data-testid="product-select"
                >
                  <option value="">Kies een product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.shortName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Product Preview */}
              {selectedProduct && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.shortName}
                    className="w-12 h-12 object-contain rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{selectedProduct.shortName}</p>
                    <p className="text-xs text-gray-500">€{selectedProduct.price}</p>
                  </div>
                </div>
              )}

              {/* Step 2: Upload CSV */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Upload CSV-bestand
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#8B7355] transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                    data-testid="csv-upload-input"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    {file ? (
                      <p className="text-sm text-[#8B7355] font-medium">{file.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Klik om CSV te selecteren</p>
                    )}
                  </label>
                </div>
              </div>

              {/* Step 3: Import Button */}
              <Button
                onClick={handleImport}
                disabled={!selectedProduct || !file || importing}
                className="w-full bg-[#8B7355] hover:bg-[#6d5a45]"
                data-testid="import-btn"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importeren...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Reviews Importeren
                  </>
                )}
              </Button>

              {/* Import Result */}
              {importResult && (
                <div className={`mt-4 p-4 rounded-lg ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {importResult.success ? 'Import succesvol!' : 'Import mislukt'}
                    </span>
                  </div>
                  
                  {importResult.success && (
                    <div className="text-sm text-green-700">
                      <p>✓ {importResult.imported} reviews geïmporteerd</p>
                      {importResult.skipped > 0 && (
                        <p>⚠ {importResult.skipped} overgeslagen</p>
                      )}
                    </div>
                  )}
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-700 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, i) => (
                        <p key={i} className="flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CSV Format Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2 text-sm">CSV Formaat</h3>
                <p className="text-xs text-blue-700 mb-2">Vereiste kolommen:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• <strong>name</strong> - Naam reviewer</li>
                  <li>• <strong>rating</strong> - 1 tot 5 sterren</li>
                  <li>• <strong>text</strong> - Review tekst</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2">Optioneel:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• title, verified, avatar_url, date</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Stats Bar */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-600">
                    Totaal: <strong className="text-gray-900">{reviews.length}</strong>
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    CSV: <strong className="text-blue-600">{csvImportedCount}</strong>
                  </span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Gebruikers: <strong className="text-green-600">{userSubmittedCount}</strong>
                  </span>
                  {hiddenCount > 0 && (
                    <span className="text-gray-600 flex items-center gap-1">
                      <EyeOff className="w-4 h-4" />
                      Verborgen: <strong className="text-orange-600">{hiddenCount}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="p-4 border-b">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Zoek in reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="search-reviews"
                    />
                  </div>
                  <select
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm min-w-[150px]"
                    data-testid="filter-product"
                  >
                    <option value="">Alle producten</option>
                    {productNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm min-w-[130px]"
                    data-testid="filter-source"
                  >
                    <option value="">Alle bronnen</option>
                    <option value="csv_import">CSV Import</option>
                    <option value="user_submitted">Gebruiker</option>
                  </select>
                  <select
                    value={filterVisibility}
                    onChange={(e) => setFilterVisibility(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm min-w-[130px]"
                    data-testid="filter-visibility"
                  >
                    <option value="">Alle status</option>
                    <option value="visible">Zichtbaar</option>
                    <option value="hidden">Verborgen</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { fetchReviews(); fetchStats(); }}
                    data-testid="refresh-btn"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Reviews Table */}
              <div className="overflow-x-auto">
                {loadingReviews ? (
                  <div className="p-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Laden...</p>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Geen reviews gevonden</p>
                    <p className="text-sm text-gray-400">Pas je filters aan of importeer reviews via CSV</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rating</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bron</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredReviews.map((review) => (
                        <tr 
                          key={review.id} 
                          className={`hover:bg-gray-50 ${review.visible === false ? 'opacity-50 bg-gray-50' : ''}`} 
                          data-testid={`review-row-${review.id}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={review.avatar || `https://ui-avatars.com/api/?name=${review.name}&background=8B7355&color=fff`}
                                alt={review.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{review.name}</p>
                                <p className="text-xs text-gray-500">{review.date}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f5efe8] text-[#8B7355] rounded text-xs font-medium">
                              <Package className="w-3 h-3" />
                              {review.product_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-sm text-gray-900 font-medium truncate">{review.title}</p>
                            <p className="text-xs text-gray-500 truncate">{review.text}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              review.source === 'user_submitted' 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {review.source === 'user_submitted' ? (
                                <><User className="w-3 h-3" /> Gebruiker</>
                              ) : (
                                <><FileText className="w-3 h-3" /> CSV</>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleToggleVisibility(review.id, review.visible !== false)}
                                className={`p-2 rounded-lg transition-colors ${
                                  review.visible === false 
                                    ? 'text-orange-500 hover:bg-orange-50' 
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                                title={review.visible === false ? 'Tonen' : 'Verbergen'}
                                data-testid={`toggle-visibility-${review.id}`}
                              >
                                {review.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                data-testid={`delete-review-${review.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Results Count */}
              {filteredReviews.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <p className="text-sm text-gray-500">
                    {filteredReviews.length} van {reviews.length} reviews
                  </p>
                </div>
              )}
            </div>

            {/* Product Stats */}
            {stats && stats.by_product && stats.by_product.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews per Product</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {stats.by_product.map((stat) => (
                    <div key={stat.product_name} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 text-sm truncate">{stat.product_name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-bold text-[#8B7355]">{stat.count}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{stat.avg_rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsImporterPage;
