import React, { useContext, useState } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import { SlidersHorizontal, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const LANGUAGES = [
  { name: 'All Languages', value: '' },
  { name: 'JavaScript', value: 'javascript' },
  { name: 'TypeScript', value: 'typescript' },
  { name: 'Python', value: 'python' },
  { name: 'Go', value: 'go' },
  { name: 'Rust', value: 'rust' },
  { name: 'C++', value: 'c++' },
  { name: 'Java', value: 'java' },
  { name: 'HTML', value: 'html' },
  { name: 'CSS', value: 'css' }
];

const SORT_OPTIONS = [
  { name: 'Stars Count', value: 'stars' },
  { name: 'Forks Count', value: 'forks' },
  { name: 'Recent Activity', value: 'updatedAt' },
  { name: 'Open Issues', value: 'issues' },
  { name: 'OSINT Trending Score', value: 'trendingScore' }
];

const Filters = () => {
  const {
    selectedLanguage,
    setSelectedLanguage,
    minStars,
    setMinStars,
    maxStars,
    setMaxStars,
    minForks,
    setMinForks,
    sortBy,
    setSortBy,
    showBookmarksOnly,
  } = useContext(DashboardContext);

  const [isOpen, setIsOpen] = useState(false);

  const handleResetFilters = () => {
    setSelectedLanguage('');
    setMinStars(1000);
    setMaxStars(250000);
    setMinForks(0);
    setSortBy('stars');
  };

  return (
    <div className="glass-card mb-6 overflow-hidden border-slate-100 dark:border-gray-800/80">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/30 dark:bg-slate-900/10 focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all duration-150"
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-sm tracking-wide">Fine-tune Filters & Sorting</span>
          {showBookmarksOnly && (
            <span className="text-[10px] bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded-full">
              Inactive in Bookmarks Mode
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Accordion Panels */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[800px] border-t border-slate-100 dark:border-gray-800/85 p-6' : 'max-h-0'
        } overflow-hidden`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Language Selection */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Primary Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={showBookmarksOnly}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50"
            >
              {LANGUAGES.map((lang, idx) => (
                <option key={idx} value={lang.value} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selection */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Sort Repositories By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={showBookmarksOnly}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50"
            >
              {SORT_OPTIONS.map((opt, idx) => (
                <option key={idx} value={opt.value} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stars Metric Range */}
          <div className="flex flex-col col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Minimum Stars: <span className="text-slate-700 dark:text-white font-bold">{minStars.toLocaleString()}</span>
              </label>
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Max Stars: <span className="text-slate-700 dark:text-white font-bold">{maxStars >= 250000 ? '250k+' : maxStars.toLocaleString()}</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4 py-2.5">
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={minStars}
                onChange={(e) => setMinStars(parseInt(e.target.value))}
                disabled={showBookmarksOnly}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
              />
              <input
                type="range"
                min="50000"
                max="250000"
                step="5000"
                value={maxStars}
                onChange={(e) => setMaxStars(parseInt(e.target.value))}
                disabled={showBookmarksOnly}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Action Panel Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-gray-800/80 mt-6 pt-4">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Adjusting star ranges and forks narrows API matches instantly.
          </p>
          <button
            onClick={handleResetFilters}
            disabled={showBookmarksOnly}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
