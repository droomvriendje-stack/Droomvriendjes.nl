import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { trackCheckoutStart, trackAddressFilled, trackPaymentSelected } from '../lib/funnel';
import { ShoppingCart, CreditCard, Lock, Check, Truck, Heart, ArrowLeft, Loader2, Plus, Minus, Trash2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { trackBeginCheckout, trackAddPaymentInfo, trackAddShippingInfo } from '../utils/analytics';
import { products } from '../mockData';
import { API_URL } from '../api/client';


const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getSubtotal, getDiscount, getTotal, updateQuantity, removeFromCart, clearCart, addToCart, appliedCoupon, setAppliedCoupon } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const trackingTimeoutRef = useRef(null);
  const hasTrackedRef = useRef(false);
  const [addedProducts, setAddedProducts] = useState({});
  const crossSellRef = useRef(null);
  const formRef = useRef(null);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    houseNumber: '',
    phone: '',
    giftWrap: false,
    paymentMethod: 'ideal'
  });

  const [addressLoading, setAddressLoading] = useState(false);
  const [addressFound, setAddressFound] = useState(null);
  const addressTimeoutRef = useRef(null);

  // Track checkout start when page loads
  useEffect(() => {
    if (cart.length > 0) {
      trackCheckoutStart(getSubtotal());
    }
  }, []);

  // Load saved email from cart sidebar
  useEffect(() => {
    const savedEmail = localStorage.getItem('droomvriendjes_checkout_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, []);

  // Track checkout session for abandoned cart recovery
  const trackCheckoutSession = async (email, name) => {
    if (!email || cart.length === 0) return;
    
    try {
      await fetch(`${API_URL}/api/email/track-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name || '',
          items: cart.map(item => ({
            product_id: String(item.id),
            name: item.shortName || item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          total: getTotal()
        })
      });
      hasTrackedRef.current = true;
    } catch (error) {
      console.error('Error tracking checkout session:', error);
    }
  };

  // Auto-fill address from postcode + huisnummer via PDOK
  const lookupAddress = useCallback(async (zipCode, houseNumber) => {
    const pc = zipCode.replace(/\s/g, '');
    if (pc.length < 4) return;
    
    setAddressLoading(true);
    setAddressFound(null);
    try {
      const params = new URLSearchParams({ postcode: pc });
      if (houseNumber) params.append('huisnummer', houseNumber);
      const res = await fetch(`${API_URL}/api/address/lookup?${params}`);
      if (!res.ok) {
        setAddressLoading(false);
        return;
      }
      const data = await res.json();
      if (data.found) {
        setFormData(prev => ({
          ...prev,
          address: data.straat + (houseNumber ? ` ${houseNumber}` : ''),
          city: data.stad,
        }));
        setAddressFound(true);
        trackAddressFilled(formData.email);
      } else {
        setAddressFound(false);
      }
    } catch {
      setAddressFound(false);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Track checkout session when email is entered (debounced)
    if (name === 'email' && value.includes('@') && value.includes('.')) {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
      trackingTimeoutRef.current = setTimeout(() => {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        trackCheckoutSession(value, fullName);
      }, 2000);
    }

    // Trigger address lookup when postcode or house number changes
    if (name === 'zipCode' || name === 'houseNumber') {
      if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
      const newZip = name === 'zipCode' ? value : formData.zipCode;
      const newHouse = name === 'houseNumber' ? value : formData.houseNumber;
      if (newZip.replace(/\s/g, '').length >= 4) {
        addressTimeoutRef.current = setTimeout(() => lookupAddress(newZip, newHouse), 400);
      }
    }
  };

  const handlePaymentMethodChange = (value) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
    trackPaymentSelected(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName || 
        !formData.address || !formData.zipCode || !formData.city) {
      setError('Vul alle verplichte velden in');
      return;
    }

    if (cart.length === 0) {
      setError('Je winkelwagen is leeg');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Track shipping info for GA4
      trackAddShippingInfo(cart, 'standard_shipping');
      
      // Notify backend of checkout start
      await fetch(`${API_URL}/api/checkout-started`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          items: cart
        })
      }).catch(() => {});
      
      // Create order
      // Calculate final total: (Subtotal - Auto Discount) - Manual Coupon = Total
      const subtotal = getSubtotal();
      const autoDiscount = getDiscount(); // 2nd item 50% off
      const couponDiscount = appliedCoupon ? appliedCoupon.discount_amount : 0;
      const giftWrapCost = formData.giftWrap ? GIFT_WRAP_PRICE : 0;
      const finalTotal = Math.max(0, subtotal - autoDiscount - couponDiscount + giftWrapCost);
      
      const orderResponse = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: formData.email,
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_phone: formData.phone || '',
          customer_address: formData.address,
          customer_city: formData.city,
          customer_zipcode: formData.zipCode,
          customer_comment: formData.giftWrap ? 'Cadeauverpakking gewenst' : '',
          gift_wrap: formData.giftWrap,
          items: cart.map(item => ({
            product_id: String(item.id),
            product_name: item.shortName || item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          subtotal: subtotal,
          discount: autoDiscount,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          coupon_discount: couponDiscount,
          total_amount: finalTotal
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Order kon niet worden aangemaakt');
      }

      const orderData = await orderResponse.json();

      // Create payment via backend (SECURE - no API key in frontend!)
      const paymentResponse = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderData.order_id,
          payment_method: formData.paymentMethod
        })
      });

      if (!paymentResponse.ok) {
        const errData = await paymentResponse.json();
        throw new Error(errData.detail || 'Betaling kon niet worden gestart');
      }

      const paymentData = await paymentResponse.json();

      if (paymentData.checkout_url) {
        clearCart();
        window.location.href = paymentData.checkout_url;
      } else {
        throw new Error('Geen checkout URL ontvangen');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Er is iets misgegaan. Probeer het opnieuw.');
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'ideal', label: 'iDEAL', icon: 'https://www.mollie.com/external/icons/payment-methods/ideal.svg', popular: true, description: 'Direct via je bank' },
    { value: 'creditcard', label: 'Creditcard', icon: 'https://www.mollie.com/external/icons/payment-methods/creditcard.svg', description: 'Visa, Mastercard, Amex' },
    { value: 'in3', label: 'iDEAL in3', icon: 'https://www.mollie.com/external/icons/payment-methods/in3.svg', description: 'Betaal in 3 termijnen' },
    { value: 'bancontact', label: 'Bancontact', icon: 'https://www.mollie.com/external/icons/payment-methods/bancontact.svg', description: 'Voor Belgie' },
    { value: 'paypal', label: 'PayPal', icon: 'https://www.mollie.com/external/icons/payment-methods/paypal.svg', description: 'Betaal met PayPal' },
  ];

  const expressMethods = [
    { value: 'applepay', label: 'Apple Pay', icon: 'https://www.mollie.com/external/icons/payment-methods/applepay.svg' },
  ];

  // Gift wrap price
  const GIFT_WRAP_PRICE = 3.00;

  // Get cross-sell products (exclude items already in cart)
  const cartProductIds = cart.map(item => item.id);
  const crossSellProducts = products
    .filter(p => !cartProductIds.includes(p.id) && p.id !== 6) // Exclude cart items and Duo set
    .slice(0, 5);

  // Handle quick add to cart
  const handleQuickAdd = (product) => {
    addToCart(product);
    setAddedProducts(prev => ({ ...prev, [product.id]: true }));
    
    // Reset the "added" state after 2 seconds
    setTimeout(() => {
      setAddedProducts(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Scroll cross-sell strip
  const scrollCrossSell = (direction) => {
    if (crossSellRef.current) {
      const scrollAmount = 200;
      crossSellRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Empty cart view
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-warm-brown-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Je winkelwagen is leeg</h2>
          <p className="text-slate-600 mb-6">Voeg eerst producten toe aan je winkelwagen.</p>
          <Link to="/">
            <button className="bg-warm-brown-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-warm-brown-600 transition flex items-center gap-2 mx-auto">
              <ArrowLeft className="w-5 h-5" />
              Terug naar shop
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-cream py-4 sm:py-6" style={{maxWidth: '100vw', overflowX: 'hidden'}}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{maxWidth: '100%'}}>
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block mb-4">
            <img 
              src="/logo.svg" 
              alt="Droomvriendjes" 
              className="h-20 md:h-24 w-auto mx-auto"
            />
          </Link>
          <p className="text-slate-600 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Veilig afrekenen
          </p>
        </div>

        {/* Back link */}
        <Link to="/" className="inline-flex items-center text-warm-brown-600 hover:text-warm-brown-700 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar shop
        </Link>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              
              {/* Express Checkout */}
              <div className="bg-white rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6" data-testid="express-checkout">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Snel Betalen</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  {/* Apple Pay */}
                  <button
                    type="button"
                    onClick={() => {
                      handlePaymentMethodChange('applepay');
                      if (formData.email && formData.firstName && formData.lastName && formData.address && formData.zipCode && formData.city) {
                        formRef.current?.requestSubmit();
                      } else {
                        setError('Vul eerst alle verplichte velden in voordat je Apple Pay gebruikt');
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 max-w-[280px] flex items-center justify-center gap-2 py-3.5 px-5 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-all min-h-[48px]"
                    data-testid="express-applepay"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 814 1000" fill="white">
                      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.4-155.5-127.4C34.5 764.6 0 618.3 0 479.1 0 306.9 100.5 214.9 199.7 214.9c66.5 0 121.7 43.6 163.3 43.6 39.5 0 101.1-46.2 176.6-46.2 28.5 0 130.9 2.6 198.3 99.2l.2.3-.1-.1 50.1 29.2z"/>
                      <path d="M554.1 0c-26.5 82.1-96.8 142.6-168.5 142.6-8.5 0-17-1.3-23.5-2.6 6.5-33.8 28.5-73.2 57.4-100.4C449.7 7.8 509.4-4.6 554.1 0z"/>
                    </svg>
                    <span className="text-sm font-semibold">Pay</span>
                  </button>

                  {/* Google Pay */}
                  <button
                    type="button"
                    onClick={() => {
                      handlePaymentMethodChange('googlepay');
                      if (formData.email && formData.firstName && formData.lastName && formData.address && formData.zipCode && formData.city) {
                        formRef.current?.requestSubmit();
                      } else {
                        setError('Vul eerst alle verplichte velden in voordat je Google Pay gebruikt');
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 max-w-[280px] flex items-center justify-center gap-2 py-3.5 px-5 bg-white border-2 border-slate-200 text-slate-800 rounded-xl font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[48px]"
                    data-testid="express-googlepay"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span className="text-sm font-semibold">Pay</span>
                  </button>

                  {/* PayPal */}
                  <button
                    type="button"
                    onClick={() => {
                      handlePaymentMethodChange('paypal');
                      if (formData.email && formData.firstName && formData.lastName && formData.address && formData.zipCode && formData.city) {
                        formRef.current?.requestSubmit();
                      } else {
                        setError('Vul eerst alle verplichte velden in voordat je PayPal gebruikt');
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 max-w-[280px] flex items-center justify-center py-3.5 px-5 bg-[#FFC439] rounded-xl hover:bg-[#f0b82e] transition-all min-h-[48px]"
                    data-testid="express-paypal"
                  >
                    <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-200px.png" alt="PayPal" className="h-6" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400 uppercase font-semibold whitespace-nowrap">of vul je gegevens in</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-warm-brown-500" />
                  Contactgegevens
                </h2>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder=" "
                    inputMode="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-email"
                  />
                  <label htmlFor="email" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                    E-mailadres *
                  </label>
                </div>
              </div>

              {/* Shipping Address with Auto-fill */}
              <div className="bg-white rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-warm-brown-500" />
                  Verzendadres
                </h2>

                {/* Postcode + Huisnummer - triggers auto-fill */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      name="zipCode"
                      id="zipCode"
                      placeholder=" "
                      inputMode="text"
                      autoComplete="postal-code"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                      data-testid="checkout-zipcode"
                    />
                    <label htmlFor="zipCode" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                      Postcode *
                    </label>
                    {addressLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-warm-brown-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="houseNumber"
                      id="houseNumber"
                      placeholder=" "
                      inputMode="numeric"
                      value={formData.houseNumber}
                      onChange={handleInputChange}
                      className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                      data-testid="checkout-housenumber"
                    />
                    <label htmlFor="houseNumber" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                      Huisnr.
                    </label>
                  </div>
                </div>

                {/* Address found feedback */}
                {addressFound === true && (
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-3 px-1 animate-fadeIn" data-testid="address-found">
                    <MapPin className="w-4 h-4" />
                    <span>{formData.address}, {formData.city}</span>
                  </div>
                )}
                {addressFound === false && formData.zipCode.replace(/\s/g, '').length >= 6 && (
                  <p className="text-amber-600 text-sm mb-3 px-1" data-testid="address-not-found">Adres niet gevonden, vul handmatig in</p>
                )}

                {/* Auto-filled or manual street + city */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      name="address"
                      id="address"
                      placeholder=" "
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                      data-testid="checkout-address"
                    />
                    <label htmlFor="address" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                      Straat + huisnummer *
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="city"
                      id="city"
                      placeholder=" "
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                      data-testid="checkout-city"
                    />
                    <label htmlFor="city" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                      Plaats *
                    </label>
                  </div>
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      placeholder=" "
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                      data-testid="checkout-firstname"
                    />
                    <label htmlFor="firstName" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                      Voornaam *
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      placeholder=" "
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                      data-testid="checkout-lastname"
                    />
                    <label htmlFor="lastName" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                      Achternaam *
                    </label>
                  </div>
                </div>

                {/* Phone */}
                <div className="relative mt-3">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    placeholder=" "
                    inputMode="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="peer w-full min-h-[48px] pt-5 pb-2 px-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-phone"
                  />
                  <label htmlFor="phone" className="absolute left-4 top-1 text-[11px] text-warm-brown-500 font-semibold peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal transition-all pointer-events-none">
                    Telefoonnummer (optioneel)
                  </label>
                </div>
              </div>

              {/* Gift Wrap Checkbox (replaces opmerkingen) */}
              <div className="bg-white rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6">
                <label 
                  className="flex items-center gap-4 cursor-pointer group"
                  data-testid="gift-wrap-option"
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    formData.giftWrap 
                      ? 'bg-warm-brown-500 border-warm-brown-500' 
                      : 'border-slate-300 group-hover:border-warm-brown-400'
                  }`}>
                    {formData.giftWrap && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.giftWrap}
                    onChange={(e) => setFormData(prev => ({ ...prev, giftWrap: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">Cadeauverpakking</span>
                    <span className="text-warm-brown-600 font-bold ml-2">(+ EUR 3,00)</span>
                    <p className="text-sm text-slate-500 mt-0.5">Mooi ingepakt met strik en kaartje</p>
                  </div>
                </label>
              </div>

              {/* Payment Methods - Compact Radio List */}
              <div className="bg-white rounded-2xl shadow-sm sm:shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-warm-brown-500" />
                  Betaalmethode
                </h2>
                <div className="space-y-2" data-testid="payment-methods-list">
                  {paymentMethods.map(method => (
                    <label 
                      key={method.value} 
                      className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.paymentMethod === method.value 
                          ? 'border-warm-brown-500 bg-warm-brown-50' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      data-testid={`payment-method-${method.value}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.paymentMethod === method.value 
                          ? 'border-warm-brown-500' 
                          : 'border-slate-300'
                      }`}>
                        {formData.paymentMethod === method.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-warm-brown-500" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={() => handlePaymentMethodChange(method.value)}
                        className="sr-only"
                      />
                      <img src={method.icon} alt={method.label} className="w-8 h-6 object-contain flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm sm:text-base">{method.label}</span>
                          {method.popular && (
                            <span className="bg-warm-brown-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Populair</span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-500">{method.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Payment Security Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600 bg-green-50 p-3 rounded-xl">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span>Veilige betaling via Mollie - SSL versleuteld</span>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 overflow-hidden">
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-warm-brown-500" />
                  Besteloverzicht
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b border-slate-100">
                      <img 
                        src={item.image} 
                        alt={item.shortName || item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-warm-brown-50"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">{item.shortName || item.name}</h3>
                        <p className="text-warm-brown-600 font-bold text-base sm:text-lg">€{item.price.toFixed(2).replace('.', ',')}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-base">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-red-500 hover:text-red-700 transition p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cross-sell Strip */}
                {crossSellProducts.length > 0 && (
                  <div className="mb-6 -mx-2 px-2">
                    <div className="bg-gradient-to-r from-warm-brown-50 to-amber-50 rounded-xl p-4 border border-warm-brown-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-warm-brown-700">
                            🎁 Voeg nog 1 knuffel toe voor 50% korting!
                          </p>
                          <p className="text-xs text-warm-brown-600">Meest gekozen samen met jouw bestelling</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={() => scrollCrossSell('left')}
                            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-warm-brown-50 transition"
                          >
                            <ChevronLeft className="w-4 h-4 text-warm-brown-600" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => scrollCrossSell('right')}
                            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-warm-brown-50 transition"
                          >
                            <ChevronRight className="w-4 h-4 text-warm-brown-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        ref={crossSellRef}
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mb-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {crossSellProducts.map(product => (
                          <div 
                            key={product.id}
                            className="flex-shrink-0 w-[140px] bg-white rounded-xl p-2 shadow-sm border border-warm-brown-100 hover:shadow-md transition group"
                          >
                            <div className="relative">
                              <img 
                                src={product.image} 
                                alt={product.shortName}
                                className="w-full h-20 object-contain rounded-lg bg-warm-brown-50 mb-2"
                              />
                              <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                -50%
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 truncate mb-1">
                              {product.shortName}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-warm-brown-600">
                                  €{(product.price * 0.5).toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-[10px] text-slate-400 line-through ml-1">
                                  €{product.price.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(product)}
                                disabled={addedProducts[product.id]}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  addedProducts[product.id]
                                    ? 'bg-green-500 text-white scale-110'
                                    : 'bg-warm-brown-500 text-white hover:bg-warm-brown-600 hover:scale-105'
                                }`}
                              >
                                {addedProducts[product.id] ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="space-y-2 text-sm sm:text-base mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotaal</span>
                    <span className="font-semibold">€{getSubtotal().toFixed(2).replace('.', ',')}</span>
                  </div>
                  {getDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Korting (2e 50%)</span>
                      <span className="font-semibold">-€{getDiscount().toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Kortingscode ({appliedCoupon.code})</span>
                      <span className="font-semibold">-€{appliedCoupon.discount_amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {formData.giftWrap && (
                    <div className="flex justify-between text-slate-700">
                      <span>Cadeauverpakking</span>
                      <span className="font-semibold">€{GIFT_WRAP_PRICE.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Verzending</span>
                    <span className="font-semibold text-green-600">GRATIS</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-xl sm:text-2xl font-bold mb-6 pt-4 border-t-2 border-warm-brown-100">
                  <span>Totaal</span>
                  <span className="text-warm-brown-600">€{(Math.max(0, getTotal() - (appliedCoupon ? appliedCoupon.discount_amount : 0) + (formData.giftWrap ? GIFT_WRAP_PRICE : 0))).toFixed(2).replace('.', ',')}</span>
                </div>

                {/* Submit Button - visible on desktop */}
                <button
                  type="submit"
                  id="checkout-form-submit"
                  disabled={isLoading}
                  className="hidden lg:flex w-full bg-warm-brown-500 text-white py-5 sm:py-6 rounded-xl font-bold text-lg sm:text-xl hover:bg-warm-brown-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
                  data-testid="checkout-submit-button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      <span>Verwerken...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Veilig betalen €{(Math.max(0, getTotal() - (appliedCoupon ? appliedCoupon.discount_amount : 0) + (formData.giftWrap ? GIFT_WRAP_PRICE : 0))).toFixed(2).replace('.', ',')}</span>
                    </>
                  )}
                </button>

                {/* Trust indicators */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-warm-brown-400" />
                    Met liefde gemaakt
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-warm-brown-500" />
                    1-2 werkdagen
                  </span>
                </div>

                {/* Terms */}
                <p className="text-center text-xs sm:text-sm text-slate-500 mt-4">
                  Door te bestellen ga je akkoord met onze{' '}
                  <Link to="/voorwaarden" className="text-warm-brown-600 underline hover:text-warm-brown-700">
                    algemene voorwaarden
                  </Link>
                </p>

                {/* Mobile-only "Betaal nu" button - visible in the gap before trust section */}
                <button
                  type="button"
                  onClick={() => formRef.current?.requestSubmit()}
                  disabled={isLoading}
                  className="lg:hidden w-full mt-5 py-4 bg-warm-brown-500 text-white rounded-xl font-bold text-lg hover:bg-warm-brown-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="mobile-betaal-nu-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verwerken...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Betaal nu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sticky bar moved outside - see below */}
        </form>

        {/* Bottom padding for sticky bar on mobile */}
        <div className="h-16 lg:hidden" />

        {/* Trust Section - Enhanced */}
        <div className="mt-8 lg:mt-12">
          {/* Main Trust Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Card 1 - Secure Payment */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-green-100 hover:shadow-xl transition-all group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2">100% Veilig Betalen</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  SSL versleutelde verbinding via Mollie. Je gegevens zijn altijd beschermd.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-green-700">Beveiligd door SSL</span>
                </div>
              </div>
            </div>

            {/* Card 2 - Fast Delivery */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-blue-100 hover:shadow-xl transition-all group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2">Snelle Levering</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  GRATIS verzending in heel Nederland. Morgen al bij jou thuis!
                </p>
                <div className="mt-3 inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-xs sm:text-sm font-bold text-blue-700">✓ Altijd gratis</span>
                </div>
              </div>
            </div>

            {/* Card 3 - Return Policy */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-amber-100 hover:shadow-xl transition-all group sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2">14 Dagen Retour</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Niet 100% tevreden? Geen probleem! Stuur het terug en krijg je geld terug.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full">
                  <span className="text-xs sm:text-sm font-bold text-amber-700">Geld-terug-garantie</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Trust Badges */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 items-center">
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">✓</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Klantenservice</p>
                <p className="text-xs text-slate-500">7 dagen per week</p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">★</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">4.8/5 Sterren</p>
                <p className="text-xs text-slate-500">1000+ reviews</p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">🇳🇱</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Nederlands Bedrijf</p>
                <p className="text-xs text-slate-500">Lokale service</p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">💚</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Eco Verpakking</p>
                <p className="text-xs text-slate-500">100% recyclebaar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Icons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <span className="text-sm text-slate-500">Betaal veilig met:</span>
          <img src="https://www.mollie.com/external/icons/payment-methods/ideal.svg" alt="iDEAL" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/creditcard.svg" alt="Creditcard" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/paypal.svg" alt="PayPal" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/applepay.svg" alt="Apple Pay" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/googlepay.svg" alt="Google Pay" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/bancontact.svg" alt="Bancontact" className="h-8" />
        </div>
      </div>
    </div>

      {/* Sticky Mobile Payment Bar - outside overflow container for proper fixed positioning */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-warm-brown-500" style={{zIndex: 9999, boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'}} data-testid="sticky-payment-bar">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => formRef.current?.requestSubmit()}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 text-white font-bold text-lg disabled:opacity-50"
          data-testid="sticky-payment-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verwerken...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Veilig betalen €{(Math.max(0, getTotal() - (appliedCoupon ? appliedCoupon.discount_amount : 0) + (formData.giftWrap ? GIFT_WRAP_PRICE : 0))).toFixed(2).replace('.', ',')}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default CheckoutPage;
