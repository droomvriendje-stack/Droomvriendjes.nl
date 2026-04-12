import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { benefits, features, videos, faqs } from '../mockData';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Star, ShoppingCart, Moon, Heart, Sparkles, Monitor, ShieldCheck, Truck, Award, Play, X, Plus, Minus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import CartSidebar from '../components/CartSidebar';
import Header from '../components/Header';
import SchemaMarkup from '../components/SchemaMarkup';
import { API_URL } from '../api/client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { trackViewItemList, trackSelectItem } from '../utils/analytics';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// SEO Keywords for Droomvriendjes
const SEO_KEYWORDS = [
  'slaapknuffel met sterrenprojectie',
  'slaapknuffel white noise kinderen',
  'knuffel die helpt met slapen',
  'slaapknuffel nachtlampje kind',
  'slaapknuffel cadeau baby shower',
  'slaapknuffel volwassenen',
  'kind bang in het donker knuffel'
].join(', ');


const HomePage = () => {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, updateQuantity, getTotal, getItemCount, isCartOpen, setIsCartOpen } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const [reviews, setReviews] = useState([]);
  const [fiveStarReviews, setFiveStarReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, avgRating: 4.9 });

  // Filter out of stock products from homepage
  const availableProducts = products.filter(p => p.inStock !== false);

  // Shuffle array helper function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch reviews from database
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
          
          // Filter and shuffle 5-star reviews
          const fiveStars = data.filter(r => r.rating === 5);
          setFiveStarReviews(shuffleArray(fiveStars));
          
          if (data.length > 0) {
            const avg = (data.reduce((acc, r) => acc + r.rating, 0) / data.length).toFixed(1);
            setReviewStats({ total: data.length, avgRating: avg });
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    fetchReviews();
  }, []);

  // GA4: Track view_item_list when page loads
  useEffect(() => {
    trackViewItemList(availableProducts, 'homepage_products', 'Homepage Producten');
  }, []);

  // GA4: Track product click
  const handleProductClick = (product, index) => {
    trackSelectItem(product, index, 'homepage_products', 'Homepage Producten');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Droomvriendjes | Slaapknuffel met Nachtlampje & Sterrenprojectie | White Noise Knuffel</title>
        <meta name="description" content="De beste slaapknuffel voor kinderen met nachtlampje, sterrenprojectie en white noise. Helpt je kind rustig slapen. Perfect als kraamcadeau of babyshower gift. Ook voor volwassenen en kinderen die bang zijn in het donker." />
        <meta name="keywords" content={SEO_KEYWORDS} />
        <meta property="og:title" content="Droomvriendjes | Slaapknuffel met Nachtlampje & Sterrenprojectie" />
        <meta property="og:description" content="De beste slaapknuffel voor kinderen met nachtlampje, sterrenprojectie en white noise. Helpt je kind rustig slapen." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://droomvriendjes.nl" />
        <link rel="canonical" href="https://droomvriendjes.nl" />
      </Helmet>

      {/* Header */}
      <Header />

      {/* Shopping Cart Sidebar */}
      <CartSidebar />
      
      {/* Schema Markup for AI SEO 2026 */}
      <SchemaMarkup pageType="home" />
      
      {/* Promo Banner - Warm Brown */}
      <div className="bg-warm-brown-500 text-white py-3 text-center">
        <p className="text-sm md:text-base font-medium tracking-wide">
          WINTER SALE: 2E KNUFFEL 50% KORTING ❄️
        </p>
      </div>

      {/* Hero Section - Warm Brown Theme */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Layout - Image on top */}
          <div className="md:hidden">
            {/* Mobile Image */}
            <div className="relative w-full h-[300px] overflow-hidden">
              <img 
                src="https://i.imgur.com/Mj57dGY.png" 
                alt="Kind met Droomvriendje knuffel"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
            </div>
            
            {/* Mobile Content */}
            <div className="px-4 pb-8 -mt-8 relative z-10">
              <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight text-center">
                Meer dan een knuffel,
              </h1>
              <p className="text-lg font-bold text-warm-brown-500 mb-4 leading-tight text-center">
                De beste vriend van je kind in het donker.
              </p>
              
              {/* Mobile Social Proof */}
              <div className="bg-white/90 rounded-xl p-3 mb-4 shadow-sm">
                <p className="text-xs text-gray-500 text-center mb-1">Vertrouwd door 500+ ouders</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex -space-x-1">
                    <img src="https://i.pravatar.cc/24?img=1" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                    <img src="https://i.pravatar.cc/24?img=5" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                    <img src="https://i.pravatar.cc/24?img=8" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">4.9/5</span>
                  </div>
                  <span className="text-xs text-gray-500">(500+ reviews)</span>
                </div>
              </div>
              
              {/* Mobile Features */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <span className="text-warm-brown-500 text-lg">✓</span>
                  <p className="text-slate-700 font-medium text-xs mt-1">Gratis verzending</p>
                </div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <span className="text-warm-brown-500 text-lg">✓</span>
                  <p className="text-slate-700 font-medium text-xs mt-1">14 dagen retour</p>
                </div>
                <div className="text-center bg-white/60 rounded-lg p-2">
                  <span className="text-warm-brown-500 text-lg">✓</span>
                  <p className="text-slate-700 font-medium text-xs mt-1">CE-gecertificeerd</p>
                </div>
              </div>
              
              {/* Mobile CTA */}
              <Button 
                size="lg" 
                className="w-full bg-warm-brown-500 hover:bg-warm-brown-600 text-white py-6 text-lg rounded-xl shadow-lg shadow-warm-brown-200 font-bold"
                data-testid="hero-cta-mobile"
              >
                <a href="#producten">Bekijk Onze Knuffels</a>
              </Button>
              <p className="text-center text-sm text-gray-600 mt-2">Voor 23:00 besteld = morgen in huis</p>
            </div>
          </div>

          {/* Desktop Layout - Side by side */}
          <div className="hidden md:flex items-center min-h-[600px] lg:min-h-[650px] px-6 lg:px-8">
            {/* Left Content */}
            <div className="w-1/2 pr-8 lg:pr-16">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-3 bg-white border-[1.5px] border-[#e8d5c4] rounded-xl px-5 py-3 mb-4">
                <div className="text-[#c8833a] text-lg tracking-widest">★★★★★</div>
                <div>
                  <div className="font-bold text-[15px] text-[#2d1f14]">Vertrouwd door 500+ ouders</div>
                  <div className="text-xs text-[#9c7b65]">Gemiddeld 4,9 / 5 sterren</div>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 mb-4 leading-tight">
                Meer dan een knuffel, <br />
                <span className="text-warm-brown-500">De beste vriend van je kind in het donker.</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 mb-6 leading-relaxed max-w-lg">
                Help je kindje sneller in slaap vallen met onze zachte knuffels voorzien van rustgevende geluiden en sfeerlicht.
              </p>
              
              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2">
                  <div className="flex -space-x-1">
                    <img src="https://i.pravatar.cc/24?img=1" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                    <img src="https://i.pravatar.cc/24?img=5" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                    <img src="https://i.pravatar.cc/24?img=8" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">4.9/5</span>
                  <span className="text-gray-500 text-sm">(500+ reviews)</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Button 
                  size="lg" 
                  className="bg-warm-brown-500 hover:bg-warm-brown-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-warm-brown-200 hover:shadow-xl transition-all font-bold transform hover:-translate-y-1"
                  data-testid="hero-cta-desktop"
                >
                  <a href="#producten" className="flex items-center gap-2">
                    Bekijk Onze Knuffels
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-slate-200 text-slate-700 hover:border-warm-brown-500 px-6 py-6 text-lg rounded-xl"
                >
                  <a href="#voordelen">Hoe het werkt</a>
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-warm-brown-500" />
                  Gratis verzending
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-warm-brown-500" />
                  14 dagen retour
                </span>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="w-1/2 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://i.imgur.com/Mj57dGY.png" 
                  alt="Kind met Droomvriendje knuffel"
                  className="w-full h-[500px] lg:h-[550px] object-cover object-center"
                />
              </div>
              
              {/* Floating badge - Delivery */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-slate-100">
                <div className="bg-green-100 text-green-600 p-2 rounded-full">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Direct Leverbaar</p>
                  <p className="text-xs text-slate-500">Bestel voor 23:00, morgen in huis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust Features - Soft Blue Background */}
      <section className="py-8 bg-soft-blue border-y border-warm-brown-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <Truck className="w-6 h-6 text-warm-brown-500" />
              <p className="font-semibold text-sm">Gratis Verzending</p>
              <p className="text-xs text-slate-500">Vanaf €59,95</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck className="w-6 h-6 text-warm-brown-500" />
              <p className="font-semibold text-sm">14 Dagen Bedenktijd</p>
              <p className="text-xs text-slate-500">Niet tevreden? Geld terug</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Heart className="w-6 h-6 text-warm-brown-500" />
              <p className="font-semibold text-sm">10.000+ Klanten</p>
              <p className="text-xs text-slate-500">Blije ouders en kinderen</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Award className="w-6 h-6 text-warm-brown-500" />
              <p className="font-semibold text-sm">CE Gecertificeerd</p>
              <p className="text-xs text-slate-500">Veilig voor alle leeftijden</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Warm Brown Theme */}
      <section id="voordelen" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-warm-brown-600 font-bold uppercase tracking-widest text-sm">Onze Favorieten</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
              Waarom Droomvriendjes?
            </h2>
            <div className="w-24 h-1 bg-warm-brown-500 mx-auto rounded-full mt-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 border-warm-brown-100 hover:border-warm-brown-300 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Moon className="w-8 h-8 text-warm-brown-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Verbeterde Nachtrust</h3>
                <p className="text-slate-600">86% van de kinderen valt sneller in slaap en slaapt beter door</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-warm-brown-100 hover:border-warm-brown-300 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-warm-brown-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Minder Stress & Angst</h3>
                <p className="text-slate-600">Helpt kinderen ontspannen en zich veilig te voelen</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-warm-brown-100 hover:border-warm-brown-300 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-warm-brown-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Rustgevend & Kalmerend</h3>
                <p className="text-slate-600">Zachte lichten en muziek voor optimale ontspanning</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-warm-brown-100 hover:border-warm-brown-300 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-warm-brown-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Minder Schermtijd</h3>
                <p className="text-slate-600">Een gezond schermvrij alternatief voor het slapengaan</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Section - Warm Brown Theme */}
      <section id="producten" className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-warm-brown-600 font-bold uppercase tracking-widest text-sm">
              Onze Collectie
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
              Meest Verkochte Knuffels
            </h2>
            <div className="w-24 h-1 bg-warm-brown-500 mx-auto rounded-full"></div>
          </div>
          
          {/* Product Slider */}
          <div className="relative px-4 md:px-12">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              navigation={{
                prevEl: '.swiper-button-prev-custom',
                nextEl: '.swiper-button-next-custom',
              }}
              pagination={{ 
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={true}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              className="product-slider !pb-14"
              data-testid="product-slider"
            >
              {availableProducts.map((product, index) => (
                <SwiperSlide key={product.id}>
                  <div className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-slate-100">
                    {/* Product Image with Badge */}
                    <div className="relative overflow-hidden aspect-square">
                      {/* Badge - Top Left */}
                      {product.badge && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="bg-warm-brown-700 text-white text-xs font-bold px-3 py-1 rounded-lg">
                            {product.badge}
                          </span>
                        </div>
                      )}
                      
                      {/* Product Image */}
                      <Link to={`/product/${product.id}`} onClick={() => { handleProductClick(product, index); window.scrollTo(0, 0); }}>
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          data-testid={`product-image-${product.id}`}
                        />
                      </Link>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-8 flex flex-col flex-grow space-y-4">
                      <Link to={`/product/${product.id}`} onClick={() => window.scrollTo(0, 0)}>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-warm-brown-600 transition-colors cursor-pointer">
                            {product.shortName || product.name}
                          </h3>
                          <div className="text-right">
                            <p className="text-2xl font-black text-warm-brown-600">€{product.price.toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                      </Link>
                      
                      {/* Rating */}
                      <div className="flex items-center text-amber-400 text-sm gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-300 text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-slate-500 font-medium">({product.reviews} reviews)</span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-slate-600 text-sm line-clamp-2 flex-1">
                        {product.description}
                      </p>
                      
                      {/* Add to Cart Button */}
                      <div className="pt-4 mt-auto">
                        <Button 
                          className="w-full py-4 bg-warm-brown-500 text-white font-bold rounded-xl hover:bg-warm-brown-600 transition flex items-center justify-center gap-2"
                          onClick={() => addToCart(product)}
                          data-testid={`add-to-cart-slider-${product.id}`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          In Winkelwagen
                        </Button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Custom Navigation Buttons */}
            <button 
              className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-warm-brown-50 hover:shadow-xl transition-all border border-warm-brown-100"
              aria-label="Vorige"
              data-testid="slider-prev-button"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-warm-brown-500" />
            </button>
            <button 
              className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-warm-brown-50 hover:shadow-xl transition-all border border-warm-brown-100"
              aria-label="Volgende"
              data-testid="slider-next-button"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-warm-brown-500" />
            </button>
          </div>
          
          {/* View All Products Link */}
          <div className="text-center mt-10">
            <Link to="/knuffels">
              <Button variant="outline" className="border-2 border-warm-brown-500 text-warm-brown-600 hover:bg-warm-brown-50 px-8 py-6 text-lg font-semibold rounded-xl">
                Bekijk Alle Knuffels
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers Section - Warm Brown Theme */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <span className="text-warm-brown-600 font-bold uppercase tracking-widest text-sm">Vers van de Pers</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Nieuwe Collectie</h2>
            </div>
            <Link to="/knuffels" className="text-warm-brown-600 font-bold hover:underline flex items-center gap-2">
              Bekijk Alles <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mini Product Cards */}
            {availableProducts.slice(0, 4).map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="group" onClick={() => window.scrollTo(0, 0)}>
                <div className="relative rounded-2xl overflow-hidden aspect-square mb-4">
                  <span className="absolute top-3 left-3 bg-warm-brown-500 text-white px-2 py-1 rounded-md text-[10px] font-bold z-10 uppercase">
                    {product.badge || 'Nieuw'}
                  </span>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-warm-brown-600 transition">{product.shortName || product.name}</h4>
                <p className="text-warm-brown-600 font-black">€{product.price.toFixed(2).replace('.', ',')}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section - Warm Brown Theme */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-slate-900 mb-12">
            Zie Droomvriendjes In Actie
          </h2>
          <div className="flex flex-col items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full">
              <div className="aspect-[9/16] bg-gray-900">
                <video
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  autoPlay
                  muted
                  loop
                >
                  <source src="/droomvriendjes_video.mp4" type="video/mp4" />
                  Je browser ondersteunt geen video.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Star Reviews Carousel Section */}
      {fiveStarReviews.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-white to-[#fdf8f3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                Topbeoordelingen
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                Wat Onze Klanten Zeggen
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Ontdek waarom duizenden ouders kiezen voor Droomvriendjes
              </p>
            </div>

            {/* Reviews Swiper Carousel */}
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="pb-12"
            >
              {fiveStarReviews.slice(0, 12).map((review, index) => (
                <SwiperSlide key={review.id}>
                  <div 
                    className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 h-full flex flex-col"
                    data-testid={`five-star-review-${index}`}
                  >
                    {/* 5 Stars */}
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    
                    {/* Review Title */}
                    <h3 className="font-bold text-slate-900 text-lg mb-3 leading-tight">
                      &ldquo;{review.title}&rdquo;
                    </h3>
                    
                    {/* Review Text */}
                    <p className="text-slate-600 text-sm leading-relaxed flex-grow mb-6">
                      {review.text}
                    </p>
                    
                    {/* Reviewer Info */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                      <img 
                        src={review.avatar || `https://ui-avatars.com/api/?name=${review.name}&background=8B7355&color=fff`}
                        alt={review.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{review.name}</p>
                        <p className="text-xs text-[#8B7355]">Gekocht: {review.product_name}</p>
                      </div>
                      {review.verified && (
                        <span className="text-green-500 text-xs font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Geverifieerd
                        </span>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* CTA */}
            <div className="text-center mt-8">
              <Link to="/droomvriendjes-reviews">
                <Button 
                  className="bg-[#8B7355] hover:bg-[#6d5a45] text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  data-testid="view-all-five-star-reviews-btn"
                >
                  Bekijk Alle {reviewStats.total} Reviews →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section - Warm Brown Theme */}
      {reviews.length > 0 && (
        <section className="py-20 bg-warm-brown-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <span className="text-warm-brown-600 font-bold uppercase tracking-widest text-sm">Klantbeoordelingen</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
                Vertrouwd door {reviewStats.total > 100 ? `${Math.floor(reviewStats.total / 100) * 100}+` : reviewStats.total} tevreden klanten
              </h2>
              
              {/* Trustpilot Badge */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="bg-white rounded-xl px-6 py-4 shadow-md border border-slate-100 flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-2xl font-bold text-slate-900">{reviewStats.avgRating}</span>
                      <span className="text-slate-500">/5</span>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-[#00b67a] text-[#00b67a]" />
                      ))}
                    </div>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <p className="text-sm font-semibold text-slate-900">Uitstekend</p>
                    <p className="text-xs text-slate-500">Gebaseerd op {reviewStats.total} reviews</p>
                  </div>
                  <img 
                    src="https://cdn.trustpilot.net/brand-assets/4.1.0/logo-black.svg" 
                    alt="Trustpilot" 
                    className="h-6 ml-2"
                  />
                </div>
              </div>
            </div>
            
            {/* Testimonial Cards - Show top 3 reviews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((review, index) => (
                <div 
                  key={review.id} 
                  className="bg-white rounded-[32px] p-6 sm:p-10 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300"
                  data-testid={`testimonial-card-${index}`}
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-6 h-6 flex items-center justify-center ${i < review.rating ? 'bg-amber-400' : 'bg-gray-200'}`}>
                        <Star className={`w-4 h-4 ${i < review.rating ? 'fill-white text-white' : 'fill-gray-400 text-gray-400'}`} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Review Title */}
                  <h3 className="font-black text-slate-900 text-xl mb-3 leading-tight">
                    &ldquo;{review.title}&rdquo;
                  </h3>
                  
                  {/* Review Text */}
                  <p className="text-slate-600 mb-4 leading-relaxed font-medium">
                    {review.text}
                  </p>
                  
                  {/* Reviewer Info */}
                  <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                    <img 
                      src={review.avatar || `https://ui-avatars.com/api/?name=${review.name}&background=8B7355&color=fff`}
                      alt={review.name}
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{review.name}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="text-green-500">✓</span>
                        <span>Geverifieerde aankoop</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* CTA Button */}
            <div className="text-center mt-10">
              <Link to="/reviews">
                <Button 
                  variant="outline" 
                  className="border-2 border-warm-brown-500 text-warm-brown-600 hover:bg-warm-brown-50 px-8 py-6 text-lg font-semibold rounded-xl"
                  data-testid="view-all-reviews-btn"
                >
                  Bekijk alle {reviewStats.total} reviews
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section - Warm Brown Theme */}
      {reviews.length > 3 && (
        <section id="reviews" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-12">
              <span className="text-warm-brown-600 font-bold uppercase tracking-widest text-sm">
                Klantbeoordelingen
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
                Echte Reviews van Echte Ouders
              </h2>
              <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">{reviewStats.avgRating}/5</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{reviewStats.total} geverifieerde reviews</span>
              </div>
            </div>
            
            {/* Reviews Grid - Show reviews 4-9 (after first 3 testimonials) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(3, 9).map((review, index) => (
                <div 
                  key={review.id} 
                  className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-10 hover:shadow-md transition-all duration-300"
                  data-testid={`review-card-${index}`}
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start gap-4 mb-4">
                    <img 
                      src={review.avatar || `https://ui-avatars.com/api/?name=${review.name}&background=8B7355&color=fff`}
                      alt={review.name}
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{review.name}</span>
                        {review.verified && (
                          <span className="text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tight">
                            <Check className="w-3 h-3" /> Geverifieerd
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Content */}
                  <h4 className="font-black text-slate-900 mb-2 text-xl leading-tight">&ldquo;{review.title}&rdquo;</h4>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed font-medium">{review.text}</p>
                  
                  {/* Product Tag */}
                  <div className="pt-6 border-t border-slate-50">
                    <span className="inline-flex items-center gap-1 bg-warm-brown-50 text-warm-brown-600 px-3 py-1 rounded-full text-xs font-bold">
                      Gekocht: {review.product_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More */}
            <div className="text-center mt-12">
              <Link to="/reviews">
                <Button 
                  className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-800 font-black rounded-2xl hover:border-warm-brown-500 hover:text-warm-brown-600 transition-all flex items-center gap-3 mx-auto shadow-sm"
                  data-testid="load-more-reviews-btn"
                >
                  Laad meer reviews <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section - Warm Brown Theme */}
      <section id="faq" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-warm-brown-600 font-bold uppercase tracking-widest text-sm">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
              Veelgestelde Vragen
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className="bg-warm-brown-50 border-2 border-warm-brown-100 rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-900 hover:text-warm-brown-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section - Warm Brown Theme */}
      <section className="bg-warm-brown-500 text-white py-16 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
            Klaar Voor Betere Nachten?
          </h2>
          <p className="text-lg md:text-xl text-warm-brown-100 max-w-2xl mx-auto leading-relaxed">
            Sluit je aan bij 10.000+ tevreden ouders. Profiteer nu van onze winteractie: 2e knuffel 50% korting!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-10 py-5 bg-white text-warm-brown-600 rounded-2xl font-black text-lg md:text-xl shadow-2xl hover:bg-warm-brown-50 transition transform hover:-translate-y-1"
            >
              <a href="#producten">Bestel Nu Met Korting</a>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-warm-brown-100">
            <span><Check className="w-4 h-4 inline mr-2" /> Gratis verzending</span>
            <span><Check className="w-4 h-4 inline mr-2" /> 14 dagen retour</span>
            <span><Check className="w-4 h-4 inline mr-2" /> Veilig betalen</span>
          </div>
        </div>
      </section>

      {/* Footer - Warm Brown Theme */}
      <footer className="bg-warm-brown-900 text-warm-brown-100 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-warm-brown-800">
            {/* Bedrijfsgegevens */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Droomvriendjes</h3>
              <p className="text-sm leading-relaxed opacity-70">Wij helpen kinderen en ouders aan een betere nachtrust door middel van innovatieve slaapknuffels.</p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-warm-brown-800 rounded-full flex items-center justify-center hover:bg-warm-brown-500 transition">
                  <span className="text-lg">📷</span>
                </a>
                <a href="#" className="w-10 h-10 bg-warm-brown-800 rounded-full flex items-center justify-center hover:bg-warm-brown-500 transition">
                  <span className="text-lg">📘</span>
                </a>
                <a href="#" className="w-10 h-10 bg-warm-brown-800 rounded-full flex items-center justify-center hover:bg-warm-brown-500 transition">
                  <span className="text-lg">🎵</span>
                </a>
              </div>
            </div>

            {/* Navigatie */}
            <div>
              <h4 className="text-white font-bold mb-6">Producten</h4>
              <ul className="space-y-3 text-sm opacity-70">
                <li><Link to="/knuffels" className="hover:text-warm-brown-400 transition">Alle Knuffels</Link></li>
                <li><Link to="/knuffels" className="hover:text-warm-brown-400 transition">Voordeelbundels</Link></li>
                <li><Link to="/cadeaubon" className="hover:text-warm-brown-400 transition">Cadeaubonnen</Link></li>
                <li><Link to="/knuffels" className="hover:text-warm-brown-400 transition">Nieuw Binnen</Link></li>
              </ul>
            </div>

            {/* Klantenservice */}
            <div>
              <h4 className="text-white font-bold mb-6">Klantenservice</h4>
              <ul className="space-y-3 text-sm opacity-70">
                <li><a href="#faq" className="hover:text-warm-brown-400 transition">Veelgestelde Vragen</a></li>
                <li><Link to="/retourneren" className="hover:text-warm-brown-400 transition">Verzending & Levertijd</Link></li>
                <li><Link to="/retourneren" className="hover:text-warm-brown-400 transition">Retouren</Link></li>
                <li><Link to="/contact" className="hover:text-warm-brown-400 transition">Contact</Link></li>
              </ul>
            </div>

            {/* Betaalmethoden */}
            <div>
              <h4 className="text-white font-bold mb-6">Betaalmethoden</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 h-8 rounded flex items-center justify-center px-2 text-[10px] font-bold">iDEAL</div>
                <div className="bg-white/10 h-8 rounded flex items-center justify-center px-2 text-[10px] font-bold">PAYPAL</div>
                <div className="bg-white/10 h-8 rounded flex items-center justify-center px-2 text-[10px] font-bold">VISA</div>
                <div className="bg-white/10 h-8 rounded flex items-center justify-center px-2 text-[10px] font-bold">MC</div>
                <div className="bg-white/10 h-8 rounded flex items-center justify-center px-2 text-[10px] font-bold">APPLE</div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest gap-4">
            <p>© 2024 Droomvriendjes. Alle rechten voorbehouden.</p>
            <div className="flex space-x-6">
              <Link to="/voorwaarden" className="hover:text-white transition">Voorwaarden</Link>
              <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link to="/contact" className="hover:text-white transition">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
