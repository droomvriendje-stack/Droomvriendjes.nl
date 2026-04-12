import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../api/client';
import { 
  ShoppingBag, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw,
  Package,
  Tag,
  Image as ImageIcon,
  Truck,
  Upload,
  CheckCircle,
  AlertCircle,
  Rocket,
  Trash2,
  X
} from 'lucide-react';


const MerchantFeedPage = () => {
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'success', 'error'
  const [uploadMessage, setUploadMessage] = useState('');
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null); // null, 'success', 'error'
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    fetchFeedData();
  }, []);

  const fetchFeedData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/feed/products`);
      const data = await response.json();
      setFeedData(data);
    } catch (error) {
      console.error('Error fetching feed data:', error);
    }
    setLoading(false);
  };

  const copyFeedUrl = () => {
    if (feedData?.feed_url) {
      navigator.clipboard.writeText(feedData.feed_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openFeed = () => {
    window.open(`${API_URL}/api/feed/google-shopping.xml`, '_blank');
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Weet je zeker dat je "${productTitle}" wilt verwijderen?\n\n` +
      `Dit product wordt permanent verwijderd uit:\n` +
      `• De database\n` +
      `• Google Merchant Feed\n` +
      `• De website\n\n` +
      `Deze actie kan niet ongedaan worden gemaakt!`
    );
    
    if (!confirmed) return;
    
    setDeletingProductId(productId);
    setDeleteStatus(null);
    setDeleteMessage('');
    
    try {
      // Extract numeric ID from product ID (e.g., "KNUF_001" -> get from link)
      const product = feedData.products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product niet gevonden');
      }
      
      // Extract ID from link (e.g., "/product/1" -> 1)
      const numericId = product.link.split('/').pop();
      
      const response = await fetch(`${API_URL}/api/products/${numericId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Verwijderen mislukt');
      }
      
      // Success - refresh feed data
      setDeleteStatus('success');
      setDeleteMessage(`✅ "${productTitle}" succesvol verwijderd!`);
      
      // Refresh the feed after a short delay
      setTimeout(async () => {
        await fetchFeedData();
        setDeleteStatus(null);
        setDeleteMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteStatus('error');
      setDeleteMessage(`❌ Fout: ${error.message}`);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setDeleteStatus(null);
        setDeleteMessage('');
      }, 5000);
    } finally {
      setDeletingProductId(null);
    }
  };

  const uploadToMerchantCenter = async () => {
    setUploading(true);
    setUploadStatus(null);
    setUploadMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/feed/upload-to-merchant-center`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setUploadStatus('success');
        setUploadMessage(`✅ ${data.products_count} producten succesvol geüpload!`);
      } else {
        setUploadStatus('error');
        setUploadMessage(data.detail || 'Upload mislukt');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadMessage('Er ging iets mis bij het uploaden');
    }
    
    setUploading(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Google Merchant Center Feed</h1>
            </div>
            <p className="text-gray-600">Beheer je Google Shopping product feed</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : feedData ? (
            <>
              {/* Upload Section - NEW! */}
              <Card className="mb-8 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-green-600" />
                    Direct Uploaden naar Google Merchant Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-gray-700 mb-2">
                        Upload je product feed direct naar Google Merchant Center via SFTP. 
                        Je producten zijn binnen 15-30 minuten zichtbaar in Google Shopping!
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Package className="w-4 h-4" />
                        <span>{feedData?.products_count || 0} producten klaar voor upload</span>
                      </div>
                    </div>
                    <Button 
                      onClick={uploadToMerchantCenter} 
                      disabled={uploading}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg shrink-0"
                      size="lg"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Uploaden...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          🚀 Upload Feed Nu!
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Upload Status Message */}
                  {uploadStatus && (
                    <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                      uploadStatus === 'success' 
                        ? 'bg-green-100 border border-green-300' 
                        : 'bg-red-100 border border-red-300'
                    }`}>
                      {uploadStatus === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <p className={`font-semibold ${
                          uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {uploadMessage}
                        </p>
                        {uploadStatus === 'success' && (
                          <p className="text-sm text-green-700 mt-1">
                            Ga naar <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Merchant Center</a> om je producten te bekijken.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Feed Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Merchant ID</p>
                        <p className="text-xl font-bold text-gray-900">{feedData.merchant_center_id}</p>
                      </div>
                      <ShoppingBag className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Producten</p>
                        <p className="text-xl font-bold text-gray-900">{feedData.products_count}</p>
                      </div>
                      <Package className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Feed Status</p>
                        <p className="text-xl font-bold text-green-600">Actief</p>
                      </div>
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Verzending</p>
                        <p className="text-xl font-bold text-gray-900">NL + BE</p>
                      </div>
                      <Truck className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feed URL Section */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Feed URL voor Merchant Center</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
                      {feedData.feed_url}
                    </div>
                    <Button onClick={copyFeedUrl} variant="outline" className="shrink-0">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Gekopieerd!' : 'Kopieer'}
                    </Button>
                    <Button onClick={openFeed} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Bekijk Feed
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Instructies voor Merchant Center:</h4>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                      <li>Ga naar <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Merchant Center</a></li>
                      <li>Klik op "Producten" → "Feeds" → "Primaire feed toevoegen"</li>
                      <li>Selecteer "Geplande ophaalactie" als invoermethode</li>
                      <li>Plak de bovenstaande Feed URL</li>
                      <li>Stel de update frequentie in op "Dagelijks"</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Products Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Producten in Feed ({feedData.products_count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Delete Status Message */}
                  {deleteStatus && (
                    <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                      deleteStatus === 'success' 
                        ? 'bg-green-100 border border-green-300' 
                        : 'bg-red-100 border border-red-300'
                    }`}>
                      {deleteStatus === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                      <p className={`font-semibold ${
                        deleteStatus === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {deleteMessage}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {feedData.products.map((product) => (
                      <div key={product.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors relative">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border shrink-0">
                          <img 
                            src={product.image_link} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-lg text-gray-900">{product.price}</p>
                              <Badge className={`mt-1 ${product.availability === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.availability === 'in_stock' ? 'Op voorraad' : 'Uitverkocht'}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Tags and Delete Button Row */}
                          <div className="flex items-center justify-between gap-4 mt-3">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {product.id}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {product.brand}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {product.color}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                {1 + (product.additional_image_links?.length || 0)} foto's
                              </Badge>
                            </div>
                            
                            {/* Delete Button */}
                            <Button
                              onClick={() => handleDeleteProduct(product.id, product.title)}
                              disabled={deletingProductId === product.id}
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 shrink-0"
                            >
                              {deletingProductId === product.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                  Verwijderen...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Verwijder
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Feed Attributes Info */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-lg">Feed Attributen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 font-medium">✓ Vereist</p>
                      <p className="font-semibold mt-1">ID, Titel, Beschrijving</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 font-medium">✓ Vereist</p>
                      <p className="font-semibold mt-1">Prijs, Link, Afbeelding</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">✓ Aanbevolen</p>
                      <p className="font-semibold mt-1">Merk, Kleur, Materiaal</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">✓ Aanbevolen</p>
                      <p className="font-semibold mt-1">Verzending, Retourbeleid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Kon feed data niet laden</p>
                <Button onClick={fetchFeedData} className="mt-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Opnieuw proberen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MerchantFeedPage;
