import React, { useContext } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import { Search, MessageSquare, X } from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const SearchBar = () => {
  const {
    searchQuery,
    setSearchQuery,
    redditSearch,
    setRedditSearch,
    showBookmarksOnly,
  } = useContext(DashboardContext);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* GitHub Repository Search */}
      <div className="glass-card p-4 flex flex-col justify-center border-slate-100 dark:border-gray-800/80">
        <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <GithubIcon className="w-3.5 h-3.5 text-slate-400" />
          Search GitHub Repositories
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={showBookmarksOnly}
            placeholder={showBookmarksOnly ? "Filtering bookmarks only..." : "Search by repository name, language, or tags..."}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500/50 transition-all duration-200"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Reddit Post Search */}
      <div className="glass-card p-4 flex flex-col justify-center border-slate-100 dark:border-gray-800/80">
        <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
          Search Reddit Discussions
        </label>
        <div className="relative">
          <input
            type="text"
            value={redditSearch}
            onChange={(e) => setRedditSearch(e.target.value)}
            disabled={showBookmarksOnly}
            placeholder={showBookmarksOnly ? "Filtering bookmarks only..." : "Search posts by title, author, keywords..."}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-500/50 transition-all duration-200"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          {redditSearch && (
            <button
              onClick={() => setRedditSearch('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
