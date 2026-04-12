import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { shoppingCampaigns, campaignMetrics, allSeoKeywords } from '../data/shoppingCampaigns';
import { useToast } from '../hooks/use-toast';
import { API_URL } from '../api/client';
import { 
  Search, TrendingUp, DollarSign, Eye, MousePointer, ShoppingCart,
  Zap, Target, Megaphone, ArrowLeft, Copy, Check,
  BarChart3, Upload, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';


const CampaignManagementPage = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Performance Max': return <Zap className="w-4 h-4" />;
      case 'Standard Shopping': return <ShoppingCart className="w-4 h-4" />;
      case 'Demand Gen': return <Megaphone className="w-4 h-4" />;
      case 'Search': return <Search className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Performance Max': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Standard Shopping': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Demand Gen': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Search': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredCampaigns = shoppingCampaigns.filter(c => {
    const matchesFilter = filter === 'all' || c.type === filter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const campaignTypes = ['all', 'Performance Max', 'Standard Shopping', 'Demand Gen', 'Search'];

  const copyKeywords = () => {
    navigator.clipboard.writeText(allSeoKeywords.join('\n'));
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  const totalDailyBudget = shoppingCampaigns.reduce((sum, c) => sum + c.dailyBudget, 0);

  const toggleCampaignSelection = (id) => {
    setSelectedCampaigns(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllCampaigns = () => {
    if (selectedCampaigns.length === shoppingCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(shoppingCampaigns.map(c => c.id));
    }
  };

  const createCampaignsInGoogleAds = async () => {
    setIsCreating(true);
    setCreateResult(null);
    
    try {
      const campaignIds = selectedCampaigns.length > 0 ? selectedCampaigns : null;
      
      const response = await fetch(`${API_URL}/api/google-ads/campaigns/create-predefined`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_ids: campaignIds })
      });
      
      const result = await response.json();
      setCreateResult(result);
      
      if (result.error && result.error.includes("OAuth")) {
        toast({
          title: "OAuth Vereist",
          description: "Verbind eerst je Google Ads account via Admin > Google Ads",
          variant: "destructive"
        });
      } else if (result.success_count > 0) {
        toast({
          title: `${result.success_count} Campagnes Aangemaakt!`,
          description: `Succesvol in Google Ads geïmporteerd. Status: PAUSED`,
        });
      } else if (result.fail_count > 0) {
        toast({
          title: "Fout bij aanmaken",
          description: `${result.fail_count} campagnes konden niet worden aangemaakt`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating campaigns:', error);
      toast({
        title: "Fout",
        description: "Kon geen verbinding maken met Google Ads API",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="flex items-center text-warm-brown-600 hover:text-warm-brown-700 mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar Admin
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Shopping Campagnes</h1>
            <p className="text-slate-600">20 SEO & SEA geoptimaliseerde campagnes</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Totaal dagbudget</p>
            <p className="text-3xl font-bold text-warm-brown-600">€{totalDailyBudget.toFixed(2)}</p>
          </div>
        </div>

        {/* Google Ads Import Section */}
        <Card className="mb-8 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600" />
              Importeer naar Google Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <p className="text-slate-700 mb-2">
                  Maak automatisch {selectedCampaigns.length > 0 ? selectedCampaigns.length : 'alle 20'} campagnes aan in Google Ads.
                </p>
                <p className="text-sm text-slate-500">
                  Campagnes worden aangemaakt met status <Badge variant="outline">PAUSED</Badge> - activeer ze handmatig in Google Ads.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={selectAllCampaigns}
                  size="sm"
                >
                  {selectedCampaigns.length === shoppingCampaigns.length ? 'Deselecteer Alle' : 'Selecteer Alle'}
                </Button>
                <Button 
                  onClick={createCampaignsInGoogleAds}
                  disabled={isCreating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importeer naar Google Ads
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Result Display */}
            {createResult && (
              <div className={`mt-4 p-4 rounded-lg ${createResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                {createResult.error ? (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{createResult.error}</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">{createResult.success_count} van {createResult.total} campagnes aangemaakt!</span>
                    </div>
                    {createResult.failed?.length > 0 && (
                      <p className="text-sm text-red-600">
                        Mislukt: {createResult.failed.map(f => f.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-warm-brown-100">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Eye className="w-4 h-4" />
                <span className="text-xs">Impressies</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.impressions.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-warm-brown-100">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MousePointer className="w-4 h-4" />
                <span className="text-xs">Clicks</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.clicks.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-warm-brown-100">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs">Conversies</span>
              </div>
              <p className="text-2xl font-bold">{campaignMetrics.conversions}</p>
            </CardContent>
          </Card>
          <Card className="border-warm-brown-100">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Omzet</span>
              </div>
              <p className="text-2xl font-bold">€{campaignMetrics.revenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-warm-brown-100 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">ROAS</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{campaignMetrics.roas}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Zoek campagnes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-warm-brown-200"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {campaignTypes.map(type => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(type)}
                className={filter === type ? "bg-warm-brown-500" : ""}
              >
                {type === 'all' ? 'Alle (20)' : type}
              </Button>
            ))}
          </div>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredCampaigns.map(campaign => (
            <Card 
              key={campaign.id} 
              className={`border-warm-brown-100 hover:shadow-lg transition-shadow cursor-pointer ${
                selectedCampaigns.includes(campaign.id) ? 'ring-2 ring-purple-500 bg-purple-50/30' : ''
              }`}
              onClick={() => toggleCampaignSelection(campaign.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={selectedCampaigns.includes(campaign.id)}
                      onChange={() => {}}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <Badge className={`${getTypeColor(campaign.type)} flex items-center gap-1`}>
                      {getTypeIcon(campaign.type)}
                      {campaign.type}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Actief
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{campaign.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{campaign.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-xs text-slate-500">Dagbudget</p>
                    <p className="font-bold text-warm-brown-600">€{campaign.dailyBudget.toFixed(2)}</p>
                  </div>
                  {campaign.targetRoas && (
                    <div className="bg-slate-50 rounded p-2">
                      <p className="text-xs text-slate-500">Target ROAS</p>
                      <p className="font-bold text-green-600">{campaign.targetRoas}%</p>
                    </div>
                  )}
                  {campaign.targetCpa && (
                    <div className="bg-slate-50 rounded p-2">
                      <p className="text-xs text-slate-500">Target CPA</p>
                      <p className="font-bold text-blue-600">€{campaign.targetCpa.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* SEO Keywords */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">SEO Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.seoKeywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-xs bg-warm-brown-50 text-warm-brown-700 px-2 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                    {campaign.seoKeywords.length > 3 && (
                      <span className="text-xs text-slate-400">+{campaign.seoKeywords.length - 3} meer</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SEO Keywords Section */}
        <Card className="border-warm-brown-200 bg-warm-brown-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-warm-brown-600" />
                  Alle SEO Keywords ({allSeoKeywords.length})
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Kopieer deze keywords voor organische optimalisatie
                </p>
              </div>
              <Button onClick={copyKeywords} variant="outline" className="gap-2">
                {copiedKeywords ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedKeywords ? 'Gekopieerd!' : 'Kopieer Alle'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allSeoKeywords.map((kw, i) => (
                <span key={i} className="text-sm bg-white text-slate-700 px-3 py-1 rounded-full border border-warm-brown-200">
                  {kw}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Type Legend */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-warm-brown-100">
          <h3 className="font-bold text-slate-900 mb-4">Campagne Types Uitleg</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Performance Max</p>
                <p className="text-sm text-slate-600">AI-gestuurd, cross-channel bereik</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Standard Shopping</p>
                <p className="text-sm text-slate-600">Product-specifiek, meer controle</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Demand Gen</p>
                <p className="text-sm text-slate-600">YouTube, Gmail, Discover</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Search className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Search (SEA)</p>
                <p className="text-sm text-slate-600">Tekstadvertenties op Google</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignManagementPage;
