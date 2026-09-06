import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Camera, LogOut, Shield, User as UserIcon, Calendar, Layers, Menu, X, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2.5 group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 animate-pulse-glow transition-transform flex-shrink-0">
              <Camera className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Trizen<span className="text-amber-400">Photos</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-amber-500/80 block -mt-1 font-medium tracking-wide uppercase">
                Luxury Studio Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {isAdmin ? (
              <Link
                to="/"
                className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/' || location.pathname.startsWith('/events')
                    ? 'text-white bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                Events & Galleries
              </Link>
            ) : (
              <Link
                to="/"
                className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/'
                    ? 'text-white bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4 text-violet-400" />
                My Assigned Events
              </Link>
            )}

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Theme Toggle Button (Dark / Light Mood) */}
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
              <span className="text-[11px] font-semibold tracking-wider uppercase hidden lg:inline">
                {mode === 'dark' ? 'Light Mood' : 'Dark Mood'}
              </span>
            </button>

            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full">
              {isAdmin ? (
                <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                {user.name}
              </span>
              <span
                className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {isAdmin ? 'Admin' : 'Photographer'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Actions & Hamburger */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <span
              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                isAdmin
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              {isAdmin ? 'Admin' : 'Photo'}
            </span>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-4 space-y-3 animate-slide-down">
          <div className="flex items-center space-x-2 p-2 bg-slate-800/60 rounded-xl">
            {isAdmin ? (
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
            ) : (
              <UserIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            )}
            <div className="truncate">
              <div className="text-xs font-semibold text-white">{user.name}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
          </div>

          <div className="space-y-1">
            {isAdmin ? (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Events & Galleries</span>
              </Link>
            ) : (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                <Layers className="w-4 h-4 text-violet-400" />
                <span>My Assigned Events</span>
              </Link>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
