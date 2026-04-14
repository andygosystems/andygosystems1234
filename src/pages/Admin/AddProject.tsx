import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Loader2, Calendar, FileText, Video, Link } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const AddProject = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addProject, updateProject, getProjectById } = useProject();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [brochure, setBrochure] = useState<File | null>(null);
  const [brochureName, setBrochureName] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoUploading, setVideoUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    estimatedCompletion: '',
    startDate: new Date().toISOString().split('T')[0],
    progress: 0,
    autoProgress: false,
    status: 'Planning',
    videoUrl: ''
  });

  useEffect(() => {
    if (isEditMode && id) {
      const project = getProjectById(id);
      if (project) {
        setFormData({
          title: project.title,
          location: project.location,
          description: project.description,
          estimatedCompletion: project.estimatedCompletion,
          startDate: project.startDate || new Date().toISOString().split('T')[0],
          progress: project.progress,
          autoProgress: project.autoProgress,
          status: project.status || 'Planning',
          videoUrl: (project as any).videoUrl || (project as any).video_url || ''
        });
        setPreviews(project.images);
        if (project.brochureUrl) {
            setBrochureName('Current Brochure.pdf');
        }
        const vurl = (project as any).videoUrl || (project as any).video_url;
        if (vurl) {
            setVideoPreview(vurl);
        }
      }
    }
  }, [id, isEditMode, getProjectById]);

  // Calculate auto progress whenever dates change
  useEffect(() => {
    if (formData.autoProgress) {
        calculateAutoProgress();
    }
  }, [formData.startDate, formData.estimatedCompletion, formData.autoProgress]);

  const calculateAutoProgress = () => {
    if (!formData.startDate || !formData.estimatedCompletion) return;

    const start = new Date(formData.startDate).getTime();
    const end = new Date(formData.estimatedCompletion).getTime();
    const now = new Date().getTime();

    if (now >= end) {
        setFormData(prev => ({ ...prev, progress: 100 }));
        return;
    }
    
    if (now <= start) {
        setFormData(prev => ({ ...prev, progress: 0 }));
        return;
    }

    const totalDuration = end - start;
    const elapsed = now - start;
    const newProgress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
    
    setFormData(prev => ({ ...prev, progress: newProgress }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      // Blob URLs for local preview only — actual upload happens on submit
      const blobUrls = newFiles.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...blobUrls]);
    }
  };

  const handleBrochureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setBrochure(file);
          setBrochureName(file.name);
      }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, videoUrl: '' }));
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
    setVideoPreview('');
    setFormData(prev => ({ ...prev, videoUrl: '' }));
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const url = previews[index];
    if (url?.startsWith('blob:')) {
      // Find which position this blob is among blob-only previews, then drop that File
      const blobIndex = previews.slice(0, index + 1).filter(u => u.startsWith('blob:')).length - 1;
      setImages(prev => prev.filter((_, i) => i !== blobIndex));
      URL.revokeObjectURL(url);
    }
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // --- Upload new images to Supabase Storage ---
      const existingUrls = previews.filter(u => !u.startsWith('blob:'));
      const uploadedUrls: string[] = [];
      const failedUploads: string[] = [];

      if (images.length > 0) {
        setUploading(true);
        for (const file of images) {
          try {
            const { url } = await api.uploadImage(file);
            uploadedUrls.push(url);
          } catch (uploadErr: any) {
            failedUploads.push(`${file.name}: ${uploadErr?.message || 'upload failed'}`);
          }
        }
        setUploading(false);
      }

      if (failedUploads.length > 0) {
        setStatus({ type: 'error', message: `Image upload failed: ${failedUploads.join('; ')}` });
        setLoading(false);
        return;
      }

      // --- Upload video if a file was selected ---
      let finalVideoUrl = formData.videoUrl || '';
      if (videoFile) {
        try {
          setVideoUploading(true);
          const { url } = await api.uploadVideo(videoFile);
          finalVideoUrl = url;
        } catch (videoErr: any) {
          setStatus({ type: 'error', message: `Video upload failed: ${videoErr?.message || 'unknown error'}` });
          setLoading(false);
          return;
        } finally {
          setVideoUploading(false);
        }
      }

      // --- Upload brochure PDF to Supabase Storage ---
      let brochureUrl: string | undefined = isEditMode ? getProjectById(id!)?.brochureUrl : undefined;
      if (brochure) {
        try {
          const ext = brochure.name.split('.').pop()?.toLowerCase() || 'pdf';
          const fileName = `brochures/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: brochureErr } = await supabase.storage
            .from('property-images')
            .upload(fileName, brochure, { cacheControl: '3600', upsert: false });
          if (brochureErr) throw new Error(brochureErr.message);
          const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(fileName);
          brochureUrl = publicUrl;
        } catch (brochureUploadErr: any) {
          setStatus({ type: 'error', message: `Brochure upload failed: ${brochureUploadErr?.message}` });
          setLoading(false);
          return;
        }
      }

      const projectData = {
        title: formData.title,
        location: formData.location,
        description: formData.description,
        estimatedCompletion: formData.estimatedCompletion,
        startDate: formData.startDate,
        progress: Number(formData.progress),
        autoProgress: formData.autoProgress,
        status: formData.status as any,
        images: [...existingUrls, ...uploadedUrls],
        brochureUrl,
        videoUrl: finalVideoUrl || undefined
      };

      if (isEditMode && id) {
        await updateProject(id, projectData);
        setStatus({ type: 'success', message: 'Project updated successfully!' });
      } else {
        await addProject(projectData);
        setStatus({ type: 'success', message: 'Project added successfully!' });
      }

      setTimeout(() => navigate('/admin/projects'), 1200);
    } catch (error: any) {
      console.error('Error saving project:', error);
      const msg = error?.message || error?.error_description || JSON.stringify(error);
      setStatus({ type: 'error', message: `Failed to save project: ${msg}` });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {isEditMode ? 'Edit Project' : 'Add New Project'}
        </h1>
        <button
          onClick={() => navigate('/admin/projects')}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div className="bg-card rounded-sm shadow-sm border border-border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Project Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground"
                placeholder="e.g. The Pinnacle Towers"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground"
                placeholder="City, Area"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Description</label>
            <textarea
              rows={6}
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground"
              placeholder="Detailed description of the project..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Est. Completion</label>
              <input
                type="date"
                required
                value={formData.estimatedCompletion}
                onChange={e => setFormData({...formData, estimatedCompletion: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Current Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground"
              >
                <option value="Planning">Planning</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Progress Section */}
          <div className="p-4 bg-muted/30 rounded-sm border border-border">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Progress Control
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoProgress}
                  onChange={e => setFormData({...formData, autoProgress: e.target.checked})}
                  className="w-4 h-4 text-primary rounded-sm border-input focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">Auto-calculate based on dates</span>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Completion Percentage</span>
                <span className="font-bold text-primary">{formData.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                disabled={formData.autoProgress}
                onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
                className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.autoProgress 
                  ? "Progress is automatically calculated based on Start Date and Estimated Completion Date." 
                  : "Manually adjust the progress slider."}
              </p>
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Project Video</label>
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <Link className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={e => {
                    setFormData({ ...formData, videoUrl: e.target.value });
                    setVideoPreview(e.target.value);
                    setVideoFile(null);
                  }}
                  placeholder="Paste YouTube, Vimeo, or direct MP4 URL..."
                  className="flex-1 bg-input border border-input p-3 rounded-sm focus:outline-none focus:border-primary focus:bg-card transition-colors text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground uppercase">or upload file</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="border-2 border-dashed border-border rounded-sm p-6 text-center hover:bg-muted transition-colors relative">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/mov,video/avi"
                  onChange={handleVideoFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Click to upload a video file (MP4, WebM)</p>
                <p className="text-xs text-muted-foreground mt-1">Max recommended: 100MB</p>
              </div>
              {videoPreview && (
                <div className="relative bg-black rounded-sm overflow-hidden">
                  {videoPreview.includes('youtube') || videoPreview.includes('youtu.be') || videoPreview.includes('vimeo') ? (
                    <div className="aspect-video flex items-center justify-center bg-muted">
                      <p className="text-sm text-muted-foreground">External video linked: <a href={videoPreview} target="_blank" rel="noreferrer" className="text-primary underline">{videoPreview.slice(0, 60)}...</a></p>
                    </div>
                  ) : (
                    <video src={videoPreview} controls className="w-full aspect-video" />
                  )}
                  <button type="button" onClick={removeVideo} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Brochure Upload */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Brochure (PDF)</label>
            <div className="flex items-center gap-4">
               <div className="relative flex-1">
                 <input
                   type="file"
                   accept=".pdf"
                   onChange={handleBrochureChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="w-full bg-input border border-input p-3 rounded-sm flex items-center justify-between text-foreground">
                   <span className="text-sm truncate">{brochureName || 'No file selected'}</span>
                   <Upload className="w-4 h-4 text-muted-foreground" />
                 </div>
               </div>
               {brochureName && (
                   <button
                     type="button"
                     onClick={() => { setBrochure(null); setBrochureName(''); }}
                     className="p-3 text-destructive hover:bg-destructive/10 rounded-sm"
                   >
                     <X className="w-4 h-4" />
                   </button>
               )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Project Images</label>
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
        </div>

        <div className="pt-6 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-4 uppercase tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-shine"
          >
            {(loading || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'Uploading Images...' : loading ? 'Saving Project...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;
