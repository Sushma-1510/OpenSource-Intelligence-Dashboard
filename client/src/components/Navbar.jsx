import React, { useContext } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import { Sun, Moon, ShieldAlert, Bookmark, Database } from 'lucide-react';

const Navbar = () => {
  const {
    isDarkMode,
    setIsDarkMode,
    showBookmarksOnly,
    setShowBookmarksOnly,
    favoriteRepos,
    favoritePosts,
  } = useContext(DashboardContext);

  const totalBookmarks = favoriteRepos.length + favoritePosts.length;

  return (
    <nav className="sticky top-0 z-40 w-full glass-card border-none rounded-none shadow-md border-b dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600/10 dark:bg-indigo-500/15 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-outfit tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            OSINT <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-950">INTELLIGENCE</span>
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">GitHub & Reddit Global Monitor</p>
        </div>
      </div>

      {/* Center Tabs Navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 p-1.5 rounded-2xl gap-1">
        <button
          onClick={() => setShowBookmarksOnly(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
            !showBookmarksOnly
              ? 'bg-white dark:bg-[#161e31] text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-600/5'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Global Feed
        </button>
        <button
          onClick={() => setShowBookmarksOnly(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 relative ${
            showBookmarksOnly
              ? 'bg-white dark:bg-[#161e31] text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-600/5'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Bookmarks
          {totalBookmarks > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-950">
              {totalBookmarks}
            </span>
          )}
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Switcher */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 dark:border-gray-800 dark:hover:bg-gray-800/60 dark:text-slate-400 transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
