import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackAddToCart, trackRemoveFromCart, trackViewCart } from '../utils/analytics';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Lazy initialization from localStorage to prevent race condition
  // where save-effect overwrites localStorage with [] before load-effect runs
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('droomvriendjes_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const savedCoupon = localStorage.getItem('droomvriendjes_coupon');
      return savedCoupon ? JSON.parse(savedCoupon) : null;
    } catch {
      return null;
    }
  });

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('droomvriendjes_cart', JSON.stringify(cart));
  }, [cart]);

  // Save coupon to localStorage when it changes
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('droomvriendjes_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('droomvriendjes_coupon');
    }
  }, [appliedCoupon]);

  // Track view_cart when cart opens
  useEffect(() => {
    if (isCartOpen && cart.length > 0) {
      trackViewCart(cart);
    }
  }, [isCartOpen, cart]);

  const addToCart = (product) => {
    // GA4: Track add_to_cart
    trackAddToCart(product, 1);
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    // GA4: Track remove_from_cart
    const product = cart.find(item => item.id === productId);
    if (product) {
      trackRemoveFromCart(product, product.quantity);
    }
    
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    // Also clear coupon when cart is cleared (after successful purchase)
    setAppliedCoupon(null);
  };

  // Bereken subtotaal (zonder korting)
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Bereken korting: 2e knuffel 50% korting
  // Voor elke 2 items (ongeacht of het dezelfde of verschillende producten zijn)
  // krijg je 50% korting op het goedkoopste item van elk paar
  const getDiscount = () => {
    // Maak een array van alle individuele items met hun prijzen
    let allItems = [];
    cart.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        allItems.push(item.price);
      }
    });
    
    // Sorteer van hoog naar laag (duurste eerst)
    allItems.sort((a, b) => b - a);
    
    // Voor elk paar: volle prijs voor de eerste, 50% korting op de tweede
    let discount = 0;
    for (let i = 1; i < allItems.length; i += 2) {
      // Item op positie 1, 3, 5, etc. krijgt 50% korting (de goedkopere van elk paar)
      discount += allItems[i] * 0.5;
    }
    
    return discount;
  };

  // Totaal na korting
  const getTotal = () => {
    return getSubtotal() - getDiscount();
  };

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getSubtotal,
      getDiscount,
      getTotal,
      getItemCount,
      isCartOpen,
      setIsCartOpen,
      appliedCoupon,
      setAppliedCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};
