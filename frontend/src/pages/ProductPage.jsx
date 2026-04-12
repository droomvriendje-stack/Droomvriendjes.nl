import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { faqs } from '../mockData';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Input } from '../components/ui/input';
import { Star, ShoppingCart, Check, Sparkles, Shield, ChevronLeft, ChevronRight, Send, User, MessageSquare, Camera } from 'lucide-react';
import Layout from '../components/Layout';
import StickyAddToCart from '../components/StickyAddToCart';
import { trackViewItem } from '../utils/analytics';
import { trackProductView, trackAddToCart } from '../lib/funnel';
import { API_URL } from '../api/client';


const ProductPage = () => {
  const { id } = useParams();
  const { addToCart, setIsCartOpen, isCartOpen } = useCart();
  const { products } = useProducts();
  const [selectedImage, setSelectedImage] = useState(0);
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    text: '',
    photo_url: null
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Carousel state for "Andere Knuffels"
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  const product = useMemo(() => {
    // Support both UUID strings and numeric IDs
    return products.find(p => String(p.id) === String(id));
  }, [id, products]);

  // Determine product series for dynamic specs
  const productSeries = useMemo(() => {
    if (!product) return 'basic';
    
    // AI Intelligent Serie (USB-C Oplaadbaar): FM666-61, FM666-62, FM666-67
    const aiSerieSkus = ['FM666-61', 'FM666-62', 'FM666-67'];
    if (aiSerieSkus.includes(product.sku)) {
      return 'ai';
    }
    
    // Nodding Off Serie (Batterijen): FM666-77, FM666-78, FM666-80, FM666-81, FM666-82, FM666-74
    const noddingOffSkus = ['FM666-77', 'FM666-78', 'FM666-80', 'FM666-81', 'FM666-82', 'FM666-74'];
    if (noddingOffSkus.includes(product.sku)) {
      return 'nodding';
    }
    
    // Also check by description/features for products without matching SKU
    const desc = (product.description || '').toLowerCase();
    const features = (product.features || []).join(' ').toLowerCase();
    
    if (desc.includes('usb-c') || features.includes('usb-c')) {
      return 'ai';
    }
    if (desc.includes('60 melodieën') || desc.includes('60 slaapliedjes') || 
        features.includes('60 slaapliedjes') || features.includes('nodding off')) {
      return 'nodding';
    }
    
    return 'basic';
  }, [product]);

  // Dynamic specifications - use database specs if available, otherwise fallback to hardcoded
  const productSpecs = useMemo(() => {
    // First check if product has specs from database
    if (product?.specs && Object.keys(product.specs).length > 0) {
      const dbSpecs = product.specs;
      return {
        projection: dbSpecs.projection || '',
        audio: dbSpecs.audio || '',
        power: dbSpecs.power || '',
        timer: dbSpecs.timer || '',
        tipText: dbSpecs.tipText || ''
      };
    }
    
    // Fallback to hardcoded specs based on product series
    if (productSeries === 'ai') {
      return {
        projection: '3-in-1 (Sterren, Oceaan, Lamp)',
        audio: '10 Slaapliedjes + 5 White Noise',
        power: 'USB-C Oplaadbaar (Kabel incl.)',
        timer: '30 minuten Auto-uit',
        tipText: 'Oplaadbare batterijen zijn niet nodig, omdat deze Droomvriend volledig oplaadbaar is via USB-C. De module heeft een ingebouwde timer van 30 minuten voor optimaal energieverbruik.'
      };
    }
    if (productSeries === 'nodding') {
      return {
        projection: '7 Lichtmodi + 3 Kappen (Sterren, Oceaan, Lamp)',
        audio: '60 Slaapliedjes + 6 White Noise',
        power: '3x AA Batterijen (Niet inbegrepen)',
        timer: '30 minuten Auto-uit',
        tipText: 'De Nodding Off functie creëert een kalmerende knikkende beweging die je baby helpt ontspannen. De batterijen gaan lang mee dankzij de auto-uit timer van 30 minuten.'
      };
    }
    // Basic serie
    return {
      projection: 'Sterrenhemel & Oceaan Projectie',
      audio: '10 Rustgevende Melodieën',
      power: '3x AA Batterijen (Niet inbegrepen)',
      timer: '30 minuten Auto-uit',
      tipText: 'De batterijen gaan lang mee dankzij de auto-uit timer van 30 minuten. Ideaal voor een rustige nacht zonder zorgen over energieverbruik.'
    };
  }, [product, productSeries]);

  // Quick features from database or fallback
  const quickFeatures = useMemo(() => {
    if (product?.quickFeatures && product.quickFeatures.length > 0) {
      return product.quickFeatures;
    }
    // Fallback based on product series
    if (productSeries === 'ai') {
      return [
        { icon: '🤖', label: 'AI Huilsensor' },
        { icon: '🔌', label: 'USB-C Oplaadbaar' },
        { icon: '🎵', label: '10 Melodieën + 5 White Noise' },
        { icon: '✩', label: '3-in-1 Projectie' }
      ];
    }
    if (productSeries === 'nodding') {
      return [
        { icon: '😴', label: 'Nodding Off Functie' },
        { icon: '🔆', label: '7 Lichtmodi' },
        { icon: '🎵', label: '60 Slaapliedjes' },
        { icon: '⏰', label: 'Automatische timer' }
      ];
    }
    return [
      { icon: '⭐', label: 'Sterrenprojectie' },
      { icon: '🎵', label: '10 Melodieën' },
      { icon: '🔇', label: 'White Noise' },
      { icon: '⏰', label: 'Auto-uit Timer' }
    ];
  }, [product, productSeries]);

  // Create gallery array - main image + unique gallery images (no duplicates)
  // Support both string URLs and objects with {url, alt}
  const galleryImages = useMemo(() => {
    if (!product) return [];
    
    const processImage = (img) => {
      if (typeof img === 'string') {
        return { url: img, alt: product.name };
      }
      return { url: img.url || img, alt: img.alt || product.name };
    };
    
    const images = [processImage(product.image)];
    if (product.gallery && product.gallery.length > 0) {
      // Filter out duplicates - only add images that aren't already in the array
      product.gallery.forEach(img => {
        const processed = processImage(img);
        if (!images.find(i => i.url === processed.url)) {
          images.push(processed);
        }
      });
    }
    return images;
  }, [product]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImage(0); // Reset to first image when product changes
    // Reset review form when product changes
    setShowReviewForm(false);
    setReviewSubmitted(false);
    setReviewError('');
    setPhotoPreview(null);
    setReviewForm({ name: '', email: '', rating: 5, title: '', text: '', photo_url: null });
  }, [id]);

  // Photo upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setReviewError('Alleen JPEG, PNG, WebP en GIF zijn toegestaan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setReviewError('Bestand is te groot (max 5MB)');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingPhoto(true);
    setReviewError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/reviews/upload-photo`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setReviewForm(prev => ({ ...prev, photo_url: result.photo_url }));
      } else {
        setReviewError(result.detail || 'Fout bij uploaden van foto');
        setPhotoPreview(null);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setReviewError('Netwerkfout bij uploaden van foto');
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setReviewForm(prev => ({ ...prev, photo_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch reviews from database by product_id
  const fetchReviews = async () => {
    if (!product) return;
    setLoadingReviews(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/product/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setProductReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoadingReviews(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [product]);

  useEffect(() => {
    if (product) {
      trackViewItem(product);
      trackProductView(product.id, product.name);
    }
  }, [product]);

  // Submit review handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);

    try {
      const response = await fetch(`${API_URL}/api/reviews/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.shortName,
          name: reviewForm.name,
          email: reviewForm.email,
          rating: reviewForm.rating,
          title: reviewForm.title,
          text: reviewForm.text,
          photo_url: reviewForm.photo_url
        })
      });

      const result = await response.json();

      if (response.ok) {
        setReviewSubmitted(true);
        setShowReviewForm(false);
        setReviewForm({ name: '', email: '', rating: 5, title: '', text: '' });
        // Refresh reviews to show the new one
        fetchReviews();
      } else {
        setReviewError(result.detail || 'Er ging iets mis. Probeer het opnieuw.');
      }
    } catch (error) {
      setReviewError('Er ging iets mis. Probeer het opnieuw.');
    }

    setSubmittingReview(false);
  };

  const handleAddToCart = () => {
    addToCart(product);
    trackAddToCart(product.id, product.name, product.price);
    setIsCartOpen(true);
  };

  const handleDirectOrder = () => {
    addToCart(product);
    trackAddToCart(product.id, product.name, product.price);
    setIsCartOpen(true);
  };

  // Carousel handlers
  const relatedProducts = product ? products.filter(p => p.id !== product.id) : [];
  const itemsPerView = 3;
  const maxIndex = Math.max(0, relatedProducts.length - itemsPerView);

  const handleCarouselPrev = () => {
    setCarouselIndex(prev => Math.max(0, prev - 1));
  };

  const handleCarouselNext = () => {
    setCarouselIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Drag handlers for mobile
  const handleMouseDown = (e) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  if (!product) {
    return (
      <Layout backButtonText="Terug">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl">Product laden...</p>
        </div>
      </Layout>
    );
  }

  // Schema.org Product structured data for Google Merchant Center compliance
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image,
    "sku": `DV-${product.id.toString().padStart(4, '0')}`,
    "mpn": `DV-${product.id.toString().padStart(4, '0')}`,
    "brand": {
      "@type": "Brand",
      "name": "Droomvriendjes"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://droomvriendjes.nl/product/${product.id}`,
      "priceCurrency": "EUR",
      "price": product.price.toFixed(2),
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Droomvriendjes",
        "url": "https://droomvriendjes.nl"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "EUR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": ["NL", "BE"]
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": ["NL", "BE"],
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || "4.9",
      "reviewCount": product.reviews || "50",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <Layout backButtonText="Terug" showPromoBanner={false} bgClassName="bg-gradient-to-b from-[#fdf8f3] to-[#f5efe8]">
      {/* Schema.org Product Data for Google Merchant */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Product Detail */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Product Image Gallery - Sticky */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* Main Image */}
              <div className="relative bg-[#faf7f4] rounded-3xl p-8 mb-4 shadow-sm">
                <img 
                  src={galleryImages[selectedImage]?.url || galleryImages[selectedImage]} 
                  alt={galleryImages[selectedImage]?.alt || product.name}
                  className="w-full h-auto object-contain max-h-[500px]"
                />
                
                {/* Navigation Arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev === 0 ? galleryImages.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                      aria-label="Vorige foto"
                    >
                      <ChevronLeft className="w-6 h-6 text-[#8B7355]" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev === galleryImages.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                      aria-label="Volgende foto"
                    >
                      <ChevronRight className="w-6 h-6 text-[#8B7355]" />
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Gallery - Show only unique images */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {galleryImages.map((img, idx) => {
                    const imgUrl = img?.url || img;
                    const imgAlt = img?.alt || `${product.name} foto ${idx + 1}`;
                    return (
                      <button
                        key={`thumb-${idx}-${imgUrl.slice(-10)}`}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedImage === idx 
                            ? 'border-[#8B7355] ring-2 ring-[#8B7355]/30 scale-105' 
                            : 'border-gray-200 hover:border-[#8B7355]/50 hover:scale-102'
                        }`}
                      >
                        <img 
                          src={imgUrl} 
                          alt={imgAlt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-6">
                {/* Urgency Badge */}
                {product.badge && (
                  <div className="inline-flex items-center bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    🔥 {product.badge}
                  </div>
                )}
                
                <h1 className="text-4xl md:text-5xl font-bold text-[#5a4a3a] mb-2">
                  {product.name}
                </h1>
                
                {/* Subtitle/Tagline */}
                <p className="text-lg text-[#8B7355] italic mb-4">
                  {product.shortName === 'Lotgenootje Konijn' && 'Projecteert sterren + speelt hartslaggeluid voor een geruststellende nachtrust'}
                  {product.shortName === 'Lotgenootje Beer' && 'De perfecte slaapmaatje met rustgevende hartslag en ademhaling'}
                  {product.shortName === 'Lotgenootje Olifant' && 'Grote knuffel met grote troost - kalmerende geluiden voor diepe slaap'}
                  {!['Lotgenootje Konijn', 'Lotgenootje Beer', 'Lotgenootje Olifant'].includes(product.shortName) && 'Helpt je kindje sneller en rustiger inslapen'}
                </p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {product.rating}/5.0 ({product.reviews} reviews)
                  </span>
                </div>
                
                {/* Social Proof Bar */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-green-800 font-medium flex items-center gap-1">
                    <span className="text-green-600">✓</span> 86% van ouders zegt: kind slaapt beter
                  </span>
                  <span className="text-sm text-green-800 font-medium flex items-center gap-1">
                    <span className="text-green-600">✓</span> 10.000+ tevreden klanten
                  </span>
                </div>
                
                {/* Emotional Description */}
                <div className="bg-[#faf7f4] rounded-xl p-4 mb-6 border border-[#e8e0d8]">
                  <p className="text-gray-700 leading-relaxed">
                    <span className="text-2xl">🧸</span> Dit lieve {product.shortName} helpt jouw kindje makkelijker in slaap vallen. 
                    Met rustgevende geluiden en een zacht nachtlampje voelt je kleintje zich geborgen en droomt sneller weg – 
                    terwijl jij ook eindelijk je rust krijgt.
                  </p>
                </div>
              </div>

              {/* Price Section - CRO Optimized */}
              <div className="bg-gradient-to-r from-[#f5efe8] to-[#fdf8f3] rounded-2xl p-6 mb-6 border border-[#e8e0d8]">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-4xl md:text-5xl font-bold text-[#5a4a3a]">€{product.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-gray-500 text-sm ml-2 line-through">€{(product.price * 1.3).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm animate-pulse">
                    🎁 2e knuffel 50% korting!
                  </div>
                </div>
                <p className="text-green-700 font-medium mt-2 text-sm">
                  ✓ Gratis verzending · ✓ Morgen in huis · ✓ 14 dagen retour
                </p>
              </div>

              {/* Key Features - Quick Scan - Dynamic from database or fallback */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {quickFeatures.map((qf, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white border border-[#e8e0d8] rounded-xl p-3">
                    <span className="text-xl">{qf.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{qf.label}</span>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#5a4a3a] mb-4">Voordelen:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-[#5a4a3a] mb-4">Eigenschappen:</h3>
                  <div className="space-y-2">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Sparkles className="w-5 h-5 text-[#8B7355] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Buttons - CRO Optimized */}
              <div className="space-y-3 mb-6">
                {product.inStock === false ? (
                  <>
                    {/* Out of Stock Message */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                      <p className="text-red-600 font-bold text-lg">❌ Dit product is momenteel uitverkocht</p>
                      <p className="text-red-500 text-sm mt-1">Neem contact op voor beschikbaarheid</p>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full bg-gray-400 text-white text-lg py-6 cursor-not-allowed"
                      disabled
                      data-testid="add-to-cart-button"
                    >
                      Uitverkocht
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-7 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold"
                      onClick={handleAddToCart}
                      data-testid="add-to-cart-button"
                    >
                      <ShoppingCart className="w-6 h-6 mr-2" />
                      Bestel Nu - €{product.price.toFixed(2).replace('.', ',')}
                    </Button>
                    <p className="text-center text-sm text-gray-600">
                      🚚 Voor 23:00 besteld = morgen in huis
                    </p>
                    
                    {/* Stock Urgency */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                      <p className="text-orange-700 text-sm font-medium">
                        ⚡ Nog maar {Math.floor(Math.random() * 8) + 3} op voorraad - bestel snel!
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Trust Badges - Enhanced */}
              <div className="bg-white rounded-xl border-2 border-[#e8e0d8] p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">14 dagen<br />proefslapen</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check className="w-6 h-6 text-warm-brown-600" />
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">Gratis<br />verzending</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Star className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">CE<br />gecertificeerd</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl">🇳🇱</span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">Nederlandse<br />klantenservice</p>
                  </div>
                </div>
              </div>
              
              {/* Guarantee Banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 mb-6 text-white text-center">
                <p className="font-bold text-lg">💯 100% Tevredenheidsgarantie</p>
                <p className="text-sm opacity-90">Niet tevreden? Geld terug, geen vragen!</p>
              </div>

              {/* Product Details */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#e8e0d8]">
                <h3 className="font-bold text-[#5a4a3a] mb-3">Product Details:</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Leeftijd:</strong> {product.ageRange}</p>
                  <p><strong>Garantie:</strong> {product.warranty}</p>
                  <p><strong>Certificering:</strong> CE-gecertificeerd</p>
                  <p><strong>Materiaal:</strong> Zacht pluche, hoogwaardig en veilig</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPANDED SECTIONS - Warm Brown Branding */}
      <div className="mt-16 space-y-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section 1: AI & Psychology */}
        <section className="text-center max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <span className="text-warm-brown-500 font-black uppercase tracking-[0.3em] text-xs">
              Voor Ouders & Baby
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight italic">
              Waarom ouders kiezen voor de {product.shortName}
            </h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              Wetenschappelijk bewezen geluiden en kleuren die bijdragen aan een betere nachtrust voor zowel kind als ouder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {productSeries === 'ai' ? (
              <>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">AI Huilsensor</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    De sensor herkent babygehuil en activeert direct om je kindje te troosten. Zo vallen ze vaak weer zelf in slaap.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">3-in-1 Projectie</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Kies uit sterren, oceaan of nachtlampje. De zachte projectie stimuleert melatonine aanmaak voor betere slaap.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-4-4h-2v-2h2v2zm0-4h-2V7h2v4z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">USB-C Oplaadbaar</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Geen gedoe met batterijen. De USB-C kabel is inbegrepen en de module is binnen enkele uren opgeladen.
                  </p>
                </div>
              </>
            ) : productSeries === 'nodding' ? (
              <>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">60 Melodieën</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Met 60 slaapliedjes en 6 white noise opties vind je altijd het perfecte geluid om je kindje rustig te laten inslapen.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">7 Lichtmodi</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Van zachte nachtverlichting tot sfeervol licht. 7 verschillende standen plus 3 projectiekappen (sterren, oceaan, lamp).
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">Nodding Off Beweging</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    De unieke knikkende beweging kalmeert je baby en helpt bij het ontspannen. Wetenschappelijk bewezen effectief.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">Zachte Projectie</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    De sterrenhemel projectie stimuleert de melatonine aanmaak, wat de natuurlijke slaapcyclus van je baby ondersteunt.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">Rustgevende Melodieën</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Kalmerende slaapliedjes en white noise geluiden helpen je kindje sneller en dieper in slaap te vallen.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto text-warm-brown-500">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-black italic">Geborgen Gevoel</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    De combinatie van zacht licht en kalmerende geluiden creëert een veilige omgeving voor je kindje.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Material & Washable */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-[3rem] overflow-hidden shadow-sm border border-warm-brown-100 p-4 lg:p-0">
          <div className="h-full min-h-[400px]">
            <img 
              src={
                product.macroImage || 
                (galleryImages[4]?.url || galleryImages[4]) || 
                (galleryImages[1]?.url || galleryImages[1]) || 
                (product.image?.url || product.image)
              }
              alt={
                product.macroImage ? `${product.name} materiaal detail` :
                galleryImages[4]?.alt || 
                galleryImages[1]?.alt || 
                `${product.name} materiaal detail`
              }
              className="w-full h-full object-cover rounded-[2.5rem] lg:rounded-none"
            />
          </div>
          <div className="p-8 lg:p-16 space-y-6">
            <h3 className="text-2xl md:text-3xl font-black italic leading-tight text-slate-800">
              Alleen de zachtste materialen voor jouw baby
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed text-lg italic">
              &ldquo;Onze {product.shortName} is gemaakt van premium, hypoallergeen pluche. Zo zacht dat je kindje hem nooit meer wil loslaten.&rdquo;
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-warm-brown-50 flex items-center justify-center text-warm-brown-500 shadow-sm shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">100% Kindveilig (CE-gecertificeerd)</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-warm-brown-50 flex items-center justify-center text-warm-brown-500 shadow-sm shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">Wasbaar (Electronicabox is eenvoudig uitneembaar)</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Technical Specs - Dynamic based on product series */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <h2 className="text-3xl md:text-4xl font-black italic text-slate-800">Technische Specificaties</h2>
            <div className="space-y-0">
              <div className="flex justify-between py-5 border-b border-warm-brown-100 group">
                <span className="font-black text-slate-400 uppercase tracking-widest text-[11px] group-hover:text-warm-brown-600 transition">
                  Projectie / Licht
                </span>
                <span className="font-bold text-slate-800 italic">{productSpecs.projection}</span>
              </div>
              <div className="flex justify-between py-5 border-b border-warm-brown-100 group">
                <span className="font-black text-slate-400 uppercase tracking-widest text-[11px] group-hover:text-warm-brown-600 transition">
                  Audio Content
                </span>
                <span className="font-bold text-slate-800 italic">{productSpecs.audio}</span>
              </div>
              <div className="flex justify-between py-5 border-b border-warm-brown-100 group">
                <span className="font-black text-slate-400 uppercase tracking-widest text-[11px] group-hover:text-warm-brown-600 transition">
                  Voeding
                </span>
                <span className="font-bold text-slate-800 italic">{productSpecs.power}</span>
              </div>
              <div className="flex justify-between py-5 border-b border-warm-brown-100 group">
                <span className="font-black text-slate-400 uppercase tracking-widest text-[11px] group-hover:text-warm-brown-600 transition">
                  Timer
                </span>
                <span className="font-bold text-slate-800 italic">{productSpecs.timer}</span>
              </div>
            </div>
            <div className="p-5 bg-warm-brown-50 rounded-2xl border border-warm-brown-100 italic">
              <p className="text-xs text-warm-brown-800 font-bold leading-relaxed">
                <span className="uppercase mr-2 font-black">Tip:</span> 
                {productSpecs.tipText}
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <img 
              src={
                product.dimensionsImage ||
                (galleryImages[3]?.url || galleryImages[3]) || 
                (galleryImages[2]?.url || galleryImages[2]) || 
                (product.image?.url || product.image)
              }
              alt={
                product.dimensionsImage ? `${product.name} afmetingen` :
                galleryImages[3]?.alt || 
                galleryImages[2]?.alt || 
                `${product.name} afmetingen`
              }
              className="w-full h-auto rounded-[3rem] shadow-2xl bg-white p-6 border border-warm-brown-50"
            />
          </div>
        </section>
      </div>

      {/* Product Reviews - Enhanced Design */}
      <section className="py-16 bg-gradient-to-b from-[#fdf8f3] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ⭐ Klantbeoordelingen
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#5a4a3a] mb-4">
              Wat Klanten Zeggen Over {product.shortName}
            </h2>
            {productReviews.length > 0 && (
              <div className="flex items-center justify-center gap-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-gray-900">{product.rating}/5</span>
                <span className="text-gray-500">({product.reviews} reviews)</span>
              </div>
            )}
          </div>
          
          {productReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productReviews.map((review, index) => (
                <div 
                  key={review.id} 
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                  data-testid={`product-review-${index}`}
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#8B7355] text-white font-bold text-lg"
                      data-testid={`review-avatar-${index}`}
                    >
                      {(review.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{review.name}</span>
                        {review.verified && (
                          <span className="text-green-500 text-sm flex items-center gap-1">
                            <span>✓</span> Geverifieerd
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Trustpilot-style Stars */}
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-4 h-4 flex items-center justify-center ${
                                i < review.rating ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${i < review.rating ? 'fill-white text-white' : 'fill-gray-400 text-gray-400'}`} />
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-400">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Content */}
                  <h4 className="font-bold text-[#5a4a3a] mb-2">{review.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <p className="text-gray-500 text-lg">Nog geen reviews beschikbaar voor dit product.</p>
              <p className="text-gray-400 mt-2">Wees de eerste om een review te schrijven!</p>
            </div>
          )}
          
          {/* View All Reviews CTA */}
          {productReviews.length > 0 && (
            <div className="text-center mt-10">
              <Link to="/reviews">
                <Button 
                  className="bg-[#8B7355] hover:bg-[#6d5a45] text-white px-8 py-6 text-lg font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
                  data-testid="view-all-product-reviews-btn"
                >
                  Bekijk Alle Reviews →
                </Button>
              </Link>
            </div>
          )}

          {/* Write Review Section */}
          <div className="mt-16 max-w-2xl mx-auto">
            {reviewSubmitted ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Bedankt voor je review!</h3>
                <p className="text-green-700">Je review is succesvol ingediend en wordt binnenkort weergegeven.</p>
              </div>
            ) : !showReviewForm ? (
              <div className="bg-[#fdf8f3] rounded-2xl p-8 text-center border-2 border-[#e8e0d8]">
                <MessageSquare className="w-12 h-12 text-[#8B7355] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#5a4a3a] mb-2">Deel je ervaring</h3>
                <p className="text-gray-600 mb-6">Heb je dit product gekocht? Laat anderen weten wat je ervan vindt!</p>
                <Button 
                  onClick={() => setShowReviewForm(true)}
                  className="bg-[#8B7355] hover:bg-[#6d5a45] text-white px-8 py-3 rounded-full"
                  data-testid="write-review-btn"
                >
                  Schrijf een Review
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border-2 border-[#e8e0d8] shadow-lg">
                <h3 className="text-xl font-bold text-[#5a4a3a] mb-6 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-[#8B7355]" />
                  Schrijf een Review voor {product.shortName}
                </h3>

                {reviewError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                    {reviewError}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jouw Beoordeling *
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="p-1 transition-transform hover:scale-110"
                          data-testid={`rating-star-${star}`}
                        >
                          <Star 
                            className={`w-8 h-8 ${
                              star <= reviewForm.rating 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'fill-gray-200 text-gray-200'
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-gray-600 self-center">
                        {reviewForm.rating} van 5 sterren
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Je Naam *
                    </label>
                    <Input
                      type="text"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                      placeholder="Bijv. Jan Jansen"
                      required
                      className="w-full"
                      data-testid="review-name-input"
                    />
                  </div>

                  {/* Email (optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      E-mail <span className="text-gray-400 font-normal">(optioneel, wordt niet getoond)</span>
                    </label>
                    <Input
                      type="email"
                      value={reviewForm.email}
                      onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                      placeholder="jan@voorbeeld.nl"
                      className="w-full"
                      data-testid="review-email-input"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Titel van je Review *
                    </label>
                    <Input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      placeholder="Bijv. Geweldig product!"
                      required
                      className="w-full"
                      data-testid="review-title-input"
                    />
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Je Review *
                    </label>
                    <textarea
                      value={reviewForm.text}
                      onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                      placeholder="Vertel anderen over je ervaring met dit product..."
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] resize-none"
                      data-testid="review-text-input"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Foto toevoegen (optioneel)
                    </label>
                    <div className="space-y-3">
                      {/* Photo Preview */}
                      {photoPreview && (
                        <div className="relative inline-block">
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      {!photoPreview && (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#8B7355] hover:bg-[#8B7355]/5 transition-colors"
                        >
                          {uploadingPhoto ? (
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              Uploaden...
                            </div>
                          ) : (
                            <>
                              <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">Klik om een foto te uploaden</p>
                              <p className="text-xs text-gray-400 mt-1">Max 5MB • JPG, PNG, WebP of GIF</p>
                            </>
                          )}
                        </div>
                      )}
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 border-gray-300"
                    >
                      Annuleren
                    </Button>
                    <Button
                      type="submit"
                      disabled={submittingReview}
                      className="flex-1 bg-[#8B7355] hover:bg-[#6d5a45] text-white"
                      data-testid="submit-review-btn"
                    >
                      {submittingReview ? (
                        'Verzenden...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Review Plaatsen
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gradient-to-b from-white to-[#fdf8f3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#5a4a3a] mb-12">
            Veelgestelde Vragen
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className="bg-white border-2 border-[#e8e0d8] rounded-xl px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-[#5a4a3a] hover:text-[#8B7355]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Related Products Carousel - All Products */}
      <section className="py-16 bg-gradient-to-b from-[#fdf8f3] to-[#f5efe8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#5a4a3a] mb-8 text-center">
            Andere Knuffels
          </h2>
          
          {/* Carousel Container */}
          <div className="relative">
            {/* Previous Button */}
            <button
              onClick={handleCarouselPrev}
              disabled={carouselIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hidden lg:flex items-center justify-center"
              aria-label="Vorige producten"
            >
              <ChevronLeft className="w-6 h-6 text-[#8B7355]" />
            </button>

            {/* Carousel Track */}
            <div 
              ref={carouselRef}
              className="overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <div 
                className="flex gap-6 transition-transform duration-500 ease-out"
                style={{ 
                  transform: `translateX(-${carouselIndex * (100 / itemsPerView + 2)}%)`,
                }}
              >
                {relatedProducts.map((relatedProduct) => (
                  <div 
                    key={relatedProduct.id}
                    className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-all border border-[#e8e0d8] bg-white flex flex-col h-full">
                      <div className="relative bg-[#faf7f4] p-6 aspect-square">
                        {relatedProduct.badge && (
                          <Badge className="absolute top-4 left-4 bg-[#2d2d2d] text-white z-10">
                            {relatedProduct.badge}
                          </Badge>
                        )}
                        <img 
                          src={relatedProduct.image} 
                          alt={relatedProduct.name}
                          className="w-full h-full object-contain"
                          style={{ aspectRatio: '1/1' }}
                        />
                      </div>
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-[#3d3d3d] mb-2">{relatedProduct.shortName}</h3>
                        
                        {/* Description with line-clamp */}
                        <div className="min-h-[4.5rem] mb-4 flex-grow">
                          <p className="text-gray-600 text-sm line-clamp-3">{relatedProduct.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-[#8B7355]">€{relatedProduct.price.toFixed(2).replace('.', ',')}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold">{relatedProduct.rating}</span>
                          </div>
                        </div>
                        
                        {/* Button always at bottom with mt-auto */}
                        <div className="mt-auto">
                          <Link to={`/product/${relatedProduct.id}`} onClick={() => window.scrollTo(0, 0)}>
                            <Button className="w-full bg-[#8B7355] hover:bg-[#6d5a45] text-white" data-testid={`view-product-${relatedProduct.id}`}>
                              Bekijk Product
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleCarouselNext}
              disabled={carouselIndex >= maxIndex}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hidden lg:flex items-center justify-center"
              aria-label="Volgende producten"
            >
              <ChevronRight className="w-6 h-6 text-[#8B7355]" />
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCarouselIndex(index)}
                className={`transition-all rounded-full ${
                  index === carouselIndex 
                    ? 'w-8 h-2 bg-[#8B7355]' 
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ga naar slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Mobile scroll hint */}
          <p className="text-center text-sm text-gray-500 mt-4 lg:hidden">
            ← Swipe om meer producten te zien →
          </p>
        </div>
      </section>

      {/* Sticky Add to Cart */}
      <StickyAddToCart 
        product={product} 
        onAddToCart={handleAddToCart}
        isCartOpen={isCartOpen}
      />
    </Layout>
  );
};

export default ProductPage;
