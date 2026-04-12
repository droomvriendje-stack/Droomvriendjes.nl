import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { API_URL } from '../api/client';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft, 
  Tag, 
  Percent, 
  Euro, 
  Truck,
  Check,
  X,
  Calendar,
  Hash,
  Search
} from 'lucide-react';


const AdminDiscountCodesPage = () => {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '0',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    active: true,
    description: ''
  });

  // Fetch discount codes
  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/discount-codes`);
      if (!response.ok) throw new Error('Failed to fetch discount codes');
      const data = await response.json();
      setDiscountCodes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        discount_value: parseFloat(formData.discount_value) || 0,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      };

      const url = editingCode 
        ? `${API_URL}/api/discount-codes/${editingCode.id}`
        : `${API_URL}/api/discount-codes`;
      
      const method = editingCode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save discount code');
      }

      await fetchDiscountCodes();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle delete
  const handleDelete = async (codeId) => {
    if (!window.confirm('Weet je zeker dat je deze kortingscode wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/discount-codes/${codeId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete discount code');
      
      await fetchDiscountCodes();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle edit
  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      min_order_amount: code.min_order_amount.toString(),
      max_uses: code.max_uses?.toString() || '',
      valid_from: code.valid_from ? code.valid_from.split('T')[0] : '',
      valid_until: code.valid_until ? code.valid_until.split('T')[0] : '',
      active: code.active,
      description: code.description || ''
    });
    setShowModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '0',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      active: true,
      description: ''
    });
  };

  // Toggle active status
  const toggleActive = async (code) => {
    try {
      const response = await fetch(`${API_URL}/api/discount-codes/${code.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !code.active })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      await fetchDiscountCodes();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter codes
  const filteredCodes = discountCodes.filter(code => 
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.description && code.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get discount type icon and label
  const getTypeInfo = (type) => {
    switch (type) {
      case 'percentage':
        return { icon: Percent, label: 'Percentage', color: 'bg-blue-100 text-blue-700' };
      case 'fixed':
        return { icon: Euro, label: 'Vast bedrag', color: 'bg-green-100 text-green-700' };
      case 'free_shipping':
        return { icon: Truck, label: 'Gratis verzending', color: 'bg-purple-100 text-purple-700' };
      default:
        return { icon: Tag, label: type, color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kortingscodes</h1>
                <p className="text-sm text-gray-500">Beheer kortingscodes voor je webshop</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-[#8B7355] hover:bg-[#6d5a45]"
              data-testid="add-discount-code-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Code
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Zoek kortingscodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-discount-codes"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f5efe8] rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-[#8B7355]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{discountCodes.length}</p>
                <p className="text-sm text-gray-500">Totaal codes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {discountCodes.filter(c => c.active).length}
                </p>
                <p className="text-sm text-gray-500">Actief</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {discountCodes.filter(c => c.discount_type === 'percentage').length}
                </p>
                <p className="text-sm text-gray-500">Percentage</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {discountCodes.reduce((acc, c) => acc + (c.current_uses || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Totaal gebruikt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Discount Codes Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355] mx-auto"></div>
            <p className="mt-4 text-gray-500">Laden...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchDiscountCodes} variant="outline" className="mt-4">
              Opnieuw proberen
            </Button>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Geen kortingscodes gevonden' : 'Nog geen kortingscodes aangemaakt'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowModal(true)} 
                className="mt-4 bg-[#8B7355] hover:bg-[#6d5a45]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Maak je eerste code
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full" data-testid="discount-codes-table">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Waarde</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Min. bedrag</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Gebruik</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCodes.map((code) => {
                  const typeInfo = getTypeInfo(code.discount_type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <tr key={code.id} className="hover:bg-gray-50" data-testid={`discount-code-row-${code.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {code.code}
                          </span>
                          {code.description && (
                            <p className="text-xs text-gray-500 mt-1">{code.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {code.discount_type === 'percentage' && `${code.discount_value}%`}
                        {code.discount_type === 'fixed' && `€${code.discount_value.toFixed(2)}`}
                        {code.discount_type === 'free_shipping' && '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        €{code.min_order_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{code.current_uses || 0}</span>
                        <span className="text-gray-500">
                          {code.max_uses ? ` / ${code.max_uses}` : ' / ∞'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(code)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            code.active 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {code.active ? (
                            <>
                              <Check className="w-3 h-3" />
                              Actief
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              Inactief
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(code)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            data-testid={`edit-code-${code.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            data-testid={`delete-code-${code.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" data-testid="discount-code-modal">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCode ? 'Kortingscode Bewerken' : 'Nieuwe Kortingscode'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingCode ? 'Pas de kortingscode aan' : 'Maak een nieuwe kortingscode aan'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="bijv. ZOMER25"
                  required
                  className="uppercase"
                  data-testid="input-code"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type korting *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'percentage', label: 'Percentage', icon: Percent },
                    { value: 'fixed', label: 'Vast bedrag', icon: Euro },
                    { value: 'free_shipping', label: 'Gratis verzending', icon: Truck }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_type: type.value })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        formData.discount_type === type.value
                          ? 'border-[#8B7355] bg-[#f5efe8]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 ${formData.discount_type === type.value ? 'text-[#8B7355]' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${formData.discount_type === type.value ? 'text-[#8B7355]' : 'text-gray-600'}`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              {formData.discount_type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Bedrag (€)'} *
                  </label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? 'bijv. 10' : 'bijv. 5.00'}
                    required
                    min="0"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    data-testid="input-discount-value"
                  />
                </div>
              )}

              {/* Min Order Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimaal bestelbedrag (€)
                </label>
                <Input
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  data-testid="input-min-order"
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max. aantal keer te gebruiken
                </label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Onbeperkt"
                  min="1"
                  data-testid="input-max-uses"
                />
                <p className="text-xs text-gray-500 mt-1">Laat leeg voor onbeperkt gebruik</p>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geldig vanaf
                  </label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    data-testid="input-valid-from"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geldig tot
                  </label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    data-testid="input-valid-until"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschrijving (intern)
                </label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="bijv. Zomer campagne 2026"
                  data-testid="input-description"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.active ? 'bg-[#8B7355]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.active ? 'left-7' : 'left-1'
                  }`} />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {formData.active ? 'Actief' : 'Inactief'}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#8B7355] hover:bg-[#6d5a45]"
                  data-testid="save-discount-code-btn"
                >
                  {editingCode ? 'Opslaan' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountCodesPage;
