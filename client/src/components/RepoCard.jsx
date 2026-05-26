import React, { useContext, useState } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import { Star, GitFork, AlertCircle, Eye, Bookmark, ExternalLink, BookOpen, ChevronDown, ChevronUp, Loader2, Globe } from 'lucide-react';
import apiClient from '../services/api';

const RepoCard = ({ repo, onClick }) => {
  const { toggleFavoriteRepo } = useContext(DashboardContext);
  const [isReadmeExpanded, setIsReadmeExpanded] = useState(false);
  const [readmeText, setReadmeText] = useState('');
  const [loadingReadme, setLoadingReadme] = useState(false);
  const [errorReadme, setErrorReadme] = useState(null);

  // Format star counts nicely
  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  // Determine styling color tag based on repo language
  const getLanguageColor = (lang) => {
    const colors = {
      javascript: 'bg-yellow-400',
      typescript: 'bg-blue-500',
      python: 'bg-green-500',
      go: 'bg-cyan-500',
      rust: 'bg-orange-600',
      html: 'bg-red-500',
      css: 'bg-purple-500',
      java: 'bg-amber-600',
      'c++': 'bg-pink-600',
    };
    return colors[lang?.toLowerCase()] || 'bg-slate-400';
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteRepo(repo._id);
  };

  // Toggle README content loader inline
  const handleToggleReadme = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isReadmeExpanded) {
      setIsReadmeExpanded(false);
      return;
    }

    if (readmeText) {
      setIsReadmeExpanded(true);
      return;
    }

    setLoadingReadme(true);
    setErrorReadme(null);
    try {
      const res = await apiClient.get(`/github/repositories/${repo._id}/readme`);
      setReadmeText(res.readme || 'No README file content available.');
      setIsReadmeExpanded(true);
    } catch (err) {
      setErrorReadme('Failed to retrieve README.');
    } finally {
      setLoadingReadme(false);
    }
  };

  // Inline markdown helper compiler
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    let inCodeBlock = false;

    return lines.map((line, i) => {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return null;
      }
      if (inCodeBlock) {
        return (
          <pre key={i} className="bg-slate-900 dark:bg-slate-950 text-indigo-300 font-mono text-[9px] p-2 rounded my-1 overflow-x-auto border border-slate-800/80">
            <code>{line}</code>
          </pre>
        );
      }

      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-xs font-bold font-outfit text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-gray-800/50 pb-1 mt-3 mb-2 uppercase tracking-wide">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-[11px] font-bold font-outfit text-slate-800 dark:text-white mt-2 mb-1 uppercase">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-[10px] font-bold font-outfit text-slate-700 dark:text-slate-350 mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }

      if (line.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-2 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 px-2 py-1 my-1.5 rounded-r text-[10px] italic text-slate-505">
            {line.replace('> ', '')}
          </blockquote>
        );
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <ul key={i} className="list-disc list-inside ml-2 text-[10px] text-slate-600 dark:text-slate-400 my-0.5 font-medium">
            <li>{line.trim().replace(/^[\-\*]\s+/, '')}</li>
          </ul>
        );
      }

      if (!line.trim()) {
        return <div key={i} className="h-1"></div>;
      }

      let renderedLine = line
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-gray-800 px-1 rounded font-mono text-[9px] text-indigo-500">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-indigo-500 hover:underline inline-flex items-center gap-0.5">$1 ↗</a>');

      return (
        <p
          key={i}
          className="text-[10px] text-slate-600 dark:text-slate-400 my-0.5 leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: renderedLine }}
        />
      );
    });
  };

  return (
    <div onClick={onClick} className="glass-card hover-lift p-5 border-slate-100 dark:border-gray-800/80 neon-border-indigo flex flex-col justify-between relative group cursor-pointer">
      <div>
        {/* Header Block */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={repo.avatar || 'https://github.com/identicons/github.png'}
              alt={repo.owner}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-gray-800/60"
            />
            <div>
              <span className="font-bold text-slate-800 dark:text-white font-outfit text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150 flex items-center gap-1.5">
                {repo.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">@{repo.owner}</span>
            </div>
          </div>

          {/* Action Bookmark Toggle */}
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-xl transition-all duration-200 border ${
              repo.isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500 scale-105'
                : 'border-slate-200 dark:border-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title={repo.isFavorite ? 'Remove bookmark' : 'Bookmark Repository'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Repository Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4 line-clamp-2 min-h-[36px]">
          {repo.description || 'No description provided for this repository.'}
        </p>

        {/* Repository Tags/Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {repo.topics.slice(0, 2).map((topic, i) => (
              <span
                key={i}
                className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/45 px-2 py-0.5 rounded-md border border-indigo-100/50 dark:border-indigo-950/30"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Block */}
      <div className="border-t border-slate-100 dark:border-gray-800/80 pt-4 flex flex-col gap-3">
        {/* Metric counts */}
        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
          {/* Primary Language */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(repo.language)}`}></span>
            <span className="text-slate-550 dark:text-slate-400 font-bold">{repo.language || 'HTML'}</span>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-500" />
              {formatCount(repo.stars)}
            </span>
            <span className="flex items-center gap-0.5">
              <GitFork className="w-3 h-3 text-indigo-500" />
              {formatCount(repo.forks)}
            </span>
            <span className="flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3 text-red-500" />
              {repo.issues || 0}
            </span>
          </div>
        </div>

        {/* Action button to expand README file inline inside the list card */}
        <button
          onClick={handleToggleReadme}
          className="w-full py-2 px-3 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border border-indigo-100/50 dark:border-gray-800 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/25 transition-all duration-150 flex items-center justify-center gap-1"
        >
          {loadingReadme ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isReadmeExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Hide README Content
            </>
          ) : (
            <>
              <BookOpen className="w-3 h-3" />
              Read README Inline
            </>
          )}
        </button>
        {errorReadme && <p className="text-[8px] text-red-500 font-bold mt-1 text-center">{errorReadme}</p>}

        {/* Collapsible scrollable inline markdown viewer */}
        {isReadmeExpanded && readmeText && (
          <div
            onClick={(e) => e.stopPropagation()} // prevent card onClick trigger
            className="p-3.5 border border-slate-100 dark:border-gray-850/80 bg-white/80 dark:bg-slate-950/65 rounded-xl max-h-[220px] overflow-y-auto shadow-inner text-left selection:bg-indigo-500/25 cursor-text mt-1"
          >
            <div className="prose dark:prose-invert max-w-none break-words">
              {renderMarkdown(readmeText)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoCard;
