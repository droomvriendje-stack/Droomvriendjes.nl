import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { API_URL } from '../api/client';


const GoogleAdsCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Handle error from Google
      if (error) {
        setStatus('error');
        setMessage(error === 'access_denied' 
          ? 'Toegang geweigerd. U heeft de Google Ads verbinding geannuleerd.'
          : `Fout van Google: ${error}`
        );
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setMessage('Ontbrekende parameters in de callback URL.');
        return;
      }

      try {
        // Exchange code for tokens
        const response = await fetch(`${API_URL}/api/google-ads/oauth-callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            state,
            origin: window.location.origin
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus('success');
          setMessage(result.message || 'Google Ads account succesvol verbonden!');
        } else {
          setStatus('error');
          setMessage(result.detail || result.error || 'Er is een fout opgetreden bij het verbinden.');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('Kon geen verbinding maken met de server.');
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="border-2 border-warm-brown-100">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Google Ads Verbinding</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {status === 'processing' && (
              <>
                <Loader2 className="w-16 h-16 text-warm-brown-500 mx-auto animate-spin" />
                <p className="text-slate-600">Bezig met verbinden...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">Verbinding Succesvol!</h3>
                  <p className="text-slate-600">{message}</p>
                </div>
                <div className="space-y-3">
                  <Link to="/admin/campaigns">
                    <Button className="w-full bg-warm-brown-500 hover:bg-warm-brown-600">
                      Ga naar Campagnes
                    </Button>
                  </Link>
                  <Link to="/admin">
                    <Button variant="outline" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Terug naar Admin
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-700 mb-2">Verbinding Mislukt</h3>
                  <p className="text-slate-600">{message}</p>
                </div>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-warm-brown-500 hover:bg-warm-brown-600"
                    onClick={() => navigate('/admin')}
                  >
                    Probeer Opnieuw
                  </Button>
                  <a 
                    href="https://ads.google.com/aw/overview" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Google Ads
                    </Button>
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-warm-brown-50 rounded-xl border border-warm-brown-100">
          <h4 className="font-semibold text-slate-900 mb-2">Hulp nodig?</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Zorg dat je ingelogd bent met het juiste Google account</li>
            <li>• Controleer of je Google Ads account actief is</li>
            <li>• Geef toestemming voor alle gevraagde rechten</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default GoogleAdsCallbackPage;
