import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { API_URL } from '../api/client';
import { 
  ArrowLeft, 
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Type,
  List,
  Star,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Settings,
  Layers,
  FileText,
  Check,
  X,
  Upload,
  Link as LinkIcon,
  Camera,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Sparkles,
  Euro
} from 'lucide-react';


const AdminAdvancedProductEditor = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('media');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  
  // Image override data
  const [imageInfo, setImageInfo] = useState(null);
  const [mainImageOverride, setMainImageOverride] = useState('');
  const [galleryOverrides, setGalleryOverrides] = useState([]);
  
  // NEW: Specific image fields for admin control
  const [macroImage, setMacroImage] = useState('');
  const [dimensionsImage, setDimensionsImage] = useState('');
  
  // Editable product data
  const [editData, setEditData] = useState({
    images: [],
    sections: [],
    features: [],
    benefits: [],
    description: '',
    shortDescription: '',
    // NEW: Core product fields
    name: '',
    shortName: '',
    price: 0,
    originalPrice: 0,
    badge: '',
    inStock: true,
    rating: 4.5,
    reviews: 0,
    sku: '',
    ageRange: '',
    warranty: '',
    // NEW: Technical specs
    specs: {
      projection: '',
      audio: '',
      power: '',
      timer: '',
      tipText: ''
    },
    // NEW: Quick features (icons on product page)
    quickFeatures: []
  });

  // Drag & drop photo upload state
  const [isDragging, setIsDragging] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState('');
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const photoInputRef = useRef(null);

  // File input refs
  const mainImageInputRef = useRef(null);
  const macroImageInputRef = useRef(null);
  const dimensionsImageInputRef = useRef(null);
  const galleryImageInputRef = useRef(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(null);

  // Fetch product and image info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product data
        const productResponse = await fetch(`${API_URL}/api/products/${productId}/advanced`);
        if (productResponse.ok) {
          const data = await productResponse.json();
          setProduct(data);
          
          // Initialize edit data
          const seoKeywords = [
            "Droomvriendjes Slaapknuffel",
            "Knuffel met hartslag baby",
            "Witte ruis knuffel",
            "Slaaphulp baby",
            "Droomvriendjes Slimme Leeuw",
            "Zachte knuffel baarmoedergeluiden",
            "Baby slaapritueel knuffel",
            "Droomvriendjes Panda",
            "Interactieve knuffel baby",
            "Beste slaapknuffel 2026"
          ];
          
          const imagesWithAlt = (data.gallery || [data.image]).map((img, index) => {
            if (typeof img === 'string') {
              return {
                url: img,
                alt: seoKeywords[index % seoKeywords.length] || `${data.shortName || data.name} - Afbeelding ${index + 1}`,
                visible: true,
                order: index
              };
            }
            return {
              ...img,
              alt: img.alt || seoKeywords[index % seoKeywords.length],
              visible: img.visible !== undefined ? img.visible : true,
              order: img.order !== undefined ? img.order : index
            };
          });
          
          setEditData({
            images: imagesWithAlt,
            sections: data.customSections || getDefaultSections(data),
            features: (data.features || []).map((f, i) => ({ id: i, text: f, visible: true })),
            benefits: (data.benefits || []).map((b, i) => ({ id: i, text: b, visible: true })),
            description: data.description || '',
            shortDescription: data.shortDescription || '',
            // NEW: Initialize core product fields
            name: data.name || '',
            shortName: data.shortName || '',
            price: data.price || 0,
            originalPrice: data.originalPrice || 0,
            badge: data.badge || '',
            inStock: data.inStock !== false,
            rating: data.rating || 4.5,
            reviews: data.reviews || 0,
            sku: data.sku || data.itemId || '',
            ageRange: data.ageRange || 'Vanaf 0 maanden',
            warranty: data.warranty || '14 dagen geld-terug-garantie',
            // NEW: Technical specs
            specs: data.specs || {
              projection: '',
              audio: '',
              power: '',
              timer: '',
              tipText: ''
            },
            // NEW: Quick features (icons on product page)
            quickFeatures: data.quickFeatures || []
          });
          
          // Load specific image fields
          setMacroImage(data.macroImage || '');
          setDimensionsImage(data.dimensionsImage || '');
          
          // Load gallery photos for Photos tab
          const galleryData = data.gallery || [];
          setGalleryPhotos(galleryData);
        }
        
        // Fetch image override info
        const imageInfoResponse = await fetch(`${API_URL}/api/products/${productId}/image-info`);
        if (imageInfoResponse.ok) {
          const info = await imageInfoResponse.json();
          setImageInfo(info);
          setMainImageOverride(info.overrides.image || '');
          setGalleryOverrides(info.overrides.gallery || []);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [productId]);

  // Get default sections
  const getDefaultSections = (prod) => {
    return [
      { id: 'header', type: 'header', title: 'Product Header', visible: true, order: 0 },
      { id: 'price', type: 'price', title: 'Prijs Sectie', visible: true, order: 1 },
      { id: 'description', type: 'description', title: 'Beschrijving', visible: true, order: 2 },
      { id: 'benefits', type: 'benefits', title: 'Voordelen', visible: true, order: 3 },
      { id: 'features', type: 'features', title: 'Eigenschappen', visible: true, order: 4 },
      { id: 'reviews', type: 'reviews', title: 'Reviews', visible: true, order: 5 },
      { id: 'faq', type: 'faq', title: 'Veelgestelde Vragen', visible: true, order: 6 }
    ];
  };

  // Upload image file
  const uploadImage = async (file, imageType = 'gallery') => {
    setUploading(true);
    setUploadProgress('Bezig met uploaden...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', productId);
      formData.append('image_type', imageType);
      
      const response = await fetch(`${API_URL}/api/uploads/image`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload mislukt');
      }
      
      const result = await response.json();
      setUploadProgress('Upload succesvol!');
      setTimeout(() => setUploadProgress(null), 2000);
      
      return result.url;
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(`Fout: ${error.message}`);
      setTimeout(() => setUploadProgress(null), 3000);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle main image upload
  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'main');
    if (url) {
      setMainImageOverride(url);
      // Auto-save the override
      await saveImageOverride(url, null);
    }
  };

  // Handle macro image upload
  const handleMacroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'macro');
    if (url) {
      setMacroImage(url);
      // Auto-save to product
      await saveSpecificImage('macroImage', url);
    }
  };

  // Handle dimensions image upload
  const handleDimensionsImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'dimensions');
    if (url) {
      setDimensionsImage(url);
      // Auto-save to product
      await saveSpecificImage('dimensionsImage', url);
    }
  };

  // Save specific image field to product
  const saveSpecificImage = async (field, url) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/advanced`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: url })
      });
      
      if (response.ok) {
        setUploadProgress('Afbeelding opgeslagen!');
        setTimeout(() => setUploadProgress(null), 2000);
      }
    } catch (error) {
      console.error('Error saving specific image:', error);
    }
  };

  // Handle gallery image upload
  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || currentGalleryIndex === null) return;
    
    const url = await uploadImage(file, 'gallery');
    if (url) {
      const newOverrides = [...galleryOverrides];
      // Ensure array is long enough
      while (newOverrides.length <= currentGalleryIndex) {
        newOverrides.push(null);
      }
      newOverrides[currentGalleryIndex] = url;
      setGalleryOverrides(newOverrides);
      // Auto-save
      await saveImageOverride(null, newOverrides);
    }
    setCurrentGalleryIndex(null);
  };

  // Save image overrides to backend - use GET for CRA proxy compatibility
  const saveImageOverride = async (mainOverride, galleryOverridesList) => {
    try {
      // Build URL with query parameters
      const params = new URLSearchParams();
      
      if (mainOverride !== null) {
        params.set('image', mainOverride || '');
      }
      
      if (galleryOverridesList !== null) {
        // Convert array to comma-separated string, null becomes 'null'
        const galleryStr = galleryOverridesList
          .map(o => o || 'null')
          .join(',');
        params.set('gallery', galleryStr);
      }
      
      const response = await fetch(`${API_URL}/api/products/${productId}/set-image-override?${params.toString()}`);
      
      if (response.ok) {
        // Refresh image info
        const infoResponse = await fetch(`${API_URL}/api/products/${productId}/image-info`);
        if (infoResponse.ok) {
          const info = await infoResponse.json();
          setImageInfo(info);
        }
      } else {
        console.error('Failed to save override:', await response.text());
      }
    } catch (error) {
      console.error('Error saving override:', error);
    }
  };

  // Clear main image override
  const clearMainOverride = async () => {
    setMainImageOverride('');
    await saveImageOverride('', null);
  };

  // Clear gallery override at index
  const clearGalleryOverride = async (index) => {
    const newOverrides = [...galleryOverrides];
    newOverrides[index] = null;
    setGalleryOverrides(newOverrides);
    await saveImageOverride(null, newOverrides);
  };

  // Clear all overrides
  const clearAllOverrides = async () => {
    try {
      await fetch(`${API_URL}/api/products/${productId}/image-override`, {
        method: 'DELETE'
      });
      setMainImageOverride('');
      setGalleryOverrides([]);
      // Refresh image info
      const infoResponse = await fetch(`${API_URL}/api/products/${productId}/image-info`);
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        setImageInfo(info);
      }
    } catch (error) {
      console.error('Error clearing overrides:', error);
    }
  };

  // ============== PHOTO UPLOAD HANDLERS ==============
  const handlePhotoDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) await uploadPhotos(files);
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) await uploadPhotos(files);
    e.target.value = '';
  };

  const uploadPhotos = async (files) => {
    if (galleryPhotos.length + files.length > 10) {
      alert(`Maximaal 10 foto's. Je hebt er al ${galleryPhotos.length}.`);
      return;
    }
    setPhotoUploading(true);
    setPhotoUploadProgress(`${files.length} foto('s) uploaden...`);
    
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/photos`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Upload mislukt');
      }
      const result = await response.json();
      setPhotoUploadProgress(`${result.uploaded_count} foto('s) geüpload!`);
      
      // Refresh product data to get updated gallery
      const productResponse = await fetch(`${API_URL}/api/products/${productId}/advanced`);
      if (productResponse.ok) {
        const data = await productResponse.json();
        setGalleryPhotos(data.gallery || []);
        setProduct(data);
        setEditData(prev => ({
          ...prev,
          images: (data.gallery || []).map((img, i) => ({
            url: typeof img === 'string' ? img : img.url,
            alt: typeof img === 'string' ? '' : (img.alt || ''),
            visible: typeof img === 'string' ? true : (img.visible !== false),
            order: i
          }))
        }));
      }
      setTimeout(() => setPhotoUploadProgress(''), 3000);
    } catch (error) {
      console.error('Photo upload error:', error);
      setPhotoUploadProgress(`Fout: ${error.message}`);
      setTimeout(() => setPhotoUploadProgress(''), 4000);
    } finally {
      setPhotoUploading(false);
    }
  };

  const deletePhoto = async (index) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/photos/${index}`, { method: 'DELETE' });
      if (response.ok) {
        const newPhotos = [...galleryPhotos];
        newPhotos.splice(index, 1);
        setGalleryPhotos(newPhotos);
        setPhotoUploadProgress('Foto verwijderd');
        setTimeout(() => setPhotoUploadProgress(''), 2000);
      }
    } catch (error) {
      console.error('Delete photo error:', error);
    }
  };

  const movePhoto = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= galleryPhotos.length) return;
    const newPhotos = [...galleryPhotos];
    const [moved] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, moved);
    setGalleryPhotos(newPhotos);
    
    // Save new order
    try {
      await fetch(`${API_URL}/api/products/${productId}/photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indices: newPhotos.map((_, i) => {
          const originalIndex = galleryPhotos.indexOf(newPhotos[i]);
          return originalIndex >= 0 ? originalIndex : i;
        })})
      });
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };



  // Save all changes (existing functionality)
  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to advanced endpoint
      const advancedResponse = await fetch(`${API_URL}/api/products/${productId}/advanced`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery: editData.images,
          customSections: editData.sections,
          features: editData.features.filter(f => f.visible).map(f => f.text),
          benefits: editData.benefits.filter(b => b.visible).map(b => b.text),
          description: editData.description,
          shortDescription: editData.shortDescription,
          macroImage: macroImage,
          dimensionsImage: dimensionsImage
        })
      });
      
      const coreResponse = await fetch(`${API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          shortName: editData.shortName,
          price: parseFloat(editData.price),
          originalPrice: editData.originalPrice ? parseFloat(editData.originalPrice) : null,
          badge: editData.badge || null,
          inStock: editData.inStock,
          rating: parseFloat(editData.rating),
          reviews: parseInt(editData.reviews),
          sku: editData.sku,
          ageRange: editData.ageRange,
          warranty: editData.warranty,
          // NEW: Save technical specs
          specs: editData.specs,
          quickFeatures: editData.quickFeatures
        })
      });
      
      if (advancedResponse.ok && coreResponse.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Refresh product data
        const productResponse = await fetch(`${API_URL}/api/products/${productId}/advanced`);
        if (productResponse.ok) {
          const data = await productResponse.json();
          setProduct(data);
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Fout bij opslaan. Probeer het opnieuw.');
    }
    setSaving(false);
  };

  // Image handlers for legacy editing
  const addImage = () => {
    setEditData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '', visible: true, order: prev.images.length }]
    }));
  };

  const updateImage = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : img
      )
    }));
  };

  const removeImage = (index) => {
    setEditData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const moveImage = (index, direction) => {
    const newImages = [...editData.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newImages.length) {
      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
      setEditData(prev => ({ ...prev, images: newImages }));
    }
  };

  // Section handlers
  const toggleSectionVisibility = (sectionId) => {
    setEditData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      )
    }));
  };

  const moveSection = (index, direction) => {
    const newSections = [...editData.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newSections.length) {
      [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
      setEditData(prev => ({ ...prev, sections: newSections }));
    }
  };

  // Feature/Benefit handlers
  const addFeature = () => {
    setEditData(prev => ({
      ...prev,
      features: [...prev.features, { id: Date.now(), text: '', visible: true }]
    }));
  };

  const updateFeature = (id, text) => {
    setEditData(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, text } : f)
    }));
  };

  const toggleFeatureVisibility = (id) => {
    setEditData(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, visible: !f.visible } : f)
    }));
  };

  const removeFeature = (id) => {
    setEditData(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== id)
    }));
  };

  const addBenefit = () => {
    setEditData(prev => ({
      ...prev,
      benefits: [...prev.benefits, { id: Date.now(), text: '', visible: true }]
    }));
  };

  const updateBenefit = (id, text) => {
    setEditData(prev => ({
      ...prev,
      benefits: prev.benefits.map(b => b.id === id ? { ...b, text } : b)
    }));
  };

  const toggleBenefitVisibility = (id) => {
    setEditData(prev => ({
      ...prev,
      benefits: prev.benefits.map(b => b.id === id ? { ...b, visible: !b.visible } : b)
    }));
  };

  const removeBenefit = (id) => {
    setEditData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#8B7355]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product niet gevonden</p>
          <Link to="/admin/products">
            <Button variant="outline">Terug naar Producten</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="advanced-product-editor">
      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={mainImageInputRef}
        onChange={handleMainImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input 
        type="file" 
        ref={macroImageInputRef}
        onChange={handleMacroImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input 
        type="file" 
        ref={dimensionsImageInputRef}
        onChange={handleDimensionsImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input 
        type="file" 
        ref={galleryImageInputRef}
        onChange={handleGalleryImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Upload progress overlay */}
      {uploadProgress && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-lg border p-4 flex items-center gap-3">
          {uploading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-[#8B7355]" />
          ) : uploadProgress.includes('Fout') ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          <span className={uploading ? 'text-gray-700' : uploadProgress.includes('Fout') ? 'text-red-600' : 'text-green-600'}>
            {uploadProgress}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/products" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Geavanceerde Editor</h1>
                <p className="text-sm text-gray-500">{product.shortName || product.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to={`/product/${product.id}`} 
                target="_blank"
                className="text-sm text-[#8B7355] hover:underline flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Link>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#8B7355] hover:bg-[#6d5a45]"
                data-testid="save-btn"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saveSuccess ? 'Opgeslagen!' : 'Opslaan'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#8B7355]" />
                Editor Menu
              </h2>
              
              <nav className="space-y-1">
                {[
                  { id: 'details', label: 'Product Details', icon: Edit2, priority: true },
                  { id: 'photos', label: "Foto's Uploaden", icon: Upload, priority: true },
                  { id: 'media', label: 'Media Beheer', icon: Camera, badge: imageInfo?.has_overrides ? '●' : null },
                  { id: 'images', label: 'Afbeeldingen', icon: ImageIcon },
                  { id: 'sections', label: 'Secties', icon: Layers },
                  { id: 'content', label: 'Tekst Content', icon: FileText },
                  { id: 'features', label: 'Eigenschappen', icon: List },
                  { id: 'benefits', label: 'Voordelen', icon: Star },
                  { id: 'specs', label: 'Technische Specs', icon: Settings }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#8B7355] text-white'
                        : tab.priority 
                        ? 'text-[#8B7355] font-semibold hover:bg-[#fdf8f3] border border-[#8B7355]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="flex-1">{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-xs ${activeTab === tab.id ? 'text-green-300' : 'text-green-500'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Product Preview Card */}
              <div className="mt-6 p-4 bg-[#fdf8f3] rounded-xl">
                <img 
                  src={imageInfo?.active?.image || product.image} 
                  alt={product.shortName}
                  className="w-full h-32 object-contain rounded-lg mb-3"
                />
                <h3 className="font-semibold text-[#5a4a3a] text-sm">{product.shortName}</h3>
                <p className="text-[#8B7355] font-bold">€{product.price}</p>
                {imageInfo?.has_overrides && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                    <CheckCircle2 className="w-3 h-3" />
                    Override actief
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {/* NEW: Product Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-[#8B7355]" />
                    Basis Informatie
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Productnaam *
                      </label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Baby Slaapmaatje Leeuw - Projector Nachtlamp"
                        className="text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Korte Naam (voor kaarten)
                      </label>
                      <Input
                        value={editData.shortName}
                        onChange={(e) => setEditData(prev => ({ ...prev, shortName: e.target.value }))}
                        placeholder="Leeuw Projector"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU / Item ID
                      </label>
                      <Input
                        value={editData.sku}
                        onChange={(e) => setEditData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="KNUF_001"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Euro className="w-5 h-5 text-[#8B7355]" />
                    Prijzen
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verkoopprijs (€) *
                      </label>
                      <Input
                        type="number"
                        value={editData.price}
                        onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="49.95"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Originele Prijs (€) - optioneel
                      </label>
                      <Input
                        type="number"
                        value={editData.originalPrice || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, originalPrice: e.target.value }))}
                        placeholder="64.95"
                        step="0.01"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Voor doorgestreepte prijzen (korting tonen)</p>
                    </div>
                    
                    {editData.price && editData.originalPrice && editData.originalPrice > editData.price && (
                      <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          ✨ Korting: <strong>€{(editData.originalPrice - editData.price).toFixed(2)}</strong> 
                          {' '}({Math.round((1 - editData.price / editData.originalPrice) * 100)}% besparing)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Badge */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#8B7355]" />
                    Status & Badge
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Voorraad Status
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditData(prev => ({ ...prev, inStock: !prev.inStock }))}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            editData.inStock ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            editData.inStock ? 'left-8' : 'left-1'
                          }`} />
                        </button>
                        <span className={`text-sm font-medium ${editData.inStock ? 'text-green-700' : 'text-red-700'}`}>
                          {editData.inStock ? '✓ Op voorraad' : '✗ Uitverkocht'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Badge
                      </label>
                      <select
                        value={editData.badge}
                        onChange={(e) => setEditData(prev => ({ ...prev, badge: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                      >
                        <option value="">Geen badge</option>
                        <option value="BESTSELLER">BESTSELLER</option>
                        <option value="POPULAIR">POPULAIR</option>
                        <option value="NIEUW">NIEUW</option>
                        <option value="VOORDEELSET">VOORDEELSET</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reviews & Rating */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#8B7355]" />
                    Beoordelingen
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gemiddelde Rating (1-5)
                      </label>
                      <Input
                        type="number"
                        value={editData.rating}
                        onChange={(e) => setEditData(prev => ({ ...prev, rating: e.target.value }))}
                        min="1"
                        max="5"
                        step="0.1"
                      />
                      <div className="mt-2 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(editData.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-700">{editData.rating}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aantal Reviews
                      </label>
                      <Input
                        type="number"
                        value={editData.reviews}
                        onChange={(e) => setEditData(prev => ({ ...prev, reviews: e.target.value }))}
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Wordt getoond op de productkaart</p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#8B7355]" />
                    Aanvullende Informatie
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leeftijdsbereik
                      </label>
                      <Input
                        value={editData.ageRange}
                        onChange={(e) => setEditData(prev => ({ ...prev, ageRange: e.target.value }))}
                        placeholder="Vanaf 0 maanden"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Garantie
                      </label>
                      <Input
                        value={editData.warranty}
                        onChange={(e) => setEditData(prev => ({ ...prev, warranty: e.target.value }))}
                        placeholder="14 dagen geld-terug-garantie"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Vergeet niet je wijzigingen op te slaan
                      </p>
                      {saveSuccess && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Succesvol opgeslagen!
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#8B7355] hover:bg-[#6d5a45]"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Opslaan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Wijzigingen Opslaan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}


            {/* PHOTOS UPLOAD Tab - Drag & Drop */}
            {activeTab === 'photos' && (
              <div className="space-y-6" data-testid="photos-upload-tab">
                {/* Upload Area */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-[#8B7355]" />
                        Product Foto's
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Sleep foto's hierheen of klik om te uploaden. Max 10 foto's per product.
                      </p>
                    </div>
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-[#fdf8f3] text-[#8B7355]">
                      {galleryPhotos.length}/10 foto's
                    </span>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handlePhotoDrop}
                    onClick={() => !photoUploading && photoInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-[#8B7355] bg-[#fdf8f3] scale-[1.01]'
                        : 'border-gray-300 hover:border-[#8B7355] hover:bg-[#fdf8f3]/50'
                    } ${photoUploading ? 'opacity-60 pointer-events-none' : ''}`}
                    data-testid="photo-drop-zone"
                  >
                    <input
                      ref={photoInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    {photoUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-10 h-10 text-[#8B7355] animate-spin" />
                        <p className="text-[#8B7355] font-medium">{photoUploadProgress}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                          isDragging ? 'bg-[#8B7355] text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Upload className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            {isDragging ? 'Laat los om te uploaden' : 'Sleep foto\'s hierheen'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            of <span className="text-[#8B7355] font-medium underline">klik hier</span> om bestanden te kiezen
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">JPEG, PNG, WebP of GIF - max 10MB per bestand</p>
                      </div>
                    )}
                  </div>

                  {/* Upload status */}
                  {photoUploadProgress && !photoUploading && (
                    <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                      photoUploadProgress.includes('Fout') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {photoUploadProgress.includes('Fout') ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {photoUploadProgress}
                    </div>
                  )}
                </div>

                {/* Photo Grid */}
                {galleryPhotos.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Huidige foto's ({galleryPhotos.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {galleryPhotos.map((photo, index) => {
                        const photoUrl = typeof photo === 'string' ? photo : photo?.url;
                        const photoAlt = typeof photo === 'string' ? '' : (photo?.alt || '');
                        return (
                          <div
                            key={index}
                            className="group relative border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#8B7355] transition-colors"
                            data-testid={`photo-item-${index}`}
                          >
                            {/* Photo number badge */}
                            <div className="absolute top-2 left-2 z-10 w-7 h-7 bg-black/60 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            
                            {/* Move/Delete controls */}
                            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); movePhoto(index, index - 1); }}
                                disabled={index === 0}
                                className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white shadow-sm disabled:opacity-30"
                                title="Omhoog"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); movePhoto(index, index + 1); }}
                                disabled={index === galleryPhotos.length - 1}
                                className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white shadow-sm disabled:opacity-30"
                                title="Omlaag"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deletePhoto(index); }}
                                className="w-7 h-7 bg-red-500/90 rounded-lg flex items-center justify-center hover:bg-red-600 shadow-sm text-white"
                                title="Verwijderen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            {/* Photo */}
                            <div className="aspect-square bg-[#fdf8f3]">
                              <img
                                src={photoUrl}
                                alt={photoAlt || `Product foto ${index + 1}`}
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                            
                            {/* Photo info */}
                            <div className="p-2 bg-gray-50 text-xs text-gray-500 truncate">
                              {photoUrl?.includes('supabase') ? 'Supabase Storage' : 'Lokaal'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {galleryPhotos.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <Camera className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <h3 className="font-medium text-gray-600 mb-2">Nog geen foto's</h3>
                    <p className="text-sm text-gray-400">
                      Upload foto's via het sleepveld hierboven
                    </p>
                  </div>
                )}
              </div>
            )}


            {/* NEW: Media Management Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Info Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                    <Camera className="w-5 h-5" />
                    Productpagina Afbeeldingen Beheren
                  </h3>
                  <p className="text-amber-700 text-sm">
                    Hier kun je de <strong>drie belangrijkste afbeeldingen</strong> van de productpagina beheren. 
                    Upload of wijzig afbeeldingen die direct op de website worden getoond.
                  </p>
                </div>

                {/* THREE MAIN IMAGE FIELDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* 1. HOOFDAFBEELDING */}
                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-[#8B7355] rounded-lg flex items-center justify-center text-white font-bold text-sm">1</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Hoofdafbeelding</h3>
                        <p className="text-xs text-gray-500">Primaire productfoto</p>
                      </div>
                    </div>
                    
                    <div className="aspect-square bg-[#fdf8f3] rounded-xl overflow-hidden mb-4 border-2 border-dashed border-gray-200">
                      {(mainImageOverride || product.image) ? (
                        <img 
                          src={mainImageOverride || product.image}
                          alt="Hoofdafbeelding"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Camera className="w-12 h-12 mb-2" />
                          <span className="text-sm">Geen afbeelding</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => mainImageInputRef.current?.click()}
                        className="w-full bg-[#8B7355] hover:bg-[#6d5a45]"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {mainImageOverride ? 'Vervangen' : 'Uploaden'}
                      </Button>
                      {mainImageOverride && (
                        <Button 
                          onClick={clearMainOverride}
                          variant="outline"
                          className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                          size="sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Standaard herstellen
                        </Button>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <label className="text-xs text-gray-500 mb-1 block">Of URL invoeren:</label>
                      <Input
                        value={mainImageOverride}
                        onChange={(e) => setMainImageOverride(e.target.value)}
                        onBlur={() => mainImageOverride && saveImageOverride(mainImageOverride, null)}
                        placeholder="/products/..."
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* 2. SFEER/MACRO AFBEELDING */}
                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Sfeer/Detail</h3>
                        <p className="text-xs text-gray-500">Macro/close-up foto</p>
                      </div>
                    </div>
                    
                    <div className="aspect-square bg-[#fdf8f3] rounded-xl overflow-hidden mb-4 border-2 border-dashed border-gray-200">
                      {macroImage ? (
                        <img 
                          src={macroImage}
                          alt="Sfeer afbeelding"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Sparkles className="w-12 h-12 mb-2" />
                          <span className="text-sm">Geen afbeelding</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => macroImageInputRef.current?.click()}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {macroImage ? 'Vervangen' : 'Uploaden'}
                      </Button>
                      {macroImage && (
                        <Button 
                          onClick={() => { setMacroImage(''); saveSpecificImage('macroImage', ''); }}
                          variant="outline"
                          className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Verwijderen
                        </Button>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <label className="text-xs text-gray-500 mb-1 block">Of URL invoeren:</label>
                      <Input
                        value={macroImage}
                        onChange={(e) => setMacroImage(e.target.value)}
                        onBlur={() => macroImage && saveSpecificImage('macroImage', macroImage)}
                        placeholder="/products/.../Macro..."
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* 3. SPECIFICATIES/AFMETINGEN AFBEELDING */}
                  <div className="bg-white rounded-xl shadow-sm border p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">3</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Specificaties</h3>
                        <p className="text-xs text-gray-500">Afmetingen/info foto</p>
                      </div>
                    </div>
                    
                    <div className="aspect-square bg-[#fdf8f3] rounded-xl overflow-hidden mb-4 border-2 border-dashed border-gray-200">
                      {dimensionsImage ? (
                        <img 
                          src={dimensionsImage}
                          alt="Specificaties afbeelding"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Settings className="w-12 h-12 mb-2" />
                          <span className="text-sm">Geen afbeelding</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => dimensionsImageInputRef.current?.click()}
                        className="w-full bg-green-500 hover:bg-green-600"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {dimensionsImage ? 'Vervangen' : 'Uploaden'}
                      </Button>
                      {dimensionsImage && (
                        <Button 
                          onClick={() => { setDimensionsImage(''); saveSpecificImage('dimensionsImage', ''); }}
                          variant="outline"
                          className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Verwijderen
                        </Button>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <label className="text-xs text-gray-500 mb-1 block">Of URL invoeren:</label>
                      <Input
                        value={dimensionsImage}
                        onChange={(e) => setDimensionsImage(e.target.value)}
                        onBlur={() => dimensionsImage && saveSpecificImage('dimensionsImage', dimensionsImage)}
                        placeholder="/products/.../dimensions..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Gallery Images */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#8B7355]" />
                      Galerij Afbeeldingen (Overige)
                    </h2>
                    {galleryOverrides.some(o => o) && (
                      <Button 
                        onClick={clearAllOverrides}
                        variant="outline" 
                        size="sm"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Alle Overrides Wissen
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(imageInfo?.default?.gallery || []).map((defaultImg, index) => {
                      const override = galleryOverrides[index];
                      const activeImg = override || (typeof defaultImg === 'string' ? defaultImg : defaultImg?.url);
                      
                      return (
                        <div 
                          key={index}
                          className={`border-2 rounded-xl p-3 ${override ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">#{index + 1}</span>
                            {override ? (
                              <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">OVERRIDE</span>
                            ) : (
                              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">STANDAARD</span>
                            )}
                          </div>
                          
                          <div className="aspect-square bg-[#fdf8f3] rounded-lg overflow-hidden mb-2">
                            <img 
                              src={activeImg}
                              alt={`Galerij ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              onClick={() => {
                                setCurrentGalleryIndex(index);
                                galleryImageInputRef.current?.click();
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              {override ? 'Wijzig' : 'Override'}
                            </Button>
                            {override && (
                              <Button
                                onClick={() => clearGalleryOverride(index)}
                                variant="outline"
                                size="sm"
                                className="text-orange-500 border-orange-300 hover:bg-orange-50 px-2"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab (Legacy) */}
            {activeTab === 'images' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#8B7355]" />
                    Product Afbeeldingen (SEO)
                  </h2>
                  <Button onClick={addImage} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Afbeelding Toevoegen
                  </Button>
                </div>

                <div className="space-y-4">
                  {editData.images.map((image, index) => (
                    <div 
                      key={index}
                      className={`border rounded-xl overflow-hidden ${
                        !image.visible ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="text-gray-400 cursor-move">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="w-20 h-20 bg-[#fdf8f3] rounded-lg flex items-center justify-center overflow-hidden">
                          {image.url ? (
                            <img src={typeof image.url === 'string' ? image.url : image.url?.url} alt={image.alt || `Image ${index + 1}`} className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">Afbeelding URL</label>
                          <Input
                            value={typeof image.url === 'string' ? image.url : image.url?.url || ''}
                            onChange={(e) => updateImage(index, 'url', e.target.value)}
                            placeholder="/products/image.png of https://..."
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveImage(index, 'up')} disabled={index === 0} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => moveImage(index, 'down')} disabled={index === editData.images.length - 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateImage(index, 'visible', !image.visible)} className={`p-2 rounded-lg transition-colors ${image.visible ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                            {image.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button onClick={() => removeImage(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="px-4 pb-4 bg-blue-50/30 border-t">
                        <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1 mt-2">
                          <Star className="w-3 h-3 text-amber-500" />
                          SEO Alt-Text (voor Google Images)
                        </label>
                        <Input
                          value={image.alt || ''}
                          onChange={(e) => updateImage(index, 'alt', e.target.value)}
                          placeholder="Droomvriendjes Slaapknuffel - Beste slaapknuffel 2026"
                          className="text-sm bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">💡 Tip: Gebruik Nederlandse keywords voor betere vindbaarheid</p>
                      </div>
                    </div>
                  ))}

                  {editData.images.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nog geen afbeeldingen</p>
                      <Button onClick={addImage} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-1" />
                        Eerste Afbeelding Toevoegen
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#8B7355]" />
                  Pagina Secties
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Beheer de volgorde en zichtbaarheid van secties op de productpagina.
                </p>

                <div className="space-y-3">
                  {editData.sections.map((section, index) => (
                    <div 
                      key={section.id}
                      className={`flex items-center gap-4 p-4 border rounded-xl transition-colors ${
                        !section.visible ? 'bg-gray-50 opacity-60' : 'hover:border-[#8B7355]'
                      }`}
                    >
                      <div className="text-gray-400 cursor-move">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        <p className="text-xs text-gray-500">Type: {section.type}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => moveSection(index, 'down')} disabled={index === editData.sections.length - 1} className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleSectionVisibility(section.id)} className={`p-2 rounded-lg transition-colors ${section.visible ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                          {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#8B7355]" />
                    Tekst Content
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Korte Beschrijving</label>
                      <textarea
                        value={editData.shortDescription}
                        onChange={(e) => setEditData(prev => ({ ...prev, shortDescription: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] resize-none"
                        placeholder="Korte beschrijving voor in de productkaart..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Volledige Beschrijving</label>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        rows={6}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B7355] resize-none"
                        placeholder="Uitgebreide productbeschrijving..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <List className="w-5 h-5 text-[#8B7355]" />
                    Eigenschappen
                  </h2>
                  <Button onClick={addFeature} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Eigenschap Toevoegen
                  </Button>
                </div>
                <div className="space-y-3">
                  {editData.features.map((feature) => (
                    <div key={feature.id} className={`flex items-center gap-3 p-3 border rounded-lg ${!feature.visible ? 'bg-gray-50 opacity-60' : ''}`}>
                      <Input
                        value={feature.text}
                        onChange={(e) => updateFeature(feature.id, e.target.value)}
                        placeholder="Bijv. 60 verschillende melodieën"
                        className="flex-1"
                      />
                      <button onClick={() => toggleFeatureVisibility(feature.id)} className={`p-2 rounded-lg transition-colors ${feature.visible ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                        {feature.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => removeFeature(feature.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editData.features.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <List className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>Nog geen eigenschappen</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Benefits Tab */}
            {activeTab === 'benefits' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#8B7355]" />
                    Voordelen
                  </h2>
                  <Button onClick={addBenefit} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Voordeel Toevoegen
                  </Button>
                </div>
                <div className="space-y-3">
                  {editData.benefits.map((benefit) => (
                    <div key={benefit.id} className={`flex items-center gap-3 p-3 border rounded-lg ${!benefit.visible ? 'bg-gray-50 opacity-60' : ''}`}>
                      <Input
                        value={benefit.text}
                        onChange={(e) => updateBenefit(benefit.id, e.target.value)}
                        placeholder="Bijv. 🌟 Helpt bij beter slapen"
                        className="flex-1"
                      />
                      <button onClick={() => toggleBenefitVisibility(benefit.id)} className={`p-2 rounded-lg transition-colors ${benefit.visible ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                        {benefit.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => removeBenefit(benefit.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editData.benefits.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>Nog geen voordelen</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#8B7355]" />
                    Technische Specificaties
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Deze gegevens worden weergegeven in het "Technische Specificaties" blok op de productpagina
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Projectie / Licht
                    </label>
                    <Input
                      value={editData.specs?.projection || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        specs: { ...prev.specs, projection: e.target.value }
                      }))}
                      placeholder="Bijv. 3-in-1 (Sterren, Oceaan, Lamp)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audio Content
                    </label>
                    <Input
                      value={editData.specs?.audio || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        specs: { ...prev.specs, audio: e.target.value }
                      }))}
                      placeholder="Bijv. 10 Slaapliedjes + 5 White Noise"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voeding
                    </label>
                    <Input
                      value={editData.specs?.power || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        specs: { ...prev.specs, power: e.target.value }
                      }))}
                      placeholder="Bijv. USB-C Oplaadbaar (Kabel incl.)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timer
                    </label>
                    <Input
                      value={editData.specs?.timer || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        specs: { ...prev.specs, timer: e.target.value }
                      }))}
                      placeholder="Bijv. 30 minuten Auto-uit"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tip Tekst
                    </label>
                    <textarea
                      value={editData.specs?.tipText || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        specs: { ...prev.specs, tipText: e.target.value }
                      }))}
                      placeholder="Bijv. Oplaadbare batterijen zijn niet nodig, omdat deze Droomvriend volledig oplaadbaar is via USB-C..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Quick Features Section */}
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">Quick Features (Iconen)</h3>
                      <p className="text-sm text-gray-500">De kleine iconen die bovenaan de productpagina staan (bijv. AI Huilsensor, USB-C Oplaadbaar)</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditData(prev => ({
                        ...prev,
                        quickFeatures: [...(prev.quickFeatures || []), { icon: '🔌', label: '' }]
                      }))}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Toevoegen
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(editData.quickFeatures || []).map((qf, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Input
                          value={qf.icon || ''}
                          onChange={(e) => {
                            const newQF = [...editData.quickFeatures];
                            newQF[index] = { ...newQF[index], icon: e.target.value };
                            setEditData(prev => ({ ...prev, quickFeatures: newQF }));
                          }}
                          placeholder="🤖"
                          className="w-20"
                        />
                        <Input
                          value={qf.label || ''}
                          onChange={(e) => {
                            const newQF = [...editData.quickFeatures];
                            newQF[index] = { ...newQF[index], label: e.target.value };
                            setEditData(prev => ({ ...prev, quickFeatures: newQF }));
                          }}
                          placeholder="Bijv. AI Huilsensor"
                          className="flex-1"
                        />
                        <button 
                          onClick={() => {
                            const newQF = editData.quickFeatures.filter((_, i) => i !== index);
                            setEditData(prev => ({ ...prev, quickFeatures: newQF }));
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!editData.quickFeatures || editData.quickFeatures.length === 0) && (
                      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Geen quick features ingesteld</p>
                        <p className="text-xs text-gray-400 mt-1">Voeg iconen toe zoals 🤖 AI Huilsensor, 🔌 USB-C Oplaadbaar</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAdvancedProductEditor;
