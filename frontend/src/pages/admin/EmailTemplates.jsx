import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Plus, Edit2, Trash2, Eye, Copy, Save, X, 
  ChevronLeft, Code, Link, Variable, Send, CheckCircle,
  Upload, FileArchive, Image, FolderOpen, FileUp, Users, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

import { API_URL } from '../../api/client';

const EmailTemplatesAdmin = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [availableVariables, setAvailableVariables] = useState({});
  const [cartLinkTemplates, setCartLinkTemplates] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [assets, setAssets] = useState([]);
  const [showAssets, setShowAssets] = useState(false);
  const fileInputRef = useRef(null);
  
  // CSV Import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvSource, setCsvSource] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const csvInputRef = useRef(null);

  // Campaign state
  const [campaignTemplateId, setCampaignTemplateId] = useState('');
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const progressRef = useRef(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    description: '',
    category: 'marketing',
    cartLink: '',
    active: true
  });

  useEffect(() => {
    fetchTemplates();
    fetchVariables();
    fetchAssets();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVariables = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates/variables`);
      if (response.ok) {
        const data = await response.json();
        setAvailableVariables(data.variables || {});
        setCartLinkTemplates(data.cartLinkTemplates || {});
      }
    } catch (error) {
      console.error('Error fetching variables:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates/assets`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      if (csvSource) formData.append('source', csvSource);

      const response = await fetch(`${API_URL}/api/email/csv/import`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setCsvResult(data);
        setCsvFile(null);
        if (csvInputRef.current) csvInputRef.current.value = '';
      } else {
        setCsvResult({ success: false, message: data.detail || 'Import mislukt' });
      }
    } catch (error) {
      setCsvResult({ success: false, message: 'Verbindingsfout: ' + error.message });
    } finally {
      setCsvImporting(false);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/email/csv/queue/stats`);
      if (response.ok) {
        const data = await response.json();
        setQueueStats(data.sources || {});
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  };

  const startCampaign = async () => {
    if (!campaignTemplateId) return;
    setCampaignRunning(true);
    setCampaignProgress(null);
    try {
      const body = {
        template_id: campaignTemplateId,
        source: csvSource || undefined,
        batch_size: 25,
        delay_seconds: 1.2
      };
      const response = await fetch(`${API_URL}/api/email/csv/send-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok && data.campaign_id) {
        setCampaignId(data.campaign_id);
        setCampaignProgress({ total: data.total, sent: 0, failed: 0, processed: 0, percent: 0, status: 'running' });
        // Poll for progress
        progressRef.current = setInterval(async () => {
          try {
            const res = await fetch(`${API_URL}/api/email/csv/campaign-progress/${data.campaign_id}`);
            if (res.ok) {
              const prog = await res.json();
              setCampaignProgress(prog);
              if (prog.status === 'completed') {
                clearInterval(progressRef.current);
                setCampaignRunning(false);
                fetchQueueStats();
              }
            }
          } catch {}
        }, 2000);
      } else {
        setCampaignProgress({ status: 'error', message: data.detail || 'Campagne starten mislukt' });
        setCampaignRunning(false);
      }
    } catch (error) {
      setCampaignProgress({ status: 'error', message: error.message });
      setCampaignRunning(false);
    }
  };

  // Direct verzenden naar klantengroep
  const sendToCustomers = async (templateId, customerGroup = 'all') => {
    if (!confirm(`Weet je zeker dat je deze email wilt versturen naar ${customerGroup === 'all' ? 'alle klanten' : customerGroup}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/email-templates/send-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          customer_group: customerGroup
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Email verstuurd naar ${data.total_sent} klanten!`);
        fetchTemplates();
      } else {
        alert(`❌ Fout: ${data.detail || 'Verzenden mislukt'}`);
      }
    } catch (error) {
      alert(`❌ Fout: ${error.message}`);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  // Fetch queue stats when CSV panel opens
  useEffect(() => {
    if (showCsvImport) fetchQueueStats();
  }, [showCsvImport]);

  const handleZipUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'marketing');

      const response = await fetch(`${API_URL}/api/email-templates/upload-zip`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({ success: true, message: `Template "${result.template.name}" aangemaakt met ${result.images_saved} afbeeldingen!` });
        await fetchTemplates();
        await fetchAssets();
      } else {
        setUploadResult({ success: false, message: result.detail || 'Upload mislukt' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({ success: false, message: 'Upload mislukt: ' + error.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      subject: '',
      content: getDefaultTemplate(),
      description: '',
      category: 'marketing',
      cartLink: 'https://droomvriendjes.nl/checkout?product=leeuw&quantity=1',
      active: true
    });
    setIsEditing(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      description: template.description || '',
      category: template.category || 'marketing',
      cartLink: template.cartLink || '',
      active: template.active
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const url = selectedTemplate 
        ? `${API_URL}/api/email-templates/${selectedTemplate.id}`
        : `${API_URL}/api/email-templates`;
      
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
        await fetchTemplates();
        setIsEditing(false);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveStatus('error');
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Weet je zeker dat je deze template wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${templateId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicate = async (templateId) => {
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${templateId}/duplicate`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate && !formData.content) return;
    
    try {
      const templateId = selectedTemplate?.id;
      
      if (templateId) {
        const response = await fetch(`${API_URL}/api/email-templates/${templateId}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const data = await response.json();
          setPreviewHtml(data.content);
          setShowPreview(true);
        }
      } else {
        // Preview without saving
        let html = formData.content;
        const testData = {
          firstname: 'Jan',
          lastname: 'de Vries',
          discount_code: 'FAMILIE20',
          discount_percentage: '20%',
          cart_link: formData.cartLink || 'https://droomvriendjes.nl/checkout',
          unsubscribe_link: 'https://droomvriendjes.nl/unsubscribe'
        };
        
        Object.entries(testData).forEach(([key, value]) => {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        
        setPreviewHtml(html);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-content');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setFormData({ ...formData, content: newText });
    }
  };

  const getDefaultTemplate = () => {
    return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #8B7355, #6d5a45); }
        .content { padding: 30px; background: #fff; }
        h1 { color: #8B7355; }
        .cta-button { display: block; text-align: center; background: #8B7355; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px auto; max-width: 250px; }
        .footer { text-align: center; padding: 20px; background: #f5f5f5; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/email-assets/logo.jpg" alt="Droomvriendjes" style="height: 60px;">
    </div>
    <div class="content">
        <h1>Hallo {{firstname}}!</h1>
        <p>Hier komt je email content...</p>
        <a href="{{cart_link}}" class="cta-button">Bestel Nu →</a>
    </div>
    <div class="footer">
        <p>© 2024 Droomvriendjes | <a href="{{unsubscribe_link}}">Uitschrijven</a></p>
    </div>
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-[#8B7355]" />
                  Email Templates
                </h1>
                <p className="text-sm text-gray-500">Maak en beheer email marketing templates</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setCsvFile(e.target.files?.[0] || null);
                  setCsvResult(null);
                  if (e.target.files?.[0]) setShowCsvImport(true);
                }}
                className="hidden"
                id="csv-upload"
                data-testid="csv-file-input"
              />
              <Button 
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                data-testid="csv-import-btn"
              >
                <FileUp className="w-4 h-4 mr-2" />
                CSV Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleZipUpload}
                className="hidden"
                id="zip-upload"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <FileArchive className="w-4 h-4 mr-2" />
                )}
                ZIP Uploaden
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAssets(!showAssets)}
              >
                <Image className="w-4 h-4 mr-2" />
                Assets ({assets.length})
              </Button>
              <Button onClick={handleCreateNew} className="bg-[#8B7355] hover:bg-[#6d5a45]">
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Template
              </Button>
            </div>
          </div>
          
          {/* Upload Result Message */}
          {uploadResult && (
            <div className={`mt-3 p-3 rounded-lg ${uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {uploadResult.success ? '✅' : '❌'} {uploadResult.message}
              <button onClick={() => setUploadResult(null)} className="ml-2 hover:underline">Sluiten</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Assets Panel */}
        {showAssets && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#8B7355]" />
                Email Assets ({assets.length} bestanden)
              </h3>
              <button onClick={() => setShowAssets(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            {assets.length === 0 ? (
              <p className="text-gray-500 text-sm">Nog geen assets geüpload. Upload een ZIP bestand om te beginnen.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assets.map((asset, idx) => (
                  <div key={idx} className="border rounded-lg p-2 text-center">
                    <img 
                      src={asset.path} 
                      alt={asset.filename} 
                      className="w-full h-20 object-cover rounded mb-1"
                    />
                    <p className="text-xs text-gray-600 truncate">{asset.filename}</p>
                    <code className="text-xs bg-gray-100 px-1 rounded block truncate mt-1">
                      {asset.path}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CSV Import Panel */}
        {showCsvImport && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border p-5" data-testid="csv-import-panel">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8B7355]" />
                CSV Contacten Importeren
              </h3>
              <button onClick={() => { setShowCsvImport(false); setCsvResult(null); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File info */}
              {csvFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileUp className="w-5 h-5 text-[#8B7355]" />
                  <div>
                    <p className="font-medium text-sm">{csvFile.name}</p>
                    <p className="text-xs text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => { setCsvFile(null); if (csvInputRef.current) csvInputRef.current.value = ''; }} className="ml-auto text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Source tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bron label (optioneel)
                </label>
                <Input
                  placeholder="bijv. webshop_nieuwsbrief, beurs_maart_2026"
                  value={csvSource}
                  onChange={(e) => setCsvSource(e.target.value)}
                  data-testid="csv-source-input"
                />
                <p className="text-xs text-gray-500 mt-1">Voor analytics tracking. Standaard: csv_import_[datum]</p>
              </div>

              {/* Info box */}
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">CSV Vereisten:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Kolom <code className="bg-blue-100 px-1 rounded">email</code> (verplicht)</li>
                  <li>Kolom <code className="bg-blue-100 px-1 rounded">naam</code> (optioneel)</li>
                  <li>Scheidingsteken: komma, puntkomma of tab</li>
                  <li>Duplicaten worden automatisch overgeslagen</li>
                </ul>
              </div>

              {/* Import button */}
              <Button 
                onClick={handleCsvImport}
                disabled={!csvFile || csvImporting}
                className="w-full bg-[#8B7355] hover:bg-[#6d5a45]"
                data-testid="csv-import-submit"
              >
                {csvImporting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Importeren...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Importeer Contacten
                  </span>
                )}
              </Button>

              {/* Results */}
              {csvResult && (
                <div className={`p-4 rounded-lg ${csvResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`} data-testid="csv-import-result">
                  <div className="flex items-start gap-2">
                    {csvResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${csvResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {csvResult.message}
                      </p>
                      {csvResult.success && (
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-white p-2 rounded text-center">
                            <div className="font-bold text-lg text-gray-900">{csvResult.total_rows}</div>
                            <div className="text-gray-500">Totaal rijen</div>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <div className="font-bold text-lg text-green-600">{csvResult.added}</div>
                            <div className="text-gray-500">Toegevoegd</div>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <div className="font-bold text-lg text-orange-500">{csvResult.skipped_existing}</div>
                            <div className="text-gray-500">Al bestaand</div>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <div className="font-bold text-lg text-red-500">{csvResult.invalid}</div>
                            <div className="text-gray-500">Ongeldig</div>
                          </div>
                        </div>
                      )}
                      {csvResult.invalid_emails && csvResult.invalid_emails.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600 font-medium">Ongeldige e-mails:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {csvResult.invalid_emails.map((e, i) => (
                              <span key={i} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{e}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {csvResult.source && (
                        <p className="mt-2 text-xs text-gray-500">Bron: <code className="bg-gray-100 px-1 rounded">{csvResult.source}</code></p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Section - shown after import or when queue has items */}
              {(csvResult?.success || (queueStats && Object.values(queueStats).some(s => s.pending > 0))) && (
                <div className="border-t pt-4 mt-4" data-testid="campaign-section">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <Send className="w-4 h-4 text-[#8B7355]" />
                    Campagne Versturen
                  </h4>

                  {/* Queue Stats */}
                  {queueStats && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-2">Wachtrij overzicht:</p>
                      <div className="space-y-1">
                        {Object.entries(queueStats).map(([src, stats]) => (
                          <div key={src} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 truncate max-w-[150px]">{src}</span>
                            <div className="flex gap-3">
                              <span className="text-orange-600">{stats.pending || 0} wachtend</span>
                              <span className="text-green-600">{stats.sent || 0} verzonden</span>
                              {stats.failed > 0 && <span className="text-red-600">{stats.failed} mislukt</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Template Selection */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kies template
                    </label>
                    <select
                      value={campaignTemplateId}
                      onChange={(e) => setCampaignTemplateId(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355]"
                      data-testid="campaign-template-select"
                    >
                      <option value="">Selecteer een template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>
                      ))}
                    </select>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={startCampaign}
                    disabled={!campaignTemplateId || campaignRunning}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    data-testid="campaign-send-btn"
                  >
                    {campaignRunning ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Verzenden...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Verstuur Campagne
                      </span>
                    )}
                  </Button>

                  {/* Progress */}
                  {campaignProgress && campaignProgress.status === 'running' && (
                    <div className="mt-3 space-y-2" data-testid="campaign-progress">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{campaignProgress.processed || 0} / {campaignProgress.total}</span>
                        <span>{campaignProgress.percent || 0}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${campaignProgress.percent || 0}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600">{campaignProgress.sent || 0} verzonden</span>
                        {campaignProgress.failed > 0 && <span className="text-red-600">{campaignProgress.failed} mislukt</span>}
                      </div>
                    </div>
                  )}

                  {/* Campaign Results */}
                  {campaignProgress && campaignProgress.status === 'completed' && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="campaign-result">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-green-800">Campagne voltooid!</p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-white p-2 rounded text-center">
                              <div className="font-bold text-lg text-gray-900">{campaignProgress.total}</div>
                              <div className="text-gray-500">Totaal</div>
                            </div>
                            <div className="bg-white p-2 rounded text-center">
                              <div className="font-bold text-lg text-green-600">{campaignProgress.sent}</div>
                              <div className="text-gray-500">Verzonden</div>
                            </div>
                            <div className="bg-white p-2 rounded text-center">
                              <div className="font-bold text-lg text-red-500">{campaignProgress.failed}</div>
                              <div className="text-gray-500">Mislukt</div>
                            </div>
                          </div>
                          {campaignProgress.failed_emails?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-red-600 font-medium">Mislukte adressen:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {campaignProgress.failed_emails.map((e, i) => (
                                  <span key={i} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{e}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {campaignProgress && campaignProgress.status === 'error' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      {campaignProgress.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {isEditing ? (
          /* Editor View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    {selectedTemplate ? 'Template Bewerken' : 'Nieuwe Template'}
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Annuleren
                    </Button>
                    <Button onClick={handlePreview} variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    {selectedTemplate && (
                      <Button 
                        onClick={() => sendToCustomers(selectedTemplate.id)} 
                        variant="outline"
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Verzend Nu
                      </Button>
                    )}
                    <Button onClick={handleSave} className="bg-[#8B7355] hover:bg-[#6d5a45]">
                      {saveStatus === 'saving' ? (
                        <span className="animate-spin">⏳</span>
                      ) : saveStatus === 'saved' ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      {saveStatus === 'saved' ? 'Opgeslagen!' : 'Opslaan'}
                    </Button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Template Naam</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Bijv. Familie Campagne"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Categorie</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="marketing">Marketing</option>
                        <option value="transactional">Transactie</option>
                        <option value="notification">Notificatie</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Onderwerp</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Beste {{firstname}}, bekijk onze nieuwe collectie!"
                    />
                    <p className="text-xs text-gray-500 mt-1">Gebruik {"{{variabelen}}"} voor personalisatie</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Winkelwagen Link
                    </label>
                    <Input
                      value={formData.cartLink}
                      onChange={(e) => setFormData({ ...formData, cartLink: e.target.value })}
                      placeholder="https://droomvriendjes.nl/checkout?product=leeuw&quantity=1"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button 
                        onClick={() => setFormData({ ...formData, cartLink: 'https://droomvriendjes.nl/checkout?product=leeuw&quantity=1' })}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Leeuw
                      </button>
                      <button 
                        onClick={() => setFormData({ ...formData, cartLink: 'https://droomvriendjes.nl/checkout?product=schaap&quantity=1' })}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Schaap
                      </button>
                      <button 
                        onClick={() => setFormData({ ...formData, cartLink: 'https://droomvriendjes.nl/checkout?bundle=family&quantity=3&code=FAMILIE20' })}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Familie Bundle + Korting
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Beschrijving</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Korte beschrijving van deze template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      HTML Content
                    </label>
                    <textarea
                      id="template-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full h-96 px-3 py-2 border rounded-lg font-mono text-sm"
                      placeholder="<!DOCTYPE html>..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="active" className="text-sm">Template is actief</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Variables Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Variable className="w-4 h-4" />
                  Beschikbare Variabelen
                </h3>
                <div className="space-y-2">
                  {Object.entries(availableVariables).map(([key, desc]) => (
                    <button
                      key={key}
                      onClick={() => insertVariable(key)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <code className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">
                        {`{{${key}}}`}
                      </code>
                      <p className="text-xs text-gray-500 mt-1">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3">📷 Beschikbare Afbeeldingen</h3>
                <div className="space-y-2 text-sm">
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/logo.jpg</code></p>
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/schaap.jpg</code></p>
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/panda.jpg</code></p>
                  <p><code className="bg-gray-100 px-1 rounded">/email-assets/dino.jpg</code></p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border">
                <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Geen templates</h3>
                <p className="text-gray-500 mb-4">Maak je eerste email template aan</p>
                <Button onClick={handleCreateNew} className="bg-[#8B7355] hover:bg-[#6d5a45]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Template
                </Button>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        template.category === 'marketing' ? 'bg-blue-100 text-blue-700' :
                        template.category === 'transactional' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${template.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description || template.subject}</p>
                  
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.slice(0, 3).map((v) => (
                        <span key={v} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                          {`{{${v}}}`}
                        </span>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="text-xs text-gray-400">+{template.variables.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)} className="flex-1">
                      <Edit2 className="w-3 h-3 mr-1" />
                      Bewerken
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => sendToCustomers(template.id, 'all')}
                      className="flex-1 text-green-600 hover:bg-green-50 border-green-200"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Verzend Nu
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(template.id)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Email Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-80px)]">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border-0"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesAdmin;
