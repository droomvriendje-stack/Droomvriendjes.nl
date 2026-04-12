import React, { useState, useEffect } from 'react';
import { X, Gift, Tag } from 'lucide-react';
import { API_URL } from '../api/client';

/**
 * Welcome Popup Component
 * Shows discount code popup for new visitors
 */
const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const DISCOUNT_CODE = 'WELKOM10';
  const STORAGE_KEY = 'droomvriendjes_popup_shown';


  useEffect(() => {
    // Check if popup was already shown
    const popupShown = localStorage.getItem(STORAGE_KEY);
    
    if (!popupShown) {
      // Show popup after 5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) return;
    
    setIsSubmitting(true);

    try {
      // Subscribe to newsletter
      await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'welcome_popup' })
      });
    } catch (err) {
      console.error('Newsletter subscription error:', err);
    }

    setIsSubmitting(false);
    setShowSuccess(true);
    localStorage.setItem(STORAGE_KEY, 'true');

    // Track conversion
    if (window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'EUR',
        value: 10,
        source: 'welcome_popup'
      });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(DISCOUNT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6B5344] p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welkom bij Droomvriendjes! 🧸
          </h2>
          <p className="text-white/90">
            Ontvang direct 10% korting op je eerste bestelling
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showSuccess ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Je e-mailadres
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@voorbeeld.nl"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#8B7355] hover:bg-[#6B5344] text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Even geduld...' : 'Ontvang mijn korting'}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                Door je aan te melden ga je akkoord met onze{' '}
                <a href="/privacy" className="text-[#8B7355] underline">privacyverklaring</a>.
                Je kunt je altijd uitschrijven.
              </p>

              <button
                onClick={handleClose}
                className="w-full text-gray-500 text-sm mt-4 hover:text-gray-700"
              >
                Nee bedankt, ik wil geen korting
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Gelukt! 🎉
              </h3>
              <p className="text-gray-600 mb-4">
                Gebruik deze code bij het afrekenen:
              </p>
              
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between mb-4">
                <span className="font-mono font-bold text-2xl text-[#8B7355]">
                  {DISCOUNT_CODE}
                </span>
                <button
                  onClick={copyCode}
                  className="bg-[#8B7355] hover:bg-[#6B5344] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? 'Gekopieerd!' : 'Kopieer'}
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Code is ook naar je e-mail verzonden
              </p>

              <button
                onClick={handleClose}
                className="w-full bg-[#8B7355] hover:bg-[#6B5344] text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Start met shoppen
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WelcomePopup;
