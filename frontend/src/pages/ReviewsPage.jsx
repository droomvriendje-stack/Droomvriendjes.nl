import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Star, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { products } from '../mockData';
import Layout from '../components/Layout';
import { API_URL } from '../api/client';


const ReviewsPage = () => {
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Fetch reviews from database
  useEffect(() => {
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

    fetchReviews();
    fetchStats();
  }, []);

  // Get unique products from reviews
  const productNames = [...new Set(reviews.map(r => r.product_name))];

  // Filter reviews
  const filteredReviews = reviews
    .filter(review => selectedProduct === 'all' || review.product_name === selectedProduct)
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // Default to original order (recent)
    });

  // Calculate stats
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(r => r.rating === rating).length
  );

  if (loading) {
    return (
      <Layout backButtonText="Terug naar Home">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fdf8f3] to-white">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#8B7355] mx-auto mb-4" />
            <p className="text-gray-600">Reviews laden...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (reviews.length === 0) {
    return (
      <Layout backButtonText="Terug naar Home">
        <div className="min-h-screen bg-gradient-to-b from-[#fdf8f3] to-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-[#5a4a3a] mb-4">
                Klantbeoordelingen
              </h1>
              <div className="bg-white rounded-2xl border border-gray-200 p-12 mt-8">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nog geen reviews beschikbaar.</p>
                <p className="text-gray-400 mt-2">Binnenkort komen hier echte klantbeoordelingen!</p>
                <Link to="/">
                  <Button className="mt-6 bg-[#8B7355] hover:bg-[#6d5a45]">
                    Bekijk onze producten
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backButtonText="Terug naar Home">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#fdf8f3] to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Trustpilot Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-md border border-gray-100 mb-6">
              <span className="text-green-500 font-bold text-lg">★</span>
              <span className="text-gray-700 font-semibold">Trustpilot</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#5a4a3a] mb-4">
              Klantbeoordelingen
            </h1>
            
            {/* Rating Summary */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-8 h-8 fill-green-500 text-green-500" />
                ))}
              </div>
              <span className="text-3xl font-bold text-gray-900">{avgRating}/5</span>
            </div>
            
            {/* Customer Avatars */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {reviews.slice(0, 5).map((review, idx) => (
                  <img 
                    key={idx}
                    src={review.avatar || `https://ui-avatars.com/api/?name=${review.name}&background=8B7355&color=fff`}
                    alt={review.name} 
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
                  />
                ))}
                {reviews.length > 5 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-[#8B7355] flex items-center justify-center text-white text-xs font-bold">
                    +{reviews.length - 5}
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-lg text-gray-600">
              Gebaseerd op <span className="font-bold text-gray-900">{reviews.length}</span> geverifieerde reviews
            </p>
          </div>
        </div>
      </div>

      {/* Rating Breakdown & Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Rating Breakdown */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
              <h3 className="font-bold text-[#5a4a3a] mb-4">Beoordelingen</h3>
              
              {/* Rating Bars */}
              <div className="space-y-3 mb-6">
                {[5, 4, 3, 2, 1].map((rating, index) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 w-12">{rating} ster</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-amber-400 h-2.5 rounded-full transition-all"
                        style={{ width: reviews.length > 0 ? `${(ratingCounts[index] / reviews.length) * 100}%` : '0%' }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{ratingCounts[index]}</span>
                  </div>
                ))}
              </div>

              {/* Product Filter */}
              <h3 className="font-bold text-[#5a4a3a] mb-3">Filter op product</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedProduct('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedProduct === 'all' 
                      ? 'bg-[#8B7355] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alle producten ({reviews.length})
                </button>
                {productNames.map((product) => (
                  <button
                    key={product}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedProduct === product 
                        ? 'bg-[#8B7355] text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {product} ({reviews.filter(r => r.product_name === product).length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="lg:col-span-3">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                <span className="font-bold text-gray-900">{filteredReviews.length}</span> reviews gevonden
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
              >
                <option value="recent">Meest recent</option>
                <option value="rating">Hoogste beoordeling</option>
              </select>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div 
                  key={review.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all"
                  data-testid={`review-${review.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <img 
                      src={review.avatar || `https://ui-avatars.com/api/?name=${review.name}&background=8B7355&color=fff`}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-gray-900">{review.name}</span>
                          {review.verified && (
                            <span className="ml-2 text-green-500 text-sm">✓ Geverifieerd</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-400">{review.date}</span>
                      </div>
                      
                      {/* Stars */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-5 h-5 flex items-center justify-center ${
                              i < review.rating ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${i < review.rating ? 'fill-white text-white' : 'fill-gray-400 text-gray-400'}`} />
                          </div>
                        ))}
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-bold text-[#5a4a3a] mb-2">{review.title}</h4>
                      <p className="text-gray-600">{review.text}</p>
                      
                      {/* Product Tag */}
                      <div className="mt-4">
                        <span className="inline-flex items-center gap-1 bg-[#f5efe8] text-[#8B7355] px-3 py-1 rounded-full text-sm font-medium">
                          Gekocht: {review.product_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReviewsPage;
