import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../api/client';
import {
  ArrowLeft,
  Users,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit2,
  Tag,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  ShoppingCart,
  CreditCard,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  MoreVertical,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap
} from 'lucide-react';


const LeadManagementPage = () => {
  // State management
  const [activeList, setActiveList] = useState('imported'); // imported, customers, cart_abandoners, ad_clicks
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: 'all',
    source: 'all',
    status: 'all',
    ageRange: 'all',
    city: '',
    zipCode: '',
    tags: []
  });
  
  // Sorting
  const [sortBy, setSortBy] = useState('imported_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage] = useState(50);
  const [totalLeads, setTotalLeads] = useState(0);
  
  // CSV Import
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  
  // Edit/Tag modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [availableTags] = useState(['VIP', 'High Value', 'Engaged', 'Cold', 'Hot Lead', 'Follow Up', 'Lost']);
  
  // Segmentation
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [segmentCriteria, setSegmentCriteria] = useState({});
  
  // Notification
  const [notification, setNotification] = useState(null);
  
  // Fetch leads based on active list
  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [activeList, currentPage, filters, sortBy, sortOrder]);
  
  const fetchLeads = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const params = new URLSearchParams({
        skip: (currentPage - 1) * leadsPerPage,
        limit: leadsPerPage
      });
      
      // Add filters
      if (filters.gender !== 'all') params.append('gender', filters.gender);
      if (filters.source !== 'all') params.append('source', filters.source);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (searchTerm) params.append('search', searchTerm);
      
      switch (activeList) {
        case 'imported':
          endpoint = `/api/marketing/leads?${params}`;
          break;
        case 'customers':
          endpoint = `/api/customers?${params}`;
          break;
        case 'cart_abandoners':
          endpoint = `/api/abandoned-carts?${params}`;
          break;
        case 'ad_clicks':
          endpoint = `/api/ad-clicks?${params}`;
          break;
        default:
          endpoint = `/api/marketing/leads?${params}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      
      setLeads(data.leads || data.customers || data.carts || data.clicks || []);
      setTotalLeads(data.total || 0);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    }
    setLoading(false);
  };
  
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/leads/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  // CSV Import handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadCSV(files[0]);
    }
  };
  
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadCSV(files[0]);
    }
  };
  
  const uploadCSV = async (file) => {
    setImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/marketing/leads/upload-csv`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportResult(result);
        showNotification(`✅ ${result.valid_leads} leads geïmporteerd!`, 'success');
        fetchLeads();
        fetchStats();
      } else {
        showNotification('❌ Import mislukt', 'error');
      }
    } catch (error) {
      console.error('Import error:', error);
      showNotification('❌ Fout bij importeren', 'error');
    }
    
    setImporting(false);
  };
  
  // Delete handlers
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Weet je zeker dat je deze lead wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/marketing/leads/${leadId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('✅ Lead verwijderd', 'success');
        fetchLeads();
        fetchStats();
      }
    } catch (error) {
      showNotification('❌ Fout bij verwijderen', 'error');
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    if (!window.confirm(`Weet je zeker dat je ${selectedLeads.length} leads wilt verwijderen?`)) return;
    
    try {
      await Promise.all(
        selectedLeads.map(id =>
          fetch(`${API_URL}/api/marketing/leads/${id}`, { method: 'DELETE' })
        )
      );
      
      showNotification(`✅ ${selectedLeads.length} leads verwijderd`, 'success');
      setSelectedLeads([]);
      fetchLeads();
      fetchStats();
    } catch (error) {
      showNotification('❌ Fout bij verwijderen', 'error');
    }
  };
  
  // Update handler
  const handleUpdateLead = async (leadData) => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      
      if (response.ok) {
        showNotification('✅ Lead bijgewerkt', 'success');
        setShowEditModal(false);
        setEditingLead(null);
        fetchLeads();
      }
    } catch (error) {
      showNotification('❌ Fout bij bijwerken', 'error');
    }
  };
  
  // Export to CSV
  const handleExport = () => {
    const csv = convertToCSV(leads);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${activeList}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showNotification('✅ Export gestart', 'success');
  };
  
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };
  
  // Selection handlers
  const toggleSelectLead = (leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };
  
  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };
  
  // Get filtered and sorted leads
  const getFilteredLeads = () => {
    let filtered = [...leads];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastname?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  };
  
  const filteredLeads = getFilteredLeads();
  const totalPages = Math.ceil(totalLeads / leadsPerPage);
  
  // List configurations
  const listConfigs = {
    imported: {
      title: 'Geïmporteerde Leads',
      icon: Upload,
      color: 'blue',
      description: 'CSV geïmporteerde leads (eGENTIC, Datafanatics)',
      count: stats?.total_leads || 0
    },
    customers: {
      title: 'Klanten',
      icon: CreditCard,
      color: 'green',
      description: 'Mensen die een aankoop hebben gedaan',
      count: 0
    },
    cart_abandoners: {
      title: 'Verlaten Winkelwagens',
      icon: ShoppingCart,
      color: 'orange',
      description: 'Producten toegevoegd maar niet gekocht',
      count: 0
    },
    ad_clicks: {
      title: 'Advertentie Clicks',
      icon: Target,
      color: 'purple',
      description: 'Mensen die op advertenties hebben geklikt',
      count: 0
    }
  };
  
  const currentConfig = listConfigs[activeList];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#fdf8f3] to-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600" />
          )}
          <span className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {notification.message}
          </span>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/email-marketing" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-7 h-7 text-[#8B7355]" />
                  Lead Management
                </h1>
                <p className="text-sm text-gray-500">Beheer, segmenteer en analyseer je leads</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedLeads.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Verwijder ({selectedLeads.length})
                </Button>
              )}
              
              <Button onClick={handleExport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#8B7355] hover:bg-[#6d5a45]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importeer CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* List Type Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(listConfigs).map(([key, config]) => {
            const IconComponent = config.icon;
            const isActive = activeList === key;
            
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveList(key);
                  setCurrentPage(1);
                  setSelectedLeads([]);
                }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? `border-${config.color}-500 bg-${config.color}-50`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`w-6 h-6 ${isActive ? `text-${config.color}-600` : 'text-gray-400'}`} />
                  <span className={`text-2xl font-bold ${isActive ? `text-${config.color}-600` : 'text-gray-900'}`}>
                    {config.count.toLocaleString()}
                  </span>
                </div>
                <h3 className={`font-semibold mb-1 ${isActive ? `text-${config.color}-900` : 'text-gray-900'}`}>
                  {config.title}
                </h3>
                <p className="text-xs text-gray-500">{config.description}</p>
              </button>
            );
          })}
        </div>
        
        {/* CSV Import Section (only for imported list) */}
        {activeList === 'imported' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mb-6 p-8 border-2 border-dashed rounded-xl transition-all ${
              isDragging ? 'border-[#8B7355] bg-[#fdf8f3]' : 'border-gray-300 bg-white'
            }`}
          >
            <div className="text-center">
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-[#8B7355]' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {importing ? 'Bezig met importeren...' : 'Sleep CSV bestand hier'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Of klik op de knop om een bestand te selecteren
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="bg-[#8B7355] hover:bg-[#6d5a45]"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importeren...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Selecteer CSV
                  </>
                )}
              </Button>
              
              {importResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
                  <p className="text-sm text-green-800">
                    ✅ {importResult.valid_leads} leads geïmporteerd, {importResult.duplicates} duplicaten overgeslagen
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Zoek op email, naam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-[#8B7355] text-white' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <Button variant="outline" size="sm" onClick={fetchLeads}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Ververs
              </Button>
              
              {filteredLeads.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedLeads.length === filteredLeads.length ? 'Deselecteer' : 'Selecteer'} Alles
                </Button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="all">Alles</option>
                  <option value="male">Man</option>
                  <option value="female">Vrouw</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bron</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="all">Alles</option>
                  {stats?.by_source && Object.keys(stats.by_source).map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="all">Alles</option>
                  <option value="active">Actief</option>
                  <option value="contacted">Gecontacteerd</option>
                  <option value="converted">Geconverteerd</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leeftijd</label>
                <select
                  value={filters.ageRange}
                  onChange={(e) => setFilters({ ...filters, ageRange: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="all">Alles</option>
                  <option value="18-25">18-25</option>
                  <option value="26-35">26-35</option>
                  <option value="36-50">36-50</option>
                  <option value="51-65">51-65</option>
                  <option value="65+">65+</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#8B7355] mx-auto mb-4" />
              <p className="text-gray-500">Leads laden...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Geen leads gevonden</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === filteredLeads.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Naam</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Gender</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bron</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Datum</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          selectedLeads.includes(lead.id) ? 'bg-[#fdf8f3]' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => toggleSelectLead(lead.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {lead.firstname} {lead.lastname}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">{lead.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {lead.gender === 'male' ? '👨 Man' : lead.gender === 'female' ? '👩 Vrouw' : '-'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{lead.source}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-500">
                            {lead.imported_at ? new Date(lead.imported_at).toLocaleDateString('nl-NL') : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {lead.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingLead(lead);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Toont {(currentPage - 1) * leadsPerPage + 1} tot {Math.min(currentPage * leadsPerPage, totalLeads)} van {totalLeads} leads
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Vorige
                    </Button>
                    <span className="text-sm text-gray-600">
                      Pagina {currentPage} van {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Volgende
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Edit Modal */}
      {showEditModal && editingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Lead Bewerken</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Bewerk lead informatie en voeg tags toe
              </p>
              
              {/* Edit form would go here */}
              <div className="text-center py-8 text-gray-500">
                <Edit2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Edit functionaliteit komt binnenkort...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagementPage;
