import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Upload, X, Loader2 } from 'lucide-react';
import { useProperty } from '../../context/PropertyContext';
import { Property } from '../../data/properties';

const AddProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addProperty, updateProperty, getPropertyById } = useProperty();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'KES',
    location: '',
    type: 'Sale',
    status: 'available',
    beds: '',
    baths: '',
    sqft: '',
    lat: '',
    lng: '',
    amenities: ''
  });

  useEffect(() => {
    if (isEditMode && id) {
      const property = getPropertyById(id);
      if (property) {
        setFormData({
          title: property.title || '',
          description: property.description || '',
          price: property.price ? property.price.toString() : '',
          currency: 'KES',
          location: property.location || '',
          type: property.type || 'Sale',
          status: property.status || 'available',
          beds: (property.beds ?? (property as any).bedrooms ?? 0).toString(),
          baths: (property.baths ?? (property as any).bathrooms ?? 0).toString(),
          sqft: (property.sqft ?? (property as any).sqm ?? 0).toString(),
          lat: property.coords ? (property.coords[0] ?? '').toString() : ((property as any).lat ?? '').toString(),
          lng: property.coords ? (property.coords[1] ?? '').toString() : ((property as any).lng ?? '').toString(),
          amenities: property.amenities ? property.amenities.join(', ') : ''
        });
        setPreviews(property.images);
      }
    }
  }, [id, isEditMode, getPropertyById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload Images
      const existingUrls = previews.filter(url => !url.startsWith('blob:'));
      const newUploadedUrls: string[] = [];

      // Upload new files
      for (const file of images) {
        try {
           const { url } = await api.uploadImage(file);
           if (url) newUploadedUrls.push(url);
        } catch (uploadError) {
           console.error("Failed to upload image:", uploadError);
           // Fallback to blob if upload fails (local only)
           newUploadedUrls.push(URL.createObjectURL(file));
        }
      }

      const finalImages = [...existingUrls, ...newUploadedUrls];

      // 2. Prepare Data
      const newProperty: any = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency || 'KES',
        location: formData.location,
        type: formData.type as 'Sale' | 'Rent',
        bedrooms: parseInt(formData.beds) || 0,
        bathrooms: parseInt(formData.baths) || 0,
        sqm: parseInt(formData.sqft) || 0,
        lat: parseFloat(formData.lat) || null,
        lng: parseFloat(formData.lng) || null,
        images: finalImages,
        amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
        status: formData.status as 'available' | 'sold' | 'rented'
      };

      // 3. Add or Update Context
      if (isEditMode && id) {
        await updateProperty(id, newProperty);
        alert('Property updated successfully!');
      } else {
        await addProperty(newProperty);
        alert('Property added successfully!');
      }
      
      navigate('/admin/properties');
    } catch (error: any) {
      console.error('Error saving property:', error);
      alert('Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-foreground mb-8">
        {isEditMode ? 'Edit Property' : 'Add New Property'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-card p-8 rounded-sm shadow-sm border border-border space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            Basic Information
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Title</label>
            <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder="e.g. Luxury Villa in Kilifi"
              />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Price</label>
            <div className="flex">
              <select
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value})}
                className="bg-input border border-input border-r-0 p-3 rounded-l-sm focus:outline-none text-foreground"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
              <input
                type="number"
                required
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-r-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
            >
              <option value="Sale">For Sale</option>
              <option value="Rent">For Rent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Location</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
              placeholder="City, Area"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Latitude</label>
              <input
                type="text"
                value={formData.lat}
                onChange={e => setFormData({...formData, lat: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder="-1.2921"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Longitude</label>
              <input
                type="text"
                value={formData.lng}
                onChange={e => setFormData({...formData, lng: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
                placeholder="36.8219"
              />
            </div>
          </div>
        </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Beds</label>
            <input
              type="number"
              value={formData.beds}
              onChange={e => setFormData({...formData, beds: e.target.value})}
              className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Baths</label>
            <input
              type="number"
              value={formData.baths}
              onChange={e => setFormData({...formData, baths: e.target.value})}
              className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Sq Ft</label>
            <input
              type="number"
              value={formData.sqft}
              onChange={e => setFormData({...formData, sqft: e.target.value})}
              className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Amenities</label>
          <input
            type="text"
            value={formData.amenities}
            onChange={e => setFormData({...formData, amenities: e.target.value})}
            className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
            placeholder="Pool, Gym, Security (comma separated)"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
          ></textarea>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Images</label>
          <div className="border-2 border-dashed border-border rounded-sm p-8 text-center hover:bg-muted transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">Click or drag images here to upload</p>
          </div>
          
          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {previews.map((url, idx) => (
                <div key={idx} className="relative aspect-video bg-muted rounded-sm overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-4 uppercase tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-shine"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? (isEditMode ? 'Updating Property...' : 'Adding Property...') : (isEditMode ? 'Update Property' : 'Add Property')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProperty;
