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
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 z-10">
        <div className="flex items-center space-x-4">
          <span className="text-xs font-mono bg-white/10 text-white/80 px-2.5 py-1 rounded-md">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-sm font-medium text-white truncate max-w-md">
            {photo.original_name}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-110 z-20 backdrop-blur-sm"
            title="Previous Photo (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={photo.url}
          alt={photo.original_name}
          className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all"
        />

        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-110 z-20 backdrop-blur-sm"
            title="Next Photo (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="h-14 px-6 border-t border-white/10 flex items-center justify-center space-x-6 text-xs text-white/60">
        {photo.uploaded_by_name && (
          <div className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Captured by: <strong className="text-white">{photo.uploaded_by_name}</strong></span>
          </div>
        )}
        <div className="flex items-center space-x-1.5">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Size: {formatSize(photo.file_size)}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Added: {new Date(photo.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
