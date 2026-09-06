import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { galleriesApi } from '../api/client';
import { PublicGalleryInfo, GalleryAccessData } from '../types';
import { Lightbox } from '../components/Lightbox';
import { 
  Lock, KeyRound, Download, Calendar, MapPin, Eye, 
  AlertCircle, Camera, Sparkles 
} from 'lucide-react';

export const CustomerGallery: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [galleryInfo, setGalleryInfo] = useState<PublicGalleryInfo | null>(null);
  const [accessData, setAccessData] = useState<GalleryAccessData | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const savedToken = sessionStorage.getItem(`gallery_token_${slug}`);
    const savedAccess = sessionStorage.getItem(`gallery_data_${slug}`);

    if (savedToken && savedAccess) {
      try {
        setAccessData(JSON.parse(savedAccess));
        setIsLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem(`gallery_token_${slug}`);
      }
    }

    galleriesApi
      .getPublicInfo(slug)
      .then((info) => {
        setGalleryInfo(info);
      })
      .catch((err) => {
        console.error('Gallery not found', err);
        setError('This photo gallery does not exist or has been unpublished by the photographer.');
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setError('');
    setIsVerifying(true);
    try {
      const data = await galleriesApi.verifyPin(slug, pin);
      setAccessData(data);
      sessionStorage.setItem(`gallery_token_${slug}`, data.gallery_token);
      sessionStorage.setItem(`gallery_data_${slug}`, JSON.stringify(data));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect PIN. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadAll = () => {
    if (!slug || !accessData) return;
    setIsDownloadingZip(true);
    const url = galleriesApi.getDownloadZipUrl(slug, accessData.gallery_token);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${slug}_gallery_photos.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingZip(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium tracking-wide uppercase">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // PIN Verification Screen
  if (!accessData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between py-12 px-4 select-none">
        <div className="max-w-md w-full mx-auto my-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-2xl shadow-amber-500/20 mb-4">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-amber-400" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {galleryInfo?.event_name || 'Protected Gallery'}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">
              This photo collection is private and protected by a PIN code.
            </p>

            {(galleryInfo?.event_date || galleryInfo?.event_location) && (
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mt-3">
                {galleryInfo.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {galleryInfo.event_date}
                  </span>
                )}
                {galleryInfo.event_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {galleryInfo.event_location}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {error && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 text-center mb-2 uppercase tracking-wider">
                  Enter 6-Digit Access PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    autoFocus
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full py-3.5 px-4 bg-slate-950/80 border-2 border-slate-700/80 focus:border-amber-400 rounded-2xl text-center text-2xl font-mono tracking-widest text-amber-400 font-bold focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  The PIN was provided to you by the event host or lead photographer.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying || pin.length < 4}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{isVerifying ? 'Verifying PIN...' : 'Unlock Gallery'}</span>
              </button>
            </form>

            <div className="mt-6 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                Demo PIN: <strong className="text-amber-400 font-mono">482917</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-600 mt-8">
          Powered by TrizenAI Photo Sharing Platform
        </div>
      </div>
    );
  }

  // Unlocked Gallery View
  const photos = accessData.photos || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Gallery Showcase Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Event Photo Gallery</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {accessData.event_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              {accessData.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {accessData.event_date}
                </span>
              )}
              {accessData.event_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {accessData.event_location}
                </span>
              )}
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {photos.length} Curated Photos
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingZip || photos.length === 0}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingZip ? 'Preparing Archive...' : 'Download All (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {photos.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No photographs published yet</h3>
            <p className="text-xs text-slate-500 mt-1">The photography team is curating the final album.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-slate-700 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.original_name}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="truncate font-medium">{photo.original_name}</span>
                    <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
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
