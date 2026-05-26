import React from 'react';

// visual loaders for repositories cards grid
export const RepoCardSkeleton = () => {
  return (
    <div className="glass-card p-5 border-slate-100 dark:border-gray-800/80 animate-pulse min-h-[224px] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-2.5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded mt-1.5"></div>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
      <div className="border-t border-slate-100 dark:border-gray-800/80 pt-4 flex items-center justify-between">
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    </div>
  );
};

// visual loaders for reddit post list
export const RedditCardSkeleton = () => {
  return (
    <div className="glass-card p-4 border-slate-100 dark:border-gray-800/80 animate-pulse flex items-center gap-4 min-h-[92px]">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-2.5 w-1/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
        <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
        <div className="h-2.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    </div>
  );
};

// visual loaders for full charts box
export const ChartSkeleton = () => {
  return (
    <div className="glass-card p-5 border-slate-100 dark:border-gray-800/80 animate-pulse min-h-[300px] flex flex-col justify-between">
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
      <div className="flex-1 flex items-end justify-between gap-4 px-2">
        <div className="h-16 w-8 bg-slate-200 dark:bg-slate-800 rounded-t-md"></div>
        <div className="h-32 w-8 bg-slate-200 dark:bg-slate-800 rounded-t-md"></div>
        <div className="h-24 w-8 bg-slate-200 dark:bg-slate-800 rounded-t-md"></div>
        <div className="h-48 w-8 bg-slate-200 dark:bg-slate-800 rounded-t-md"></div>
        <div className="h-36 w-8 bg-slate-200 dark:bg-slate-800 rounded-t-md"></div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-indigo-600/35 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
