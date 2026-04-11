import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Send, Copy, Check, RefreshCw, Facebook, Instagram, ChevronDown, Loader2, Image, Video, X, Upload } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const TIKTOK_ICON = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z"/>
  </svg>
);

const PLATFORM_CONFIG = {
  facebook: { label: 'Facebook', icon: Facebook, color: '#1877F2', bg: 'bg-blue-600' },
  instagram: { label: 'Instagram', icon: Instagram, color: '#E4405F', bg: 'bg-pink-600' },
  tiktok: { label: 'TikTok', icon: TIKTOK_ICON, color: '#000000', bg: 'bg-black' }
};

const TONE_OPTIONS = [
  { value: 'warm', label: 'Warm & Moederlijk' },
  { value: 'playful', label: 'Speels & Vrolijk' },
  { value: 'professional', label: 'Professioneel' },
  { value: 'urgent', label: 'Urgentie / Aanbieding' },
  { value: 'emotional', label: 'Emotioneel & Verhaal' }
];

const GOAL_OPTIONS = [
  { value: 'sales', label: 'Verkoop verhogen' },
  { value: 'awareness', label: 'Merkbekendheid' },
  { value: 'engagement', label: 'Engagement / Interactie' },
  { value: 'traffic', label: 'Website verkeer' }
];

export default function AICampaignMakerPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customProduct, setCustomProduct] = useState({ name: '', description: '' });
  const [useCustom, setUseCustom] = useState(false);
  const [platforms, setPlatforms] = useState(['facebook', 'instagram', 'tiktok']);
  const [tone, setTone] = useState('warm');
  const [goal, setGoal] = useState('sales');
  const [audience, setAudience] = useState("Ouders met baby's en peuters");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);
  
  // Media upload state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

  useEffect(() => {
    fetchProducts();
    fetchConfigStatus();
    fetchHistory();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai-campaigns/products`);
      const data = await res.json();
      if (data.products?.length) setProducts(data.products);
    } catch (e) { console.error('Products fetch error:', e); }
  };

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai-campaigns/config-status`);
      setConfigStatus(await res.json());
    } catch (e) { console.error('Config status error:', e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai-campaigns/history`);
      const data = await res.json();
      setHistory(data.campaigns || []);
    } catch (e) { console.error('History fetch error:', e); }
  };

  const togglePlatform = (p) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleGenerate = async () => {
    const name = useCustom ? customProduct.name : selectedProduct?.name;
    const desc = useCustom ? customProduct.description : selectedProduct?.description;
    if (!name) return;

    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ai-campaigns/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: name,
          product_description: desc || name,
          target_audience: audience,
          platforms,
          campaign_goal: goal,
          tone,
          image_url: selectedProduct?.image || null
        })
      });
      if (!res.ok) throw new Error('Generatie mislukt');
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (e) {
      console.error('Generate error:', e);
      alert('Er ging iets mis bij het genereren. Probeer opnieuw.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  };

  // Media upload handlers
  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      alert('Alleen afbeeldingen en video bestanden zijn toegestaan');
      return;
    }
    
    // Max size: 50MB for video, 10MB for image
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Bestand te groot. Maximum: ${isVideo ? '50MB' : '10MB'}`);
      return;
    }
    
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };
  
  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const getFullPost = (content) => {
    if (!content) return '';
    return `${content.headline || ''}\n\n${content.caption || ''}\n\n${content.hashtags || ''}\n\n${content.cta || ''}`.trim();
  };

  return (
    <div data-testid="ai-campaign-maker" className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-400 hover:text-white transition-colors" data-testid="back-to-admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                AI Campagne Maker
              </h1>
              <p className="text-sm text-gray-400">Genereer social media content met AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {configStatus?.ai_ready && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full" data-testid="ai-status-ready">
                AI Actief
              </span>
            )}
            <button onClick={() => setShowHistory(!showHistory)} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors" data-testid="toggle-history">
              Geschiedenis ({history.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Configuration */}
          <div className="space-y-6">
            {/* Product Selection */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6" data-testid="product-selection">
              <h2 className="text-lg font-semibold mb-4">Product Selectie</h2>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setUseCustom(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!useCustom ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} data-testid="use-existing-product">
                  Bestaand Product
                </button>
                <button onClick={() => setUseCustom(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${useCustom ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} data-testid="use-custom-product">
                  Eigen Tekst
                </button>
              </div>

              {!useCustom ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {products.length === 0 && <p className="text-gray-500 text-sm">Producten laden...</p>}
                  {products.map(p => (
                    <button key={p.id} onClick={() => setSelectedProduct(p)} data-testid={`product-option-${p.id}`}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedProduct?.id === p.id ? 'bg-amber-500/20 border-amber-500/50 border' : 'bg-gray-800/50 border border-transparent hover:border-gray-700'}`}>
                      {p.image && <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.price ? `€${p.price}` : ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <input type="text" value={customProduct.name} onChange={e => setCustomProduct(p => ({...p, name: e.target.value}))} placeholder="Product naam..." data-testid="custom-product-name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500" />
                  <textarea value={customProduct.description} onChange={e => setCustomProduct(p => ({...p, description: e.target.value}))} placeholder="Product beschrijving..." rows={3} data-testid="custom-product-desc"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none" />
                </div>
              )}
            </div>

            {/* Media Upload Section */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6" data-testid="media-upload">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-amber-500" />
                Afbeelding of Video
              </h2>
              
              {!mediaFile ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors bg-gray-800/30">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                    data-testid="media-upload-input"
                  />
                  <Upload className="w-10 h-10 text-gray-500 mb-3" />
                  <p className="text-sm text-gray-400 text-center">
                    <span className="text-amber-500 font-medium">Klik om te uploaden</span><br/>
                    of sleep een bestand hierheen
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Afbeelding (max 10MB) of Video (max 50MB)</p>
                </label>
              ) : (
                <div className="relative">
                  {mediaType === 'video' ? (
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <video 
                        src={mediaPreview} 
                        className="w-full h-48 object-contain"
                        controls
                      />
                      <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Video className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-white">Video</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden">
                      <img 
                        src={mediaPreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Image className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-white">Afbeelding</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    data-testid="remove-media"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <p className="text-xs text-gray-400 mt-2 truncate">{mediaFile.name}</p>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-3">
                💡 Tip: Voeg een afbeelding of video toe om te uploaden bij je social media post
              </p>
            </div>

            {/* Platform Selection */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6" data-testid="platform-selection">
              <h2 className="text-lg font-semibold mb-4">Platformen</h2>
              <div className="flex gap-3">
                {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const active = platforms.includes(key);
                  return (
                    <button key={key} onClick={() => togglePlatform(key)} data-testid={`platform-toggle-${key}`}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${active ? 'border-amber-500/50 bg-amber-500/10' : 'border-gray-700 bg-gray-800/50 opacity-50 hover:opacity-75'}`}>
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone & Goal */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4" data-testid="tone-goal-section">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Toon</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => setTone(t.value)} data-testid={`tone-${t.value}`}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${tone === t.value ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Campagne Doel</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map(g => (
                    <button key={g.value} onClick={() => setGoal(g.value)} data-testid={`goal-${g.value}`}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${goal === g.value ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Doelgroep</label>
                <input type="text" value={audience} onChange={e => setAudience(e.target.value)} data-testid="audience-input"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={generating || (!useCustom && !selectedProduct) || (useCustom && !customProduct.name) || platforms.length === 0} data-testid="generate-campaign-btn"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-2xl text-lg transition-all flex items-center justify-center gap-3">
              {generating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> AI genereert content...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Genereer Campagne</>
              )}
            </button>
          </div>

          {/* RIGHT: Results */}
          <div className="space-y-6">
            {!result && !generating && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center" data-testid="empty-results">
                <Sparkles className="w-16 h-16 text-gray-700 mb-4" />
                <h3 className="text-xl font-semibold text-gray-500 mb-2">Klaar om te genereren</h3>
                <p className="text-gray-600 text-sm max-w-sm">Selecteer een product, kies je platformen en toon, en laat AI de perfecte marketing content schrijven.</p>
              </div>
            )}

            {generating && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center" data-testid="generating-spinner">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-amber-500/20 rounded-full animate-pulse" />
                  <Sparkles className="w-8 h-8 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                </div>
                <p className="mt-6 text-amber-400 font-medium">AI schrijft content voor {platforms.length} platform{platforms.length > 1 ? 'en' : ''}...</p>
                <p className="text-gray-500 text-sm mt-1">Dit duurt 10-30 seconden</p>
              </div>
            )}

            {result && (
              <div className="space-y-4" data-testid="campaign-results">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-400" /> Campagne Gegenereerd
                  </h2>
                  <button onClick={handleGenerate} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1" data-testid="regenerate-btn">
                    <RefreshCw className="w-4 h-4" /> Opnieuw
                  </button>
                </div>

                {/* Show uploaded media if present */}
                {mediaPreview && (
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500/20 to-transparent px-5 py-3 flex items-center gap-2">
                      {mediaType === 'video' ? <Video className="w-5 h-5 text-amber-400" /> : <Image className="w-5 h-5 text-amber-400" />}
                      <span className="font-semibold text-white">Geüploade Media</span>
                    </div>
                    <div className="p-4">
                      {mediaType === 'video' ? (
                        <video src={mediaPreview} className="w-full max-h-64 object-contain rounded-lg" controls />
                      ) : (
                        <img src={mediaPreview} alt="Upload" className="w-full max-h-64 object-contain rounded-lg" />
                      )}
                      <p className="text-xs text-gray-400 mt-2">💡 Download en upload dit bestand bij je social media post</p>
                    </div>
                  </div>
                )}

                {Object.entries(result.generated_content || {}).map(([platform, content]) => {
                  const cfg = PLATFORM_CONFIG[platform];
                  if (!cfg || !content) return null;
                  const Icon = cfg.icon;
                  const fullPost = getFullPost(content);
                  const copyKey = `${result.campaign_id}_${platform}`;

                  return (
                    <div key={platform} className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden" data-testid={`result-${platform}`}>
                      <div className={`${cfg.bg} px-5 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2 text-white">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyToClipboard(fullPost, copyKey)} data-testid={`copy-${platform}`}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm text-white transition-colors">
                            {copied[copyKey] ? <><Check className="w-4 h-4" /> Gekopieerd!</> : <><Copy className="w-4 h-4" /> Kopieer</>}
                          </button>
                          <button 
                            onClick={() => {
                              // Copy text and open platform
                              copyToClipboard(fullPost, copyKey);
                              const urls = {
                                facebook: 'https://www.facebook.com/',
                                instagram: 'https://www.instagram.com/',
                                tiktok: 'https://www.tiktok.com/upload'
                              };
                              window.open(urls[platform], '_blank');
                            }}
                            data-testid={`post-${platform}`}
                            className="flex items-center gap-1.5 bg-white hover:bg-white/90 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                            style={{ color: cfg.color }}
                          >
                            <Send className="w-4 h-4" /> Posten
                          </button>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        {content.headline && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Headline</span>
                            <p className="font-bold text-lg mt-0.5">{content.headline}</p>
                          </div>
                        )}
                        {content.caption && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Caption</span>
                            <p className="text-gray-300 mt-0.5 whitespace-pre-line text-sm leading-relaxed">{content.caption}</p>
                          </div>
                        )}
                        {content.hashtags && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Hashtags</span>
                            <p className="text-amber-400 mt-0.5 text-sm">{content.hashtags}</p>
                          </div>
                        )}
                        {content.cta && (
                          <div className="bg-gray-800/50 rounded-xl p-3 flex items-center gap-2">
                            <Send className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span className="text-sm font-medium">{content.cta}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Campaign History */}
            {showHistory && history.length > 0 && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6" data-testid="campaign-history">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ChevronDown className="w-4 h-4" /> Eerdere Campagnes
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {history.map((c, i) => (
                    <div key={c.campaign_id || i} className="bg-gray-800/50 rounded-xl p-4 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{c.product_name}</span>
                          <div className="flex gap-1.5 mt-1.5">
                            {(c.platforms || []).map(p => (
                              <span key={p} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{p}</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('nl-NL') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
