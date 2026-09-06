import React, { useState, useEffect, useRef } from 'react';
import { eventsApi, photosApi } from '../api/client';
import { EventItem, PhotoItem } from '../types';
import { Lightbox } from '../components/Lightbox';
import { 
  Calendar, UploadCloud, Image as ImageIcon, Trash2, 
  AlertTriangle, Eye, ChevronRight 
} from 'lucide-react';

export const TeamDashboard: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.list();
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    } catch (err) {
      console.error('Failed to load assigned events', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const loadEventPhotos = async (eventId: string) => {
    try {
      const photosData = await photosApi.list(eventId);
      setPhotos(photosData);
    } catch (err) {
      console.error('Failed to load photos for assigned event', err);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      loadEventPhotos(selectedEvent.id);
    }
  }, [selectedEvent]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedEvent) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const fileArray = Array.from(files);
      const uploaded = await photosApi.upload(
        selectedEvent.id,
        fileArray,
        (pct) => setUploadProgress(pct)
      );
      setPhotos((prev) => [...uploaded, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Upload failed. Please ensure files are valid images.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMyPhoto = async (photoId: string) => {
    if (confirm('Delete this photo from your uploads?')) {
      try {
        await photosApi.delete(photoId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } catch (err) {
        alert('Could not delete photo.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header banner */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
          Photographer Upload Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload high-resolution event photographs. Photos will be reviewed and curated by the lead Admin.
        </p>

        {/* Security Rule Callout */}
        <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start sm:items-center space-x-2.5 sm:space-x-3 text-xs text-indigo-300">
          <AlertTriangle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-[11px] sm:text-xs">
            <strong>Role Permissions:</strong> You can upload and view your own submitted photos for assigned events. Only the Admin can publish galleries or manage other users' uploads.
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading assigned events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 p-8">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Events Assigned</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
            Your lead Admin has not assigned any events to your account yet. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Assigned Events Sidebar / Horizontal on mobile */}
          <div className="lg:col-span-1 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Assigned Events ({events.length})
            </h3>
            
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              {events.map((e) => {
                const isSelected = selectedEvent?.id === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className={`min-w-[200px] lg:min-w-0 w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-between flex-shrink-0 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs sm:text-sm font-bold truncate text-white">{e.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 sm:mt-1">
                        <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{e.date || 'TBD'}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Content & Upload Box */}
          <div className="lg:col-span-3 space-y-5 sm:space-y-6">
            {selectedEvent && (
              <>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">{selectedEvent.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        {selectedEvent.date && <span>📅 {selectedEvent.date}</span>}
                        {selectedEvent.location && <span>📍 {selectedEvent.location}</span>}
                      </div>
                    </div>

                    <div className="text-xs font-medium text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 w-fit">
                      My Uploads: <strong className="text-amber-400">{photos.length}</strong> photos
                    </div>
                  </div>

                  {/* Drag-and-Drop / Multi-Upload Area */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 sm:mt-6 border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-950/40 hover:bg-slate-950/70 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFiles(e.target.files)}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 group-hover:scale-110 transition-transform mx-auto mb-2 sm:mb-3" />
                    <h4 className="text-xs sm:text-sm font-semibold text-white">
                      {isUploading ? `Uploading photographs (${uploadProgress}%)...` : 'Tap or drag photos here to upload'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                      Supports multiple JPEG, PNG, WebP image files
                    </p>

                    {isUploading && (
                      <div className="w-full max-w-xs mx-auto mt-3 sm:mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* My Uploaded Photos Grid */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 sm:mb-4 flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>My Uploaded Photos ({photos.length})</span>
                  </h3>

                  {photos.length === 0 ? (
                    <div className="py-12 text-center border border-slate-800 rounded-2xl bg-slate-900/30 text-slate-500 text-xs">
                      You haven't uploaded any photographs for this event yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                      {photos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md"
                        >
                          <div
                            className="aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer"
                            onClick={() => setLightboxIndex(index)}
                          >
                            <img
                              src={photo.thumbnail_url || photo.url}
                              alt={photo.original_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          </div>

                          <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px]">
                            <span className="truncate text-slate-300 max-w-[90px] sm:max-w-[120px]">
                              {photo.original_name}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setLightboxIndex(index)}
                                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMyPhoto(photo.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </div>
  );
};
