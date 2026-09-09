import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { galleriesApi, getAssetUrl } from '../api/client';
import { PublicGalleryInfo, GalleryAccessData } from '../types';
import { Lightbox } from '../components/Lightbox';
import { useTheme } from '../context/ThemeContext';
import { 
  Lock, KeyRound, Download, Calendar, MapPin, Eye, 
  AlertCircle, Camera, Sparkles, Sun, Moon 
} from 'lucide-react';

export const CustomerGallery: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { mode, toggleTheme } = useTheme();
  const [galleryInfo, setGalleryInfo] = useState<PublicGalleryInfo | null>(null);
  const [accessData, setAccessData] = useState<GalleryAccessData | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [pinShake, setPinShake] = useState(false);
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
      setPinShake(true);
      setTimeout(() => setPinShake(false), 600);
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

  // If gallery does not exist or was unpublished
  if (!galleryInfo && error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between py-8 sm:py-12 px-4 select-none">
        <div className="flex justify-end max-w-md w-full mx-auto">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400 animate-pulse" /> : <Moon className="w-4 h-4 text-amber-500" />}
          </button>
        </div>

        <div className="max-w-md w-full mx-auto my-auto animate-page-enter text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 p-3 mb-4 text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Gallery Not Found
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
            The gallery code <code className="text-amber-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">{slug}</code> does not exist or has not been published yet.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20 cursor-pointer"
          >
            Back to Home Portal
          </a>
        </div>

        <div className="text-center text-xs text-slate-600">
          Powered by TrizenPhotos
        </div>
      </div>
    );
  }

  // PIN Verification Screen
  if (!accessData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between py-8 sm:py-12 px-4 select-none">
        {/* Top bar with back to home and theme toggle */}
        <div className="flex justify-between items-center max-w-md w-full mx-auto">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            ← Home Portal
          </a>
          <button
            onClick={toggleTheme}
            title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} mood`}
            className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {mode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <Moon className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              {mode === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>

        <div className="max-w-md w-full mx-auto my-auto animate-page-enter">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-2xl shadow-amber-500/25 mb-3 sm:mb-4 animate-float animate-pulse-glow">
              <div className="w-full h-full bg-slate-950 rounded-[20px] sm:rounded-[22px] flex items-center justify-center">
                <KeyRound className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
              </div>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight px-2">
              {galleryInfo?.event_name || 'Protected Gallery'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-1.5 px-4">
              This photo collection is private and protected by a PIN code.
            </p>

            {(galleryInfo?.event_date || galleryInfo?.event_location) && (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-400 mt-2.5">
                {galleryInfo.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {galleryInfo.event_date}
                  </span>
                )}
                {galleryInfo.event_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {galleryInfo.event_location}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl ${pinShake ? 'animate-shake border-rose-500/40' : ''}`}>
            {error && (
              <div className="mb-4 sm:mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-300 text-xs animate-fade-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 text-center mb-2 uppercase tracking-wider">
                  Enter Access PIN
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
                    className="w-full py-3 sm:py-3.5 px-4 bg-slate-950/80 border-2 border-slate-700/80 focus:border-amber-400 rounded-xl sm:rounded-2xl text-center text-xl sm:text-2xl font-mono tracking-widest text-amber-400 font-bold focus:outline-none transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  The PIN was provided to you by the event host or lead photographer.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying || pin.length < 4}
                className="btn-press w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-40 text-slate-950 font-bold rounded-xl sm:rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-slate-950 font-bold" />
                <span>{isVerifying ? 'Verifying PIN...' : 'Unlock Gallery'}</span>
              </button>
            </form>

            <div className="mt-5 sm:mt-6 p-2.5 sm:p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">
                Demo PIN: <strong className="text-amber-400 font-mono">482917</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] sm:text-[11px] text-slate-600 mt-6">
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
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center space-x-1.5 text-indigo-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Official Event Photo Gallery</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white line-clamp-1">
              {accessData.event_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 mt-1">
              {accessData.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {accessData.event_date}
                </span>
              )}
              {accessData.event_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span className="max-w-[160px] sm:max-w-none truncate">{accessData.event_location}</span>
                </span>
              )}
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] sm:text-xs">
                {photos.length} Curated Photos
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} mood`}
              className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {mode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-[11px] font-semibold tracking-wider uppercase hidden sm:inline">
                {mode === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingZip || photos.length === 0}
              className="btn-press w-full sm:w-auto justify-center inline-flex items-center space-x-2 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950 font-bold" />
              <span>{isDownloadingZip ? 'Preparing Zip...' : 'Download All (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {photos.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No photographs published yet</h3>
            <p className="text-xs text-slate-500 mt-1">The photography team is curating the album.</p>
          </div>
        ) : (
          <div className="columns-1 xs:columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
            {photos.map((photo, index) => {
              const staggerClass = `stagger-${Math.min((index % 10) + 1, 10)}`;
              return (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className={`animate-photo-pop ${staggerClass} break-inside-avoid group relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer shadow-md hover:shadow-2xl hover:shadow-indigo-900/30 hover:-translate-y-0.5 transition-all duration-300`}
                >
                  <img
                    src={getAssetUrl(photo.thumbnail_url || photo.url)}
                    alt={photo.original_name}
                    className="w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 sm:p-3">
                    <div className="flex items-center justify-between text-white text-xs">
                      <span className="truncate font-medium text-[11px] sm:text-xs mr-2">{photo.original_name}</span>
                      <span className="p-1 sm:p-1.5 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
