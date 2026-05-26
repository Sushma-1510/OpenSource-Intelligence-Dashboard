import React, { useContext } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import { ArrowBigUp, MessageSquare, Bookmark, ExternalLink, ShieldAlert } from 'lucide-react';

const RedditCard = ({ post, onClick }) => {
  const { toggleFavoritePost } = useContext(DashboardContext);

  // Format upvote counts
  const formatUpvotes = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoritePost(post._id);
  };

  // Convert Date cleanly
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div onClick={onClick} className="glass-card hover-lift p-4 border-slate-100 dark:border-gray-800/80 neon-border-orange flex items-center justify-between gap-4 group cursor-pointer">
      {/* Upvotes Controller Indicator */}
      <div className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-950/40 p-2 rounded-xl text-orange-600 dark:text-orange-400 min-w-[50px]">
        <ArrowBigUp className="w-5 h-5 fill-current" />
        <span className="text-xs font-bold mt-0.5 font-outfit">{formatUpvotes(post.upvotes)}</span>
      </div>

      {/* Main Details Block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/50 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-full">
            r/{post.subreddit}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Posted by <span className="text-slate-500 dark:text-slate-400">u/{post.author}</span> • {formatDate(post.createdAt)}
          </span>
        </div>

        {/* Title click-through */}
        <a
          href={post.postUrl}
          target="_blank"
          rel="noreferrer"
          className="block font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-150 break-words pr-2"
        >
          {post.title}
        </a>

        {/* Card Footer controls */}
        <div className="flex items-center gap-4 mt-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            {post.comments} comments
          </span>
          <a
            href={post.postUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold"
          >
            Open Thread
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Right Controls Favorites toggler */}
      <div className="flex flex-col items-center justify-between gap-3 self-stretch">
        <button
          onClick={handleFavoriteClick}
          className={`p-2.5 rounded-xl transition-all duration-200 border ${
            post.isFavorite
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500 scale-105 shadow-sm'
              : 'border-slate-200 dark:border-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          title={post.isFavorite ? 'Remove bookmark' : 'Bookmark Discussion'}
        >
          <Bookmark className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default RedditCard;
