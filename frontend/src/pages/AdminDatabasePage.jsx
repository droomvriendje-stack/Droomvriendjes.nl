import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Server, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Layers,
  FileText,
  Zap,
  ArrowLeft,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

import { API_URL } from '../api/client';

const AdminDatabasePage = () => {
  const navigate = useNavigate();
  const [dbInfo, setDbInfo] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCollections, setExpandedCollections] = useState({});
  const [sampleData, setSampleData] = useState({});
  const [loadingSample, setLoadingSample] = useState({});
  const [activeTab, setActiveTab] = useState('database');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbResponse, intResponse] = await Promise.all([
        fetch(`${API_URL}/api/database/info`),
        fetch(`${API_URL}/api/database/integrations`)
      ]);
      
      if (!dbResponse.ok) throw new Error('Failed to fetch database info');
      if (!intResponse.ok) throw new Error('Failed to fetch integrations');
      
      const dbData = await dbResponse.json();
      const intData = await intResponse.json();
      
      setDbInfo(dbData);
      setIntegrations(intData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = (collName) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collName]: !prev[collName]
    }));
  };

  const fetchSampleData = async (collName) => {
    if (sampleData[collName]) {
      // Toggle visibility if already fetched
      setSampleData(prev => ({
        ...prev,
        [collName]: prev[collName]._visible ? { ...prev[collName], _visible: false } : { ...prev[collName], _visible: true }
      }));
      return;
    }

    setLoadingSample(prev => ({ ...prev, [collName]: true }));
    try {
      const response = await fetch(`${API_URL}/api/database/collections/${collName}/sample?limit=3`);
      if (!response.ok) throw new Error('Failed to fetch sample');
      const data = await response.json();
      setSampleData(prev => ({ ...prev, [collName]: { ...data, _visible: true } }));
    } catch (err) {
      console.error('Error fetching sample:', err);
    } finally {
      setLoadingSample(prev => ({ ...prev, [collName]: false }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'configured':
      case 'healthy':
        return 'text-green-500';
      case 'not configured':
        return 'text-gray-400';
      case 'error':
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'connected':
      case 'configured':
      case 'healthy':
        return 'bg-green-500/10 border-green-500/30';
      case 'not configured':
        return 'bg-gray-500/10 border-gray-500/30';
      case 'error':
      case 'unhealthy':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-yellow-500/10 border-yellow-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin" />
          <p className="text-white text-lg">Database informatie laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Fout bij laden</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Terug naar Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Database & Integraties</h1>
              <p className="text-gray-400">Beheer en monitor al je connecties</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Vernieuwen
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'database' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </div>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'integrations' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Integraties ({integrations?.total || 0})
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'database' && dbInfo && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Database Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Connection Status */}
            <div className={`p-6 rounded-xl border ${getStatusBg(dbInfo.database.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <Server className={`w-8 h-8 ${getStatusColor(dbInfo.database.status)}`} />
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dbInfo.database.status)} bg-current/10`}>
                  {dbInfo.database.status}
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg">{dbInfo.database.name}</h3>
              <p className="text-gray-400 text-sm">{dbInfo.database.type}</p>
              <p className="text-gray-500 text-xs mt-2">Cluster: {dbInfo.database.connection.cluster}</p>
            </div>

            {/* Total Collections */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Layers className="w-8 h-8 text-blue-400" />
                <span className="text-blue-400 text-2xl font-bold">{dbInfo.stats.total_collections}</span>
              </div>
              <h3 className="text-white font-semibold">Collecties</h3>
              <p className="text-gray-400 text-sm">Database tabellen</p>
            </div>

            {/* Total Documents */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-green-400" />
                <span className="text-green-400 text-2xl font-bold">{dbInfo.stats.total_documents.toLocaleString()}</span>
              </div>
              <h3 className="text-white font-semibold">Documenten</h3>
              <p className="text-gray-400 text-sm">Totaal aantal records</p>
            </div>

            {/* Storage */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <HardDrive className="w-8 h-8 text-purple-400" />
                <span className="text-purple-400 text-2xl font-bold">{dbInfo.stats.storage_formatted}</span>
              </div>
              <h3 className="text-white font-semibold">Opslag</h3>
              <p className="text-gray-400 text-sm">Data: {dbInfo.stats.data_size_formatted}</p>
            </div>
          </div>

          {/* Collections List */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Collecties ({dbInfo.collections.length})
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {dbInfo.collections.map((coll) => (
                <div key={coll.name} className="hover:bg-white/5 transition-colors">
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleCollection(coll.name)}
                  >
                    <div className="flex items-center gap-4">
                      {expandedCollections[coll.name] ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{coll.name}</h3>
                        <p className="text-gray-400 text-sm">{coll.document_count.toLocaleString()} documenten</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-white font-medium">{coll.size_formatted}</p>
                        <p className="text-gray-500 text-xs">{coll.index_count} indexen</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); fetchSampleData(coll.name); }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Bekijk sample data"
                      >
                        {loadingSample[coll.name] ? (
                          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                        ) : sampleData[coll.name]?._visible ? (
                          <EyeOff className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedCollections[coll.name] && (
                    <div className="px-4 pb-4 pl-16 space-y-4">
                      {/* Schema Fields */}
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Schema velden:</p>
                        <div className="flex flex-wrap gap-2">
                          {coll.schema_fields?.map((field) => (
                            <span key={field} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Indexes */}
                      {coll.indexes?.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-sm mb-2">Indexen:</p>
                          <div className="flex flex-wrap gap-2">
                            {coll.indexes.map((index) => (
                              <span key={index.name} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                {index.name} ({index.keys.join(', ')})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sample Data */}
                      {sampleData[coll.name]?._visible && sampleData[coll.name]?.documents && (
                        <div>
                          <p className="text-gray-400 text-sm mb-2">Sample data ({sampleData[coll.name].sample_size} van {sampleData[coll.name].total_documents}):</p>
                          <div className="bg-black/30 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-gray-300 text-xs">
                              {JSON.stringify(sampleData[coll.name].documents, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && integrations && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Totaal</span>
                <span className="text-3xl font-bold text-white">{integrations.total}</span>
              </div>
              <p className="text-gray-500 text-sm">Geconfigureerde services</p>
            </div>
            <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400">Actief</span>
                <span className="text-3xl font-bold text-green-400">{integrations.connected}</span>
              </div>
              <p className="text-green-400/60 text-sm">Connected & werkend</p>
            </div>
            <div className="p-6 rounded-xl bg-gray-500/10 border border-gray-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Niet geconfigureerd</span>
                <span className="text-3xl font-bold text-gray-400">{integrations.not_configured}</span>
              </div>
              <p className="text-gray-500 text-sm">Nog in te stellen</p>
            </div>
          </div>

          {/* Integration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.integrations.map((integration, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border transition-all hover:scale-[1.01] ${getStatusBg(integration.status)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                      {integration.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{integration.name}</h3>
                      <p className="text-gray-400 text-sm capitalize">{integration.type}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                    {integration.status === 'connected' || integration.status === 'configured' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : integration.status === 'not configured' ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {integration.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(integration.details).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-mono">{value}</span>
                        {value && value !== 'not set' && (
                          <button 
                            onClick={() => copyToClipboard(value)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Kopieer"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Laatst bijgewerkt: {new Date().toLocaleString('nl-NL')}
        </p>
      </div>
    </div>
  );
};

export default AdminDatabasePage;
