import React from 'react';
import { Star, GitFork, MessageSquare, Code2, Flame } from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const StatsCards = ({ stats, loading }) => {
  // Format numbers cleanly (e.g., 1500000 => 1.5M)
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const cardsData = [
    {
      title: 'Total Stars Tracked',
      value: stats ? formatNumber(stats.totalStars) : '0',
      description: 'Accumulated project approval stars',
      icon: Star,
      colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-950/40',
    },
    {
      title: 'Total Forks Tracked',
      value: stats ? formatNumber(stats.totalForks) : '0',
      description: 'Secondary repository forks',
      icon: GitFork,
      colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-950/40',
    },
    {
      title: 'Monitored Repos',
      value: stats ? stats.totalRepositories : '0',
      description: 'Total index GitHub projects',
      icon: GithubIcon,
      colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/45',
    },
    {
      title: 'Reddit Discussions',
      value: stats ? stats.totalRedditPosts : '0',
      description: 'Trending developer posts',
      icon: MessageSquare,
      colorClass: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-950/40',
    },
    {
      title: 'Most Active Subreddit',
      value: stats ? stats.mostActiveSubreddit : 'N/A',
      description: 'Subreddit with top post metrics',
      icon: Flame,
      colorClass: 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-950/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cardsData.map((card, i) => {
        const IconComponent = card.icon;
        
        if (loading) {
          return (
            <div key={i} className="glass-card p-4 flex flex-col justify-between animate-pulse min-h-[106px]">
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
              <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
            </div>
          );
        }

        return (
          <div
            key={i}
            className="glass-card p-4 hover-lift flex flex-col justify-between border-slate-100 dark:border-gray-800/80 min-h-[106px]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-xl font-bold font-outfit mt-1 text-slate-800 dark:text-white truncate max-w-[120px]">
                  {card.value}
                </p>
              </div>
              <div className={`p-2 rounded-xl border ${card.colorClass}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
