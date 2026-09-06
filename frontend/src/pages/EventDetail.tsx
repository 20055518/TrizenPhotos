import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsApi, photosApi, galleriesApi } from '../api/client';
import { EventItem, PhotoItem } from '../types';
import { Lightbox } from '../components/Lightbox';
import { 
  Calendar, MapPin, ArrowLeft, Upload, Check, 
  Copy, ExternalLink, Globe, Lock, ShieldCheck, Eye, Trash2 
} from 'lucide-react';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'SELECTED' | 'UNSELECTED'>('ALL');
  
  // Selection state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [pin, setPin] = useState('482917');
  const [slug, setSlug] = useState('abc123');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      const [eventData, photosData] = await Promise.all([
        eventsApi.get(id),
        photosApi.list(id)
      ]);
      setEvent(eventData);
      setPhotos(photosData);
      if (eventData.gallery?.slug) {
        setSlug(eventData.gallery.slug);
      }
    } catch (err) {
      console.error('Error fetching event data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleSelection = async (photo: PhotoItem) => {
    const newStatus = !photo.is_selected_for_gallery;
    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, is_selected_for_gallery: newStatus } : p))
    );
    try {
      await photosApi.updateSelection([photo.id], newStatus);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              selected_photos: prev.selected_photos + (newStatus ? 1 : -1),
            }
          : null
      );
    } catch (err) {
      console.error('Failed to update photo selection', err);
      loadData();
    }
  };

  const handleBatchSelectAll = async (select: boolean) => {
    const targetPhotos = photos.filter((p) => p.is_selected_for_gallery !== select);
    if (targetPhotos.length === 0) return;

    const ids = targetPhotos.map((p) => p.id);
    setPhotos((prev) => prev.map((p) => ({ ...p, is_selected_for_gallery: select })));
    try {
      await photosApi.updateSelection(ids, select);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              selected_photos: select ? prev.total_photos : 0,
            }
          : null
      );
    } catch (err) {
      console.error('Failed to batch update', err);
      loadData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const fileArray = Array.from(files);
      const uploaded = await photosApi.upload(id, fileArray, (pct) => setUploadProgress(pct));
      setPhotos((prev) => [...uploaded, ...prev]);
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              total_photos: prev.total_photos + uploaded.length,
            }
          : null
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Upload failed. Please ensure files are valid images.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (confirm('Delete this photograph?')) {
      try {
        await photosApi.delete(photoId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                total_photos: Math.max(0, prev.total_photos - 1),
                selected_photos: prev.selected_photos - (photos.find((p) => p.id === photoId)?.is_selected_for_gallery ? 1 : 0),
              }
            : null
        );
      } catch (err) {
        alert('Failed to delete photo.');
      }
    }
  };

  const handlePublishGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsPublishing(true);
    try {
      await galleriesApi.publish(id, pin, slug);
      setPublishSuccess(true);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to publish gallery.');
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'link' | 'pin') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (filterMode === 'SELECTED') return p.is_selected_for_gallery;
    if (filterMode === 'UNSELECTED') return !p.is_selected_for_gallery;
    return true;
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading event workspace...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
        <p>Event not found or has been removed.</p>
        <Link to="/" className="text-indigo-400 mt-4 inline-block font-semibold">
          Back to Events
        </Link>
      </div>
    );
  }

  const galleryUrl = event.gallery?.slug
    ? `${window.location.origin}/gallery/${event.gallery.slug}`
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-400 hover:text-white mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Events</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl mb-6 sm:mb-8 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {event.name}
              </h1>
              {event.gallery?.is_published ? (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Live Gallery
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                  Draft
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 mt-2">
              {event.date && (
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{event.date}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-xs text-slate-400 mt-2 sm:mt-3 max-w-2xl">{event.description}</p>
            )}
          </div>

          {/* Operational Metrics Callout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-slate-950/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-0 divide-x-0 sm:divide-x divide-slate-800">
              <div className="px-3 sm:px-4 py-1 text-center">
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Uploaded
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{event.total_photos}</div>
              </div>

              <div className="px-3 sm:px-4 py-1 text-center">
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Selected
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                  {event.selected_photos}
                </div>
              </div>
            </div>

            <div className="flex items-center sm:pl-2">
              <button
                onClick={() => {
                  setPublishSuccess(false);
                  setIsPublishModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>{event.gallery?.is_published ? 'Configure Gallery & PIN' : 'Publish Gallery'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Published Gallery Shortcut Bar */}
        {event.gallery?.is_published && (
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-indigo-950/20 -mx-4 -mb-4 sm:-mx-8 sm:-mb-8 p-4 sm:p-6 rounded-b-2xl sm:rounded-b-3xl border-b border-indigo-500/20">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Client Gallery Active</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Slug: <span className="text-indigo-300 font-bold">{event.gallery.slug}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => copyToClipboard(galleryUrl, 'link')}
                className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <a
                href={`/gallery/${event.gallery.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open View</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Photo Toolbar & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
              filterMode === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({photos.length})
          </button>
          <button
            onClick={() => setFilterMode('SELECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
              filterMode === 'SELECTED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Selected ({event.selected_photos})
          </button>
          <button
            onClick={() => setFilterMode('UNSELECTED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
              filterMode === 'UNSELECTED'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Unselected ({photos.length - event.selected_photos})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleBatchSelectAll(true)}
            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer text-center"
          >
            Select All
          </button>
          <button
            onClick={() => handleBatchSelectAll(false)}
            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer text-center"
          >
            Deselect All
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? `Uploading (${uploadProgress}%)` : 'Upload Photos'}</span>
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl sm:rounded-3xl bg-slate-900/30 p-6">
          <p className="text-slate-400 text-xs sm:text-sm mb-3">No photos match the current filter.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Upload Photos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredPhotos.map((photo, index) => {
            const isSelected = photo.is_selected_for_gallery;
            return (
              <div
                key={photo.id}
                className={`group relative rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 bg-slate-900 ${
                  isSelected
                    ? 'border-emerald-500 shadow-md sm:shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Image Thumbnail */}
                <div
                  className="aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.original_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Selection Checkbox Overlay */}
                <button
                  type="button"
                  onClick={() => handleToggleSelection(photo)}
                  className={`absolute top-2 left-2 p-1.5 rounded-lg border transition-all cursor-pointer shadow-md ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : 'bg-black/60 border-white/20 text-white/50 hover:text-white'
                  }`}
                  title={isSelected ? 'Remove from Gallery' : 'Select for Gallery'}
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setLightboxIndex(index)}
                    className="p-1 sm:p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg border border-white/20 shadow-md backdrop-blur-sm cursor-pointer"
                    title="Preview Fullscreen"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-1 sm:p-1.5 bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 shadow-md backdrop-blur-sm cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Photo Card Footer */}
                <div className="p-2 sm:p-2.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="text-slate-300 font-medium truncate max-w-[90px] sm:max-w-[130px]">
                    {photo.original_name}
                  </span>
                  <span
                    className={`font-semibold px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isSelected ? 'In Gallery' : 'Excluded'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Viewer */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}

      {/* Gallery Publish Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Publish Customer Gallery</h2>
                <p className="text-xs text-slate-400">Generate secure PIN protected access</p>
              </div>
            </div>

            {publishSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-1.5" />
                  <h4 className="text-sm font-bold text-white">Gallery Published!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    {event.selected_photos} photos are now live and protected by your PIN.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Shareable URL
                    </span>
                    <div className="flex items-center justify-between mt-1 text-xs text-indigo-300 font-mono bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="truncate mr-2">{`${window.location.origin}/gallery/${slug}`}</span>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/gallery/${slug}`, 'link')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 font-sans cursor-pointer flex-shrink-0"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Access PIN
                    </span>
                    <div className="flex items-center justify-between mt-1 text-base sm:text-lg font-bold tracking-widest text-amber-400 font-mono bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span>{pin}</span>
                      <button
                        onClick={() => copyToClipboard(pin, 'pin')}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-sans font-normal tracking-normal cursor-pointer flex-shrink-0"
                      >
                        {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setIsPublishModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePublishGallery} className="space-y-3.5 sm:space-y-4">
                <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  Currently, <strong>{event.selected_photos}</strong> photos will be visible to clients.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Access PIN * (Required for client entry)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    minLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 482917"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-mono tracking-widest text-amber-400 text-center font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gallery URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 sm:px-3 py-2 bg-slate-800/80 border border-r-0 border-slate-700 rounded-l-xl text-xs text-slate-400 font-mono flex-shrink-0">
                      /gallery/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="abc123"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-r-xl text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-3.5 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishing || event.selected_photos === 0}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition-colors cursor-pointer"
                  >
                    {isPublishing ? 'Publishing...' : 'Save & Publish'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
