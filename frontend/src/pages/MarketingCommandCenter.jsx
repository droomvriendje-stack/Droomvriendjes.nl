import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Mail, Users, Send, Upload, FileText, ChevronLeft,
  Check, AlertTriangle, Trash2, RefreshCw, Clock,
  CheckCircle, XCircle, Loader2, Play, BarChart3
} from 'lucide-react';

import { API_URL } from '../api/client';

const MarketingCommandCenter = () => {
  const { admin } = useAdminAuth();
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [sources, setSources] = useState({});
  const [templates, setTemplates] = useState([]);
  const [unsubCount, setUnsubCount] = useState(0);

  // Campaign per source
  const [activeCampaign, setActiveCampaign] = useState(null); // source name
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const fetchAll = () => {
    fetchStats();
    fetchTemplates();
    fetchUnsubCount();
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/email/csv/queue/stats`);
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || {});
      }
    } catch (e) { console.error(e); }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/email-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // API returns array directly, not {templates: [...]}
        setTemplates(Array.isArray(data) ? data : (data.templates || []));
      }
    } catch (e) { console.error(e); }
  };

  const fetchUnsubCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/email/csv/unsubscribe-stats`);
      if (res.ok) {
        const data = await res.json();
        setUnsubCount(data.total_unsubscribed || 0);
      }
    } catch (e) { console.error(e); }
  };

  // Upload CSV
  const handleUpload = async (file) => {
    if (!file?.name.endsWith('.csv')) {
      setImportResult({ success: false, message: 'Alleen CSV bestanden' });
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/api/email/csv/import`, { method: 'POST', body: fd });
      const data = await res.json();
      setImportResult(res.ok ? data : { success: false, message: data.detail || 'Mislukt' });
      if (res.ok) fetchStats();
    } catch (e) {
      setImportResult({ success: false, message: e.message });
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send campaign for a specific source
  const startCampaign = async (source) => {
    if (!selectedTemplate) return;
    setCampaignRunning(true);
    setCampaignProgress(null);
    setActiveCampaign(source);
    try {
      const res = await fetch(`${API_URL}/api/email/csv/send-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selectedTemplate, source, batch_size: 25, delay_seconds: 1.2 })
      });
      const data = await res.json();
      if (res.ok && data.campaign_id) {
        setCampaignProgress({ total: data.total, sent: 0, failed: 0, processed: 0, percent: 0, status: 'running' });
        progressRef.current = setInterval(async () => {
          try {
            const r = await fetch(`${API_URL}/api/email/csv/campaign-progress/${data.campaign_id}`);
            if (r.ok) {
              const prog = await r.json();
              setCampaignProgress(prog);
              if (prog.status === 'completed') {
                clearInterval(progressRef.current);
                setCampaignRunning(false);
                fetchStats();
              }
            }
          } catch {}
        }, 2000);
      } else {
        setCampaignProgress({ status: 'error', message: data.detail || 'Mislukt' });
        setCampaignRunning(false);
      }
    } catch (e) {
      setCampaignProgress({ status: 'error', message: e.message });
      setCampaignRunning(false);
    }
  };

  const deleteSource = async (source) => {
    if (!window.confirm(`"${source}" verwijderen? Alle contacten worden gewist.`)) return;
    await fetch(`${API_URL}/api/email/csv/queue?source=${encodeURIComponent(source)}`, { method: 'DELETE' });
    fetchStats();
  };

  // Totals
  const totals = Object.values(sources).reduce((acc, s) => ({
    total: acc.total + (s.total || 0),
    pending: acc.pending + (s.pending || 0),
    sent: acc.sent + (s.sent || 0),
    failed: acc.failed + (s.failed || 0),
  }), { total: 0, pending: 0, sent: 0, failed: 0 });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#8B7355]" />Email Marketing
              </h1>
              <p className="text-sm text-slate-500">Upload, verstuur & volg op per bestand</p>
            </div>
          </div>
          <button onClick={fetchAll} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" data-testid="refresh-btn">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="stats-cards">
          {[
            { label: 'Totaal', value: totals.total, icon: Users, color: 'blue' },
            { label: 'Wachtend', value: totals.pending, icon: Clock, color: 'orange' },
            { label: 'Verzonden', value: totals.sent, icon: CheckCircle, color: 'green' },
            { label: 'Mislukt', value: totals.failed, icon: XCircle, color: 'red' },
            { label: 'Afgemeld', value: unsubCount, icon: Mail, color: 'slate' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 border shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 bg-${s.color}-50 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4 h-4 text-${s.color}-600`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 leading-tight">{s.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" data-testid="upload-section">
          <div className="p-5 border-b bg-gradient-to-r from-[#8B7355]/5 to-transparent">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#8B7355]" />
              Stap 1: CSV Bestand Uploaden
            </h2>
          </div>
          <div className="p-5">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={e => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files?.[0]); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging ? 'border-[#8B7355] bg-[#8B7355]/5' : 'border-slate-200 hover:border-slate-300'
              }`}
              data-testid="csv-dropzone"
            >
              <input ref={fileInputRef} type="file" accept=".csv" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} className="hidden" data-testid="csv-file-input" />
              {importing ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#8B7355]" />
                  <span className="text-slate-600 font-medium">Bestand wordt verwerkt...</span>
                </div>
              ) : (
                <>
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-medium text-slate-600">Sleep je CSV hier of klik om te selecteren</p>
                  <p className="text-xs text-slate-400 mt-1">Bestandsnaam wordt automatisch als label gebruikt</p>
                </>
              )}
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`mt-4 p-4 rounded-xl ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`} data-testid="import-result">
                <div className="flex items-start gap-2">
                  {importResult.success ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>{importResult.message}</p>
                    {importResult.success && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="bg-white px-2 py-1 rounded"><b>{importResult.total_rows?.toLocaleString()}</b> rijen</span>
                        <span className="bg-white px-2 py-1 rounded text-green-700"><b>{importResult.added?.toLocaleString()}</b> toegevoegd</span>
                        <span className="bg-white px-2 py-1 rounded text-amber-600"><b>{importResult.skipped_existing?.toLocaleString()}</b> bestaand</span>
                        <span className="bg-white px-2 py-1 rounded text-red-600"><b>{importResult.invalid?.toLocaleString()}</b> ongeldig</span>
                        {importResult.source && <span className="bg-white px-2 py-1 rounded text-slate-500">Bron: <b>{importResult.source}</b></span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Template Selection */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" data-testid="template-section">
          <div className="p-5 border-b bg-gradient-to-r from-[#8B7355]/5 to-transparent">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#8B7355]" />
              Stap 2: Kies Template & Verstuur per Bestand
            </h2>
          </div>
          <div className="p-5">
            <select
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355] mb-4"
              data-testid="template-select"
            >
              <option value="">Selecteer een email template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>
              ))}
            </select>

            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 mb-4">
              Placeholders: <code className="bg-blue-100 px-1 rounded">{'{{naam}}'}</code> <code className="bg-blue-100 px-1 rounded">{'{{voornaam}}'}</code> <code className="bg-blue-100 px-1 rounded">{'{{email}}'}</code> &bull; Afmeldlink wordt automatisch toegevoegd (AVG)
            </div>
          </div>
        </div>

        {/* Per-File Cards */}
        <div className="space-y-4" data-testid="file-cards">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#8B7355]" />
            Stap 3: Opvolgen per Bestand
          </h2>

          {Object.keys(sources).length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Nog geen bestanden geüpload</p>
              <p className="text-xs text-slate-300 mt-1">Upload een CSV om te beginnen</p>
            </div>
          ) : (
            Object.entries(sources).map(([src, stats]) => {
              const pending = stats.pending || 0;
              const sent = stats.sent || 0;
              const failed = stats.failed || 0;
              const unsub = stats.unsubscribed || 0;
              const total = stats.total || 0;
              const sentPercent = total > 0 ? Math.round((sent / total) * 100) : 0;
              const isActive = activeCampaign === src && campaignRunning;
              const isCompleted = activeCampaign === src && campaignProgress?.status === 'completed';

              return (
                <div key={src} className="bg-white rounded-xl border shadow-sm overflow-hidden" data-testid={`file-card-${src}`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-800 truncate text-sm sm:text-base" title={src}>{src}</h3>
                        <p className="text-xs text-slate-400">{total.toLocaleString()} contacten</p>
                      </div>
                      <button onClick={() => deleteSource(src)} className="p-1.5 text-slate-300 hover:text-red-500 transition flex-shrink-0" title="Verwijderen">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats bar */}
                    <div className="flex gap-2 sm:gap-3 mb-3 flex-wrap">
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-md font-medium">{pending.toLocaleString()} wachtend</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">{sent.toLocaleString()} verzonden</span>
                      {failed > 0 && <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md font-medium">{failed.toLocaleString()} mislukt</span>}
                      {unsub > 0 && <span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-md font-medium">{unsub.toLocaleString()} afgemeld</span>}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${sentPercent}%` }} />
                    </div>

                    {/* Campaign progress for this source */}
                    {isActive && campaignProgress?.status === 'running' && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg" data-testid="campaign-progress">
                        <div className="flex justify-between text-sm text-blue-700 mb-1">
                          <span>Verzenden... {campaignProgress.processed || 0} / {campaignProgress.total}</span>
                          <span className="font-bold">{campaignProgress.percent || 0}%</span>
                        </div>
                        <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${campaignProgress.percent || 0}%` }} />
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-blue-600">
                          <span><Check className="w-3 h-3 inline" /> {campaignProgress.sent || 0} verzonden</span>
                          {(campaignProgress.failed || 0) > 0 && <span className="text-red-600"><XCircle className="w-3 h-3 inline" /> {campaignProgress.failed} mislukt</span>}
                        </div>
                      </div>
                    )}

                    {/* Completed */}
                    {isCompleted && (
                      <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200" data-testid="campaign-result">
                        <p className="text-sm text-green-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Campagne voltooid!
                          <span className="font-normal ml-1">{campaignProgress.sent} verzonden, {campaignProgress.failed} mislukt</span>
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {activeCampaign === src && campaignProgress?.status === 'error' && (
                      <div className="mb-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> {campaignProgress.message}
                      </div>
                    )}

                    {/* Send button */}
                    {pending > 0 && (
                      <button
                        onClick={() => startCampaign(src)}
                        disabled={!selectedTemplate || campaignRunning}
                        className="w-full py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        data-testid={`send-btn-${src}`}
                      >
                        {isActive ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Bezig...</>
                        ) : (
                          <><Play className="w-4 h-4" /> Verstuur {pending.toLocaleString()} emails</>
                        )}
                      </button>
                    )}

                    {pending === 0 && sent > 0 && (
                      <div className="text-center py-2 text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Alle emails verzonden
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketingCommandCenter;
