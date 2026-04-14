import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Upload, X, Loader2, Video, Link, Plus } from 'lucide-react';
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
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const isEditMode = !!id;

  const [videoUploading, setVideoUploading] = useState(false);

  interface VideoEntry { id: string; url: string; file?: File; preview: string; }
  const [videoEntries, setVideoEntries] = useState<VideoEntry[]>([]);

  const addVideoEntry = () =>
    setVideoEntries(prev => [...prev, { id: `v${Date.now()}`, url: '', preview: '' }]);

  const removeVideoEntry = (id: string) =>
    setVideoEntries(prev => {
      const e = prev.find(v => v.id === id);
      if (e?.preview.startsWith('blob:')) URL.revokeObjectURL(e.preview);
      return prev.filter(v => v.id !== id);
    });

  const updateVideoEntryUrl = (id: string, url: string) =>
    setVideoEntries(prev => prev.map(v => v.id === id ? { ...v, url, file: undefined, preview: url } : v));

  const handleVideoFileForEntry = (id: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setVideoEntries(prev => prev.map(v => v.id === id ? { ...v, file, preview, url: '' } : v));
  };

  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [flags, setFlags] = useState<string[]>([]);
  const [flagInput, setFlagInput] = useState('');

  const addFlag = () => {
    const trimmed = flagInput.trim();
    if (trimmed && !flags.includes(trimmed)) {
      setFlags(prev => [...prev, trimmed]);
      setFlagInput('');
    }
  };

  const removeFlag = (idx: number) => setFlags(prev => prev.filter((_, i) => i !== idx));

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
          price: (property as any).price_on_request ? '' : (property.price ? String(property.price).replace(/[^0-9.]/g, '') : ''),
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
        setPriceOnRequest(!!(property as any).price_on_request);
        setFlags((property as any).flags || []);
        setPreviews(property.images);
        // Load existing videos
        const existingVideos: string[] = (property as any).video_urls?.length
          ? (property as any).video_urls
          : (property as any).video_url ? [(property as any).video_url] : [];
        setVideoEntries(existingVideos.map((url: string, i: number) => ({
          id: `v${i}${Date.now()}`, url, preview: url
        })));
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

    setStatus(null);
    try {
      // 1. Upload Images
      const existingUrls = previews.filter(url => !url.startsWith('blob:'));
      const newUploadedUrls: string[] = [];
      const failedUploads: string[] = [];

      // Upload new files — abort on failure, never store blob URLs
      for (const file of images) {
        try {
          setUploading(true);
          const { url } = await api.uploadImage(file);
          if (url) newUploadedUrls.push(url);
        } catch (uploadError: any) {
          const reason = uploadError?.message || 'unknown error';
          failedUploads.push(`${file.name}: ${reason}`);
        } finally {
          setUploading(false);
        }
      }

      if (failedUploads.length > 0) {
        setStatus({
          type: 'error',
          message: `Image upload failed for: ${failedUploads.join('; ')}. Check Supabase Storage bucket permissions and ensure the "property-images" bucket exists.`
        });
        setLoading(false);
        return;
      }

      const finalImages = [...existingUrls, ...newUploadedUrls];

      // 2. Upload video files and collect final URLs
      const finalVideoUrls: string[] = [];
      if (videoEntries.length > 0) {
        setVideoUploading(true);
        for (const entry of videoEntries) {
          if (entry.file) {
            try {
              const { url } = await api.uploadVideo(entry.file);
              finalVideoUrls.push(url);
            } catch (videoErr: any) {
              setStatus({ type: 'error', message: `Video upload failed: ${videoErr?.message || 'unknown error'}` });
              setLoading(false);
              setVideoUploading(false);
              return;
            }
          } else if (entry.url) {
            finalVideoUrls.push(entry.url);
          }
        }
        setVideoUploading(false);
      }

      // 3. Prepare Data
      const newProperty: any = {
        title: formData.title,
        description: formData.description,
        price: priceOnRequest ? 0 : (parseFloat(formData.price) || 0),
        price_on_request: priceOnRequest,
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
        status: formData.status as 'available' | 'sold' | 'rented',
        video_url: finalVideoUrls[0] || null,
        video_urls: finalVideoUrls,
        flags
      };

      // 3. Add or Update Context
      if (isEditMode && id) {
        await updateProperty(id, newProperty);
        setStatus({ type: 'success', message: 'Property updated successfully!' });
      } else {
        await addProperty(newProperty);
        setStatus({ type: 'success', message: 'Property added successfully!' });
      }

      setTimeout(() => navigate('/admin/properties'), 1200);
    } catch (error: any) {
      console.error('Error saving property:', error);
      const msg = error?.message || error?.error_description || JSON.stringify(error);
      setStatus({ type: 'error', message: `Failed to save property: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-foreground mb-8">
        {isEditMode ? 'Edit Property' : 'Add New Property'}
      </h1>

      {status && (
        <div className={`mb-6 p-4 rounded-sm border text-sm font-medium flex items-start justify-between gap-4 ${
          status.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-600'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <span>{status.message}</span>
          <button type="button" onClick={() => setStatus(null)} className="shrink-0 font-bold opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Price</label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={priceOnRequest}
                  onChange={e => setPriceOnRequest(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-xs font-semibold text-muted-foreground">Available upon request</span>
              </label>
            </div>
            {priceOnRequest ? (
              <div className="w-full bg-muted/40 border border-dashed border-border p-3 rounded-sm text-sm text-muted-foreground italic">
                Price will be shown as "Available upon request"
              </div>
            ) : (
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
                  required={!priceOnRequest}
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-input border border-input p-3 rounded-r-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground"
                  placeholder="0.00"
                />
              </div>
            )}
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

        {/* Flags / Badges */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
            Property Flags <span className="normal-case font-normal text-muted-foreground">(badges shown on card)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={flagInput}
              onChange={e => setFlagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFlag(); } }}
              placeholder="e.g. On Show Today, New Listing, Price Reduced..."
              className="flex-1 bg-input border border-input p-3 rounded-sm text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={addFlag}
              disabled={!flagInput.trim()}
              className="px-4 bg-primary text-primary-foreground rounded-sm font-bold text-lg hover:bg-primary/90 disabled:opacity-30 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {flags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {flags.map((flag, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary text-xs font-bold px-3 py-1.5 rounded-sm">
                  {flag}
                  <button type="button" onClick={() => removeFlag(idx)} className="hover:text-destructive transition-colors ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">No flags yet. Flags appear as coloured badges on the property card.</p>
          )}
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

        {/* Videos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-muted-foreground uppercase">Property Videos</label>
            <button
              type="button"
              onClick={addVideoEntry}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="w-3 h-3" /> Add Video
            </button>
          </div>

          {videoEntries.length === 0 ? (
            <button
              type="button"
              onClick={addVideoEntry}
              className="w-full border-2 border-dashed border-border rounded-sm p-6 text-center hover:bg-muted transition-colors"
            >
              <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Click to add a video</p>
              <p className="text-xs text-muted-foreground mt-1">Add multiple videos — paste URL or upload file</p>
            </button>
          ) : (
            <div className="space-y-4">
              {videoEntries.map((entry, idx) => (
                <div key={entry.id} className="border border-border rounded-sm p-4 space-y-3 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Video {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeVideoEntry(entry.id)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Link className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="url"
                      value={entry.url}
                      onChange={e => updateVideoEntryUrl(entry.id, e.target.value)}
                      placeholder="Paste YouTube, Vimeo, or MP4 URL..."
                      className="flex-1 bg-input border border-input p-2 rounded-sm text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground uppercase">or upload file</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-sm p-3 hover:bg-muted cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/mov,video/avi"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFileForEntry(entry.id, f); }}
                    />
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {entry.file ? entry.file.name : 'Choose video file (MP4, WebM)'}
                    </span>
                  </label>

                  {entry.preview && (
                    <div className="rounded-sm overflow-hidden bg-black">
                      {/youtube|youtu\.be|vimeo/i.test(entry.preview) ? (
                        <div className="aspect-video flex items-center justify-center bg-muted p-3">
                          <p className="text-xs text-muted-foreground text-center break-all">
                            Linked: <a href={entry.preview} target="_blank" rel="noreferrer" className="text-primary underline">{entry.preview.slice(0, 70)}</a>
                          </p>
                        </div>
                      ) : (
                        <video src={entry.preview} controls className="w-full aspect-video" />
                      )}
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addVideoEntry}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-sm p-3 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Another Video
              </button>
            </div>
          )}
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
            {(loading || videoUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {videoUploading ? 'Uploading Video...' : loading ? (isEditMode ? 'Updating Property...' : 'Adding Property...') : (isEditMode ? 'Update Property' : 'Add Property')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProperty;
