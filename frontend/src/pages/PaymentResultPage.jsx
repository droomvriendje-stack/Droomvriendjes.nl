import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Moon, CheckCircle, XCircle, Clock, ArrowLeft, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { trackPurchase } from '../utils/analytics';
import { Helmet } from 'react-helmet-async';
import { API_URL } from '../api/client';


const PaymentResultPage = () => {
  const { orderId } = useParams();
  const [status, setStatus] = useState('checking');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const purchaseTracked = useRef(false);
  const surveyRendered = useRef(false);

  // Google Customer Reviews Survey
  useEffect(() => {
    if (status === 'paid' && orderData && !surveyRendered.current) {
      surveyRendered.current = true;
      
      // Calculate estimated delivery date (3-5 business days from now)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      const estimatedDelivery = deliveryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Load Google survey script
      window.renderOptIn = function() {
        if (window.gapi && window.gapi.surveyoptin) {
          window.gapi.load('surveyoptin', function() {
            window.gapi.surveyoptin.render({
              "merchant_id": 5711881654,
              "order_id": orderId,
              "email": orderData.customer_email || '',
              "delivery_country": "NL",
              "estimated_delivery_date": estimatedDelivery
            });
          });
        }
      };
      
      // Check if script already loaded
      if (window.gapi && window.gapi.surveyoptin) {
        window.renderOptIn();
      }
    }
  }, [status, orderData, orderId]);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrderData(data);
        setStatus(data.status);
        
        // GA4: Track purchase when payment is successful (only once)
        if (data.status === 'paid' && !purchaseTracked.current) {
          purchaseTracked.current = true;
          trackPurchase({
            order_id: orderId,
            total_amount: data.total_amount,
            items: data.items || []
          });
        }
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    // Initial check after short delay (webhook processing)
    const timeout = setTimeout(checkPaymentStatus, 1500);

    // Poll for status updates
    const interval = setInterval(checkPaymentStatus, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [orderId]);

  // Stop polling once we have a final status
  useEffect(() => {
    if (['paid', 'failed', 'cancelled', 'expired'].includes(status)) {
      // Status is final, no need to poll anymore
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Google Customer Reviews Script */}
      {status === 'paid' && (
        <Helmet>
          <script 
            src="https://apis.google.com/js/platform.js?onload=renderOptIn" 
            async 
            defer
          />
        </Helmet>
      )}
      
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_plush-revamp/artifacts/npuc23bl_lgoo%20ads%20%281%29.png" 
              alt="Droomvriendjes" 
              className="h-16 md:h-20 w-auto"
            />
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Checking Status */}
        {status === 'checking' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling wordt gecontroleerd...</h1>
              <p className="text-gray-600">Even geduld alsjeblieft.</p>
            </CardContent>
          </Card>
        )}

        {/* Payment Successful */}
        {status === 'paid' && (
          <Card className="border-green-200">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bedankt voor je bestelling!</h1>
              <p className="text-gray-600 mb-8">Je betaling is succesvol ontvangen.</p>

              {orderData && (
                <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
                  <h2 className="font-semibold text-lg mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Bestelgegevens
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bestelnummer:</span>
                      <span className="font-mono">{orderId.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">E-mail:</span>
                      <span>{orderData.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Betaalmethode:</span>
                      <span className="capitalize">{orderData.payment_method}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-2 border-t mt-2">
                      <span>Totaal betaald:</span>
                      <span>€{orderData.total_amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800">
                  📧 Je ontvangt een bevestigingsmail op <strong>{orderData?.customer_email}</strong>
                </p>
              </div>

              <Link to="/">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug naar shop
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Payment Pending */}
        {(status === 'pending' || status === 'open') && (
          <Card className="border-yellow-200">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling in behandeling</h1>
              <p className="text-gray-600 mb-8">
                Je betaling wordt nog verwerkt. Dit kan enkele minuten duren.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Je ontvangt een e-mail zodra de betaling is bevestigd.
              </p>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug naar shop
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Payment Failed */}
        {(status === 'failed' || status === 'cancelled' || status === 'expired') && (
          <Card className="border-red-200">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {status === 'cancelled' ? 'Betaling geannuleerd' : 
                 status === 'expired' ? 'Betaling verlopen' : 'Betaling mislukt'}
              </h1>
              <p className="text-gray-600 mb-8">
                {status === 'cancelled' 
                  ? 'Je hebt de betaling geannuleerd.' 
                  : status === 'expired'
                  ? 'De betalingssessie is verlopen.'
                  : 'Er is iets misgegaan met je betaling.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/checkout">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Opnieuw proberen
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Terug naar shop
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {status === 'error' && (
          <Card className="border-red-200">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Er is iets misgegaan</h1>
              <p className="text-gray-600 mb-8">{error || 'Kon de betalingsstatus niet ophalen.'}</p>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug naar shop
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
