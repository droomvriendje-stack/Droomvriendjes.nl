import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Star, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle2,
  Package,
  User
} from 'lucide-react';
import { products } from '../mockData';
import { API_URL } from '../api/client';


const DroomvriendjesReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoading(false);
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === '' || review.rating === parseInt(filterRating);
    const matchesProduct = filterProduct === '' || review.product_name === filterProduct;
    
    return matchesSearch && matchesRating && matchesProduct;
  });

  // Get unique product names
  const productNames = [...new Set(reviews.map(r => r.product_name))];

  // Calculate statistics
  const stats = {
    total: filteredReviews.length,
    avgRating: filteredReviews.length > 0 
      ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1)
      : 0,
    fiveStars: filteredReviews.filter(r => r.rating === 5).length,
    fourStars: filteredReviews.filter(r => r.rating === 4).length,
    threeStars: filteredReviews.filter(r => r.rating === 3).length,
    twoStars: filteredReviews.filter(r => r.rating === 2).length,
    oneStar: filteredReviews.filter(r => r.rating === 1).length,
  };

  // Render star rating
  const renderStars = (rating, size = 'w-5 h-5') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // Get rating percentage
  const getRatingPercentage = (count) => {
    if (filteredReviews.length === 0) return 0;
    return Math.round((count / filteredReviews.length) * 100);
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-[#F5F1ED] via-white to-[#F5E6D3] min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6d5a43] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Droomvriendjes Reviews
              </h1>
              <p className="text-xl text-white/90 mb-6">
                Ontdek wat onze klanten zeggen over hun Droomvriendjes
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  {renderStars(5, 'w-6 h-6')}
                  <span className="text-2xl font-bold">{stats.avgRating}</span>
                </div>
                <div className="h-8 w-px bg-white/30"></div>
                <div className="text-lg">
                  <span className="font-bold">{stats.total}</span> Reviews
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Statistics */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Rating Verdeling</h3>
                
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = rating === 5 ? stats.fiveStars :
                                  rating === 4 ? stats.fourStars :
                                  rating === 3 ? stats.threeStars :
                                  rating === 2 ? stats.twoStars : stats.oneStar;
                    const percentage = getRatingPercentage(count);
                    
                    return (
                      <div key={rating}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rating}</span>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <span className="text-gray-600">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Filter Section */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Filters</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                      >
                        <option value="">Alle ratings</option>
                        <option value="5">5 sterren</option>
                        <option value="4">4 sterren</option>
                        <option value="3">3 sterren</option>
                        <option value="2">2 sterren</option>
                        <option value="1">1 ster</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product
                      </label>
                      <select
                        value={filterProduct}
                        onChange={(e) => setFilterProduct(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                      >
                        <option value="">Alle producten</option>
                        {productNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {(filterRating || filterProduct) && (
                      <button
                        onClick={() => {
                          setFilterRating('');
                          setFilterProduct('');
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Reviews */}
            <div className="lg:col-span-3">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Zoek reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Reviews List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355]"></div>
                  <p className="mt-4 text-gray-600">Reviews laden...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen reviews gevonden</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterRating || filterProduct
                      ? 'Probeer andere filters of zoektermen'
                      : 'Er zijn nog geen reviews beschikbaar'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {review.avatar ? (
                            <img
                              src={review.avatar}
                              alt={review.name}
                              className="w-14 h-14 rounded-full"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6d5a43] flex items-center justify-center text-white font-bold text-xl">
                              {review.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{review.name}</h4>
                                {review.verified && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Geverifieerd
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                {renderStars(review.rating, 'w-4 h-4')}
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{review.date}</span>
                              </div>
                            </div>
                          </div>

                          {/* Product Badge */}
                          <div className="mb-3">
                            <Link
                              to={`/product/${products.find(p => p.shortName === review.product_name)?.id || 1}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F1ED] hover:bg-[#e8dfd4] rounded-lg text-sm font-medium text-[#8B7355] transition-colors"
                            >
                              <Package className="w-4 h-4" />
                              {review.product_name}
                            </Link>
                          </div>

                          {/* Review Text */}
                          <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>
                          <p className="text-gray-700 leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results Summary */}
              {!loading && filteredReviews.length > 0 && (
                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    {filteredReviews.length} van {reviews.length} reviews
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6d5a43] text-white py-16 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Klaar om je eigen Droomvriendjes ervaring te delen?</h2>
            <p className="text-xl text-white/90 mb-8">
              Bestel vandaag nog en word onderdeel van onze tevreden klanten!
            </p>
            <Link
              to="/knuffels"
              className="inline-block px-8 py-4 bg-white text-[#8B7355] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Bekijk Onze Producten
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DroomvriendjesReviewsPage;
