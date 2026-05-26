import React, { useContext } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';

const Charts = ({ data }) => {
  const { isDarkMode } = useContext(DashboardContext);

  if (!data) return null;

  const { languages, starsDistribution, growthTrend, subreddits } = data;

  // Custom visual theme color hexes for charts
  const textColor = isDarkMode ? '#94a3b8' : '#475569';
  const gridColor = isDarkMode ? 'rgba(36, 47, 73, 0.4)' : 'rgba(226, 232, 240, 0.7)';
  const tooltipBg = isDarkMode ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#374151' : '#e2e8f0';

  // HSL curated palette for language splits
  const COLORS = [
    '#6366f1', // Indigo
    '#f97316', // Orange
    '#10b981', // Emerald
    '#0ea5e9', // Sky
    '#ec4899', // Pink
    '#a855f7', // Purple
    '#f59e0b', // Amber
    '#64748b'  // Slate
  ];

  // Helper to render premium glassmorphic empty state placeholder inside charts
  const renderEmptyState = (title, message) => (
    <div className="flex flex-col items-center justify-center h-[280px] bg-slate-50/30 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 text-center">
      <div className="bg-indigo-600/10 dark:bg-indigo-500/15 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 mb-2">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-outfit uppercase tracking-wider">{title}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] leading-normal">{message}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 1. Top Languages Pie Chart */}
      <div className="glass-card p-5 border-slate-100 dark:border-gray-800/80 hover-lift min-h-[360px]">
        <h3 className="text-sm font-bold font-outfit text-slate-700 dark:text-slate-200 mb-4 tracking-wide uppercase">
          Top Languages Distribution
        </h3>
        <div className="h-[280px]">
          {languages.length === 0 ? (
            renderEmptyState('No Language Metrics', 'No repository matches found in this search cluster.')
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languages}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="language"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {languages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    color: isDarkMode ? '#fff' : '#000',
                    fontFamily: 'Inter',
                    fontSize: '11px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Stars Distribution Bar Chart */}
      <div className="glass-card p-5 border-slate-100 dark:border-gray-800/80 hover-lift min-h-[360px]">
        <h3 className="text-sm font-bold font-outfit text-slate-700 dark:text-slate-200 mb-4 tracking-wide uppercase">
          Repositories Stars Distribution
        </h3>
        <div className="h-[280px]">
          {starsDistribution.length === 0 || starsDistribution.every(b => b.repositories === 0) ? (
            renderEmptyState('No Star Distribution', 'No projects fit inside these star parameters.')
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={starsDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="range" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontFamily: 'Inter',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="repositories" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40}>
                  {starsDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.repositories > 20 ? '#4f46e5' : '#818cf8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Repository Growth Timeline */}
      <div className="glass-card p-5 border-slate-100 dark:border-gray-800/80 hover-lift min-h-[360px]">
        <h3 className="text-sm font-bold font-outfit text-slate-700 dark:text-slate-200 mb-4 tracking-wide uppercase">
          Repository Growth Timeline
        </h3>
        <div className="h-[280px]">
          {growthTrend.length === 0 ? (
            renderEmptyState('No Growth Metrics', 'No repository creation dates tracked in this scope.')
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrend}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontFamily: 'Inter',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" name="Created" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Active Subreddits Discussion Count */}
      <div className="glass-card p-5 border-slate-100 dark:border-gray-800/80 hover-lift min-h-[360px]">
        <h3 className="text-sm font-bold font-outfit text-slate-700 dark:text-slate-200 mb-4 tracking-wide uppercase">
          Subreddit Discussion Engagement
        </h3>
        <div className="h-[280px]">
          {subreddits.length === 0 ? (
            renderEmptyState('No Reddit Discussions', 'Try matching a different subreddit keywords search.')
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subreddits}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="subreddit" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    fontFamily: 'Inter',
                    fontSize: '11px',
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="upvotes" fill="#f97316" radius={[6, 6, 0, 0]} name="Upvotes" />
                <Bar dataKey="comments" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;
