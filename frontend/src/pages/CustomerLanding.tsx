import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, Search, ArrowRight, Shield, Star, Image as ImageIcon, Lock, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const features = [
  {
    icon: Lock,
    title: "Private & Secure",
    desc: "Your photos are PIN-protected and accessible only to you.",
  },
  {
    icon: ImageIcon,
    title: "Curated Selection",
    desc: "Only the best shots, handpicked by your photographer.",
  },
  {
    icon: Star,
    title: "Download Yours",
    desc: "Download any or all photos in full resolution.",
  },
];

export const CustomerLanding: React.FC = () => {
  const [galleryCode, setGalleryCode] = useState("");
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const code = galleryCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (code) {
      navigate("/gallery/" + code);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col animate-page-enter">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse-glow">
            <Camera className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">
              Trizen<span className="text-amber-400">Photos</span>
            </span>
            <div className="text-[9px] text-amber-500/80 uppercase tracking-wide font-medium -mt-0.5">
              Luxury Studio Portal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all cursor-pointer"
            title="Toggle theme"
          >
            {mode === "dark" ? (
              <Sun className="w-4 h-4 animate-pulse" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20"
          >
            <Shield className="w-3.5 h-3.5" />
            Staff Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-2xl shadow-amber-500/30 mb-8 animate-float animate-pulse-glow">
          <Camera className="w-10 h-10 text-slate-950" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
          Your Special Moments,
          <br />
          <span className="animate-gradient-text">Beautifully Delivered</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-lg mb-12 leading-relaxed">
          Your photographer has curated your event photos and created a private gallery just for you.
          Enter your <strong className="text-amber-400">Gallery Code</strong> below to access your photos.
        </p>

        <form onSubmit={handleSearch} className="w-full max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">
              Your Gallery Code
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400/70" />
                <input
                  type="text"
                  value={galleryCode}
                  onChange={(e) => setGalleryCode(e.target.value)}
                  placeholder="e.g. abc123 or wedding-2024"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={!galleryCode.trim()}
                className="btn-press flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/30 cursor-pointer whitespace-nowrap"
              >
                <span>View Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-left">
              Your gallery code was shared by your photographer via email or message.
            </p>
          </div>
        </form>

        <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-slate-400 max-w-md">
          <span className="text-amber-400 font-semibold">Demo:</span> Enter code{" "}
          <button
            onClick={() => setGalleryCode("abc123")}
            className="font-mono text-amber-300 font-bold hover:underline cursor-pointer"
          >
            abc123
          </button>{" "}
          then use PIN <span className="font-mono text-amber-300 font-bold">482917</span> to view a sample wedding gallery.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-2xl w-full text-left">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 animate-fade-up"
              style={{ animationDelay: i * 0.1 + "s" }}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-white mb-1">{title}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-[11px] text-slate-600 border-t border-white/5">
        Powered by <span className="text-amber-500/80 font-semibold">TrizenPhotos</span> — Luxury Photography Studio Platform
      </footer>
    </div>
  );
};