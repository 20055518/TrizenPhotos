import React, { useEffect } from 'react';
import { PhotoItem } from '../types';
import { X, ChevronLeft, ChevronRight, Download, Calendar, HardDrive, User } from 'lucide-react';

interface LightboxProps {
  photos: PhotoItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const photo = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  if (!photo) return null;

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.original_name || 'photo.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between border-b border-white/10 z-10">
        <div className="flex items-center space-x-2 sm:space-x-3 truncate mr-2">
          <span className="text-[11px] sm:text-xs font-mono bg-white/10 text-white/80 px-2 py-0.5 rounded-md flex-shrink-0">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[150px] sm:max-w-md">
            {photo.original_name}
          </span>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 z-20 backdrop-blur-sm cursor-pointer"
            title="Previous Photo"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        <img
          src={photo.url}
          alt={photo.original_name}
          className="max-h-[70vh] sm:max-h-[80vh] max-w-[95vw] sm:max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all"
        />

        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 z-20 backdrop-blur-sm cursor-pointer"
            title="Next Photo"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="min-h-12 py-2 px-3 sm:px-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-white/60">
        {photo.uploaded_by_name && (
          <div className="flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>By: <strong className="text-white">{photo.uploaded_by_name}</strong></span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>{formatSize(photo.file_size)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{new Date(photo.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
