import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { API_URL } from '../api/client';
import { 
  ShoppingBag, 
  RefreshCw, 
  Plus, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Link as LinkIcon
} from 'lucide-react';


const ShoppingCampaignsPage = () => {
  const [status, setStatus] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: '',
    daily_budget: 10,
  });

  useEffect(() => {
    fetchStatus();
    fetchCampaigns();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/google-ads/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/google-ads/campaigns`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
    setLoading(false);
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/google-ads/campaigns/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        setShowCreateForm(false);
        setFormData({ campaign_name: '', daily_budget: 10 });
        fetchCampaigns();
      } else {
        alert(data.error || 'Er ging iets mis bij het aanmaken van de campagne');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Er ging iets mis bij het aanmaken van de campagne');
    }
    setCreating(false);
  };

  const startOAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/google-ads/oauth-url`);
      const data = await response.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error starting OAuth:', error);
    }
  };

  const getStatusBadge = (campaignStatus) => {
    switch (campaignStatus) {
      case 'ENABLED':
        return <Badge className="bg-green-100 text-green-800">Actief</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-100 text-yellow-800">Gepauzeerd</Badge>;
      case 'REMOVED':
        return <Badge className="bg-red-100 text-red-800">Verwijderd</Badge>;
      default:
        return <Badge variant="outline">{campaignStatus}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Campaigns</h1>
            </div>
            <p className="text-gray-600">Beheer je Google Shopping campagnes</p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">API Status</p>
                    <p className="text-lg font-bold text-gray-900">
                      {status?.configured ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Geconfigureerd
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Niet geconfigureerd
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">OAuth Status</p>
                    <p className="text-lg font-bold text-gray-900">
                      {status?.has_refresh_token ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Verbonden
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Niet verbonden
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Customer ID</p>
                    <p className="text-lg font-bold text-gray-900">{status?.customer_id || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Merchant Center</p>
                    <p className="text-lg font-bold text-gray-900">{status?.merchant_center_id || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OAuth Connect Section */}
          {status && !status.has_refresh_token && (
            <Card className="mb-8 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 mb-2">Google Ads Autorisatie Vereist</h3>
                    <p className="text-yellow-700 mb-4">
                      Om Shopping campagnes te kunnen beheren moet je eerst je Google Ads account koppelen.
                      Klik op de knop hieronder om te beginnen met de OAuth autorisatie.
                    </p>
                    <Button onClick={startOAuth} className="bg-yellow-600 hover:bg-yellow-700">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Verbind Google Ads Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <Button onClick={fetchCampaigns} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Vernieuwen
            </Button>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!status?.has_refresh_token}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Campagne
            </Button>
            <a 
              href="https://ads.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Google Ads
              </Button>
            </a>
          </div>

          {/* Create Campaign Form */}
          {showCreateForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Nieuwe Shopping Campagne</CardTitle>
                <CardDescription>
                  Maak een nieuwe Shopping campagne aan die gekoppeld wordt aan je Merchant Center feed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaign_name">Campagnenaam</Label>
                      <Input
                        id="campaign_name"
                        placeholder="Bijv. Shopping - Slaapknuffels NL"
                        value={formData.campaign_name}
                        onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="daily_budget">Dagbudget (€)</Label>
                      <Input
                        id="daily_budget"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.daily_budget}
                        onChange={(e) => setFormData({ ...formData, daily_budget: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button type="submit" disabled={creating} className="bg-purple-600 hover:bg-purple-700">
                      {creating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Aanmaken...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Campagne Aanmaken
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Annuleren
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Campaigns List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Shopping Campagnes ({campaigns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Geen campagnes gevonden</p>
                  <p className="text-sm">
                    {status?.has_refresh_token 
                      ? 'Maak je eerste Shopping campagne aan'
                      : 'Verbind eerst je Google Ads account om campagnes te kunnen bekijken'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id} 
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-500">ID: {campaign.id}</p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="font-medium">€{campaign.budget?.toFixed(2) || '0.00'}/dag</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-gray-500">Impressies</p>
                            <p className="font-medium">{campaign.impressions?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MousePointer className="w-4 h-4 text-purple-500" />
                          <div>
                            <p className="text-xs text-gray-500">Clicks</p>
                            <p className="font-medium">{campaign.clicks?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-xs text-gray-500">Conversies</p>
                            <p className="font-medium">{campaign.conversions?.toFixed(1) || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Hoe het werkt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Product Feed</h3>
                  <p className="text-sm text-gray-600">
                    Je producten worden automatisch gesynchroniseerd via de Merchant Center feed
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Shopping Campagne</h3>
                  <p className="text-sm text-gray-600">
                    Maak campagnes aan die je producten tonen in Google Shopping resultaten
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Automatische Ads</h3>
                  <p className="text-sm text-gray-600">
                    Google toont automatisch je producten aan relevante klanten
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ShoppingCampaignsPage;
