import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { X, Star, GitFork, MessageSquare, AlertCircle, Bookmark, ExternalLink } from 'lucide-react';

const DetailModal = ({ isOpen, onClose, type, item, isFavorite, onToggleFavorite }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Load readme or comments from backend proxy endpoints
  useEffect(() => {
    if (!isOpen || !item) return;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        if (type === 'Repository') {
          const res = await apiClient.get(`/github/repositories/${item._id}/readme`);
          setData(res);
        } else if (type === 'RedditPost') {
          const res = await apiClient.get(`/reddit/posts/${item._id}/content`);
          setData(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch detailed contents.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, item, type]);

  if (!isOpen || !item) return null;

  // Simple and elegant inline markdown renderer to handle headers, lists, code, and links cleanly
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    let inCodeBlock = false;

    return lines.map((line, i) => {
      // Handle Code Blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return null;
      }
      if (inCodeBlock) {
        return (
          <pre key={i} className="bg-slate-900 text-indigo-300 font-mono text-[11px] p-3 rounded-lg my-1 overflow-x-auto border border-slate-800">
            <code>{line}</code>
          </pre>
        );
      }

      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-xl font-bold font-outfit text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-gray-800/80 pb-2 mt-6 mb-3 uppercase tracking-wide">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-base font-bold font-outfit text-slate-800 dark:text-white mt-5 mb-2 uppercase tracking-wide">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-sm font-bold font-outfit text-slate-700 dark:text-slate-300 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-4 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 px-4 py-2 my-2 rounded-r-lg text-xs italic text-slate-500 dark:text-slate-400">
            {line.replace('> ', '')}
          </blockquote>
        );
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <ul key={i} className="list-disc list-inside ml-4 text-xs text-slate-600 dark:text-slate-400 my-1 font-medium">
            <li>{line.trim().replace(/^[\-\*]\s+/, '')}</li>
          </ul>
        );
      }

      // Empty Lines
      if (!line.trim()) {
        return <div key={i} className="h-2"></div>;
      }

      // Default text lines (render bold and raw markdown links gracefully)
      let renderedLine = line
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-gray-800 px-1 rounded font-mono text-[11px] text-indigo-500">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-indigo-500 hover:underline inline-flex items-center gap-0.5">$1 ↗</a>');

      return (
        <p
          key={i}
          className="text-xs text-slate-600 dark:text-slate-400 my-1.5 leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: renderedLine }}
        />
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300">
      {/* Modal Card */}
      <div className="w-full max-w-3xl h-[85vh] glass-card border-none flex flex-col justify-between overflow-hidden shadow-2xl relative animate-scale-up">
        
        {/* Header Block */}
        <div className="p-6 border-b border-slate-100 dark:border-gray-800/80 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                type === 'Repository' 
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50' 
                  : 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50'
              }`}>
                {type === 'Repository' ? repoLanguage || item.language : `r/${item.subreddit}`}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {type === 'Repository' ? `@${item.owner}` : `Posted by u/${item.author}`}
              </span>
            </div>
            
            <h2 className="text-lg font-bold font-outfit text-slate-800 dark:text-white leading-tight break-words">
              {type === 'Repository' ? item.name : item.title}
            </h2>
          </div>

          {/* Close & Favorites Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(item._id)}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                isFavorite
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500 scale-105'
                  : 'border-slate-200 dark:border-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Bookmark Item"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600/35 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider animate-pulse">
                Fetching OSINT thread streams...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">Failed to load content</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">{error}</p>
            </div>
          ) : type === 'Repository' ? (
            // GitHub README Viewer
            <div className="prose dark:prose-invert max-w-none">
              {data && renderMarkdown(data.readme)}
            </div>
          ) : (
            // Reddit Post & Comments Viewer
            <div className="space-y-6">
              {/* Reddit Selftext body */}
              <div className="glass-card p-5 border-slate-100 dark:border-gray-800/80 bg-white dark:bg-[#161e31]">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 border-b border-slate-50 dark:border-gray-800 pb-2">
                  Post Content Markdown
                </h4>
                <div className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300 break-words prose dark:prose-invert">
                  {data && renderMarkdown(data.selftext)}
                </div>
              </div>

              {/* Reddit Comments Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold font-outfit text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  Top Parent Discussions ({data?.comments?.length || 0})
                </h4>
                
                {data?.comments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No comments tracked on this post.</p>
                ) : (
                  <div className="space-y-3">
                    {data?.comments?.map((comment, idx) => (
                      <div key={idx} className="glass-card p-4 hover-lift border-slate-100 dark:border-gray-850 shadow-sm relative group bg-white/40 dark:bg-gray-900/35">
                        <div className="flex items-center justify-between mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          <span>u/{comment.author}</span>
                          <span className="flex items-center gap-1 text-orange-500">
                            <Star className="w-3 h-3 fill-current" />
                            {comment.upvotes} points
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium whitespace-pre-wrap select-text selection:bg-orange-500/25">
                          {comment.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Metrics Panel */}
        <div className="p-4 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-white dark:bg-[#111827]">
          {type === 'Repository' ? (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                {item.stars?.toLocaleString()} stars
              </span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <GitFork className="w-3.5 h-3.5 text-indigo-500" />
                {item.forks?.toLocaleString()} forks
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Star className="w-3.5 h-3.5 text-orange-500" />
                {item.upvotes?.toLocaleString()} score
              </span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                {item.comments} comments
              </span>
            </div>
          )}

          <a
            href={type === 'Repository' ? item.repoUrl : item.postUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary py-1.5 px-3 rounded-lg text-[9px] font-bold tracking-widest flex items-center gap-1 uppercase hover:scale-[1.02]"
          >
            Open Original Link
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};

const repoLanguage = ''; // helper variables
export default DetailModal;
