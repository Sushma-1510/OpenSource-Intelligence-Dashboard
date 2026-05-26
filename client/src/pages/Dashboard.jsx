import React, { useState, useEffect, useContext, useCallback } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import { useRepositories } from '../hooks/useRepositories';
import { useRedditPosts } from '../hooks/useRedditPosts';
import StatsCards from '../components/StatsCards';
import Filters from '../components/Filters';
import RepoCard from '../components/RepoCard';
import RedditCard from '../components/RedditCard';
import LoadingSpinner, { RepoCardSkeleton, RedditCardSkeleton } from '../components/LoadingSpinner';
import apiClient from '../services/api';
import { 
  Download, ChevronLeft, ChevronRight, FileJson, FileText, Sparkles, BookOpen, AlertCircle, 
  Search, ArrowLeft, Star, GitFork, MessageSquare, ExternalLink, Globe, Heart, Send, CornerDownRight
} from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Dashboard = () => {
  const {
    showBookmarksOnly,
    favoriteRepos,
    favoritePosts,
    refreshFavorites,
    selectedLanguage,
    minStars,
    maxStars,
    minForks,
  } = useContext(DashboardContext);

  // Hook-driven API timeline states
  const {
    repositories,
    loading: loadingRepos,
    error: errorRepos,
    page: repoPage,
    totalPages: repoTotalPages,
    setPage: setRepoPage,
    refetch: refetchRepos
  } = useRepositories();

  const {
    posts: redditPosts,
    loading: loadingReddit,
    error: errorReddit,
    page: redditPage,
    totalPages: redditTotalPages,
    setPage: setRedditPage,
    selectedSubreddit,
    setSelectedSubreddit,
  } = useRedditPosts();

  // Statistics and Analytics Aggregation States
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // GitHub Live Search & Explorer States
  const [liveRepoName, setLiveRepoName] = useState('');
  const [activeRepoDetail, setActiveRepoDetail] = useState(null);
  const [loadingLiveRepo, setLoadingLiveRepo] = useState(false);
  const [errorLiveRepo, setErrorLiveRepo] = useState(null);

  // Reddit Live Search & Explorer States
  const [liveRedditQuery, setLiveRedditQuery] = useState('');
  const [liveRedditPosts, setLiveRedditPosts] = useState(null);
  const [loadingLiveReddit, setLoadingLiveReddit] = useState(false);
  const [errorLiveReddit, setErrorLiveReddit] = useState(null);
  
  const [activeRedditPostDetail, setActiveRedditPostDetail] = useState(null);
  const [selectedRedditPost, setSelectedRedditPost] = useState(null);
  const [loadingRedditComments, setLoadingRedditComments] = useState(false);
  const [errorRedditComments, setErrorRedditComments] = useState(null);

  // Subreddit tabs list
  const subredditsFilter = ['All', 'opensource', 'programming', 'javascript', 'reactjs', 'webdev'];

  // Load analytical summaries
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const params = {};
      if (selectedLanguage) params.language = selectedLanguage;
      if (minStars) params.minStars = minStars;
      if (maxStars) params.maxStars = maxStars;
      if (minForks) params.minForks = minForks;
      if (selectedSubreddit) params.subreddit = selectedSubreddit;

      const response = await apiClient.get('/dashboard/analytics', { params });
      setAnalytics(response || null);
    } catch (err) {
      console.error('[Dashboard] Failed to fetch chart analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedLanguage, minStars, maxStars, minForks, selectedSubreddit]);

  // Load trend insights
  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const params = {};
      if (selectedLanguage) params.language = selectedLanguage;
      if (minStars) params.minStars = minStars;
      if (maxStars) params.maxStars = maxStars;
      if (minForks) params.minForks = minForks;
      if (selectedSubreddit) params.subreddit = selectedSubreddit;

      const response = await apiClient.get('/dashboard/insights', { params });
      setInsights(response.data || []);
    } catch (err) {
      console.error('[Dashboard] Failed to load trend insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  }, [selectedLanguage, minStars, maxStars, minForks, selectedSubreddit]);

  // Debounced synchronizer to trigger analytics/insights requests
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAnalytics();
      fetchInsights();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedLanguage, minStars, maxStars, minForks, selectedSubreddit, fetchAnalytics, fetchInsights]);

  // Export action handler
  const handleExport = (format) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${backendUrl}/github/export?format=${format}`, '_blank');
  };

  // Dynamic GitHub Live Search Handler
  const handleLiveRepoSearch = async (e) => {
    if (e) e.preventDefault();
    if (!liveRepoName.trim()) return;

    setLoadingLiveRepo(true);
    setErrorLiveRepo(null);
    setActiveRepoDetail(null);

    try {
      const res = await apiClient.get(`/github/repository/live`, {
        params: { name: liveRepoName.trim() }
      });
      setActiveRepoDetail(res);
      refetchRepos(); // refresh backgrounds
      fetchAnalytics();
    } catch (err) {
      setErrorLiveRepo(err.response?.data?.error || err.message || 'Failed to search repository.');
    } finally {
      setLoadingLiveRepo(false);
    }
  };

  // Load a Repository detail pane from card click
  const handleOpenRepoDetail = async (repo) => {
    setLoadingLiveRepo(true);
    setErrorLiveRepo(null);
    setActiveRepoDetail(null);

    try {
      const readmeRes = await apiClient.get(`/github/repositories/${repo._id}/readme`);
      const mergedRepo = {
        ...repo,
        readme: readmeRes.readme
      };
      setActiveRepoDetail(mergedRepo);
    } catch (err) {
      setErrorLiveRepo(err.message || 'Failed to retrieve repository content.');
    } finally {
      setLoadingLiveRepo(false);
    }
  };

  // Dynamic Reddit Subreddit/Discussion Live Search Handler
  const handleLiveRedditSearch = async (e) => {
    if (e) e.preventDefault();
    if (!liveRedditQuery.trim()) return;

    setLoadingLiveReddit(true);
    setErrorLiveReddit(null);
    setActiveRedditPostDetail(null);
    setSelectedRedditPost(null);

    try {
      const res = await apiClient.get(`/reddit/subreddit/live`, {
        params: { name: liveRedditQuery.trim() }
      });
      setLiveRedditPosts(res.data || []);
      fetchAnalytics();
    } catch (err) {
      setErrorLiveReddit(err.response?.data?.error || err.message || 'Subreddit search failed.');
    } finally {
      setLoadingLiveReddit(false);
    }
  };

  // Load a Reddit post comments thread detail pane from card click
  const handleOpenRedditPostDetail = async (post) => {
    setLoadingRedditComments(true);
    setErrorRedditComments(null);
    setSelectedRedditPost(post);
    setActiveRedditPostDetail(null);

    try {
      const res = await apiClient.get(`/reddit/posts/${post._id}/content`);
      setActiveRedditPostDetail(res);
    } catch (err) {
      setErrorRedditComments(err.message || 'Failed to fetch comments.');
    } finally {
      setLoadingRedditComments(false);
    }
  };

  // Bookmark toggles updates synchronizers
  const handleToggleRepoFavoriteLive = async (id) => {
    try {
      await apiClient.post('/github/favorites', { repositoryId: id });
      refreshFavorites();
      // If we are currently viewing this in activeRepoDetail, update its state
      if (activeRepoDetail && activeRepoDetail._id === id) {
        setActiveRepoDetail(prev => ({
          ...prev,
          isFavorite: !prev.isFavorite
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRedditFavoriteLive = async (id) => {
    try {
      await apiClient.post('/reddit/favorites', { postId: id });
      refreshFavorites();
      if (selectedRedditPost && selectedRedditPost._id === id) {
        setSelectedRedditPost(prev => ({
          ...prev,
          isFavorite: !prev.isFavorite
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format count numbers
  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  // Render HTML markup from raw markdown safely
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
          <pre key={i} className="bg-slate-900 dark:bg-slate-950 text-indigo-300 font-mono text-[11px] p-3 rounded-lg my-1 overflow-x-auto border border-slate-800/80">
            <code>{line}</code>
          </pre>
        );
      }

      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-lg font-bold font-outfit text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-gray-800/50 pb-2 mt-5 mb-3 uppercase tracking-wide">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-sm font-bold font-outfit text-slate-800 dark:text-white border-b border-slate-50 dark:border-gray-850 pb-1 mt-4 mb-2 uppercase tracking-wider">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xs font-bold font-outfit text-slate-700 dark:text-slate-350 mt-3 mb-1.5">{line.replace('### ', '')}</h3>;
      }

      if (line.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-4 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 px-3 py-1.5 my-2 rounded-r-lg text-[11px] italic text-slate-500 dark:text-slate-400">
            {line.replace('> ', '')}
          </blockquote>
        );
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <ul key={i} className="list-disc list-inside ml-3 text-[11px] text-slate-600 dark:text-slate-400 my-0.5 font-medium leading-relaxed">
            <li>{line.trim().replace(/^[\-\*]\s+/, '')}</li>
          </ul>
        );
      }

      if (!line.trim()) {
        return <div key={i} className="h-1.5"></div>;
      }

      let renderedLine = line
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-gray-800/70 px-1 rounded font-mono text-[10px] text-indigo-500">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-indigo-500 hover:underline inline-flex items-center gap-0.5">$1 ↗</a>');

      return (
        <p
          key={i}
          className="text-[11px] text-slate-600 dark:text-slate-400 my-1 leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: renderedLine }}
        />
      );
    });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* 1. Global Insights Panel Section */}
      {!showBookmarksOnly && insights.length > 0 && (
        <div className="glass-card bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-500/10 p-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-xl">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-outfit text-slate-800 dark:text-white uppercase tracking-wide">
                Dashboard Global OSINT Insights
              </h2>
              <div className="mt-2 space-y-1 md:space-y-0.5">
                {insights.map((insight, idx) => (
                  <p key={idx} className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    {insight.description}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Statistical Metrics Cards */}
      <StatsCards stats={analytics?.stats} loading={loadingAnalytics} />

      {/* 3. Global Filters Pane */}
      <Filters />

      {/* 4. Dual Live Lookup & Column Explorer Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-6">
        
        {/* Left Column (GitHub Live Explorer) */}
        <div className="glass-card p-6 border-slate-100 dark:border-gray-800/80 bg-white/60 dark:bg-[#0f172a]/40 shadow-sm flex flex-col justify-between self-start min-h-[750px]">
          <div>
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800/60 pb-4 mb-4">
              <h2 className="text-md font-extrabold font-outfit text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <GithubIcon className="w-5 h-5 text-indigo-500" />
                GitHub Live Explorer
              </h2>
              
              {!activeRepoDetail && !showBookmarksOnly && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleExport('csv')}
                    className="btn-secondary py-1.5 px-3 text-[10px] uppercase tracking-wider flex items-center gap-1 font-extrabold text-slate-500 dark:text-slate-400"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="btn-secondary py-1.5 px-3 text-[10px] uppercase tracking-wider flex items-center gap-1 font-extrabold text-slate-500 dark:text-slate-400"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    JSON
                  </button>
                </div>
              )}
            </div>

            {/* Direct Input Search for GitHub */}
            {!activeRepoDetail && (
              <form onSubmit={handleLiveRepoSearch} className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                  Enter Repository Name to view Stars, Forks & README
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={liveRepoName}
                      onChange={(e) => setLiveRepoName(e.target.value)}
                      placeholder="e.g. facebook/react or vuejs/core"
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                    />
                    <Search className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingLiveRepo || !liveRepoName.trim()}
                    className="btn-primary py-2 px-4 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center gap-1 disabled:opacity-40"
                  >
                    {loadingLiveRepo ? 'Searching...' : 'Fetch Live'}
                  </button>
                </div>
                {errorLiveRepo && (
                  <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errorLiveRepo}
                  </p>
                )}
              </form>
            )}

            {/* Content Display: Detail Pane vs Feed Grid */}
            {activeRepoDetail ? (
              /* Inline Repository Document detail viewer */
              <div className="animate-scale-up space-y-5">
                {/* Header widget */}
                <div className="flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-gray-850 p-4 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/45 px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-900/30">
                      {activeRepoDetail.language || 'Unknown'}
                    </span>
                    <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-white mt-2 flex items-center gap-2">
                      {activeRepoDetail.fullName}
                      <a href={activeRepoDetail.repoUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {activeRepoDetail.description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleRepoFavoriteLive(activeRepoDetail._id)}
                      className={`p-2.5 rounded-xl border transition-all duration-200 ${
                        activeRepoDetail.isFavorite || favoriteRepos.some(r => r._id === activeRepoDetail._id)
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500 scale-105 shadow-sm'
                          : 'border-slate-200 dark:border-gray-850 text-slate-400 hover:text-slate-650'
                      }`}
                      title="Bookmark Repository"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => setActiveRepoDetail(null)}
                      className="btn-secondary py-2 px-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border-slate-200 dark:border-gray-800"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  </div>
                </div>

                {/* Glowing Badge metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass-card bg-slate-50/25 dark:bg-slate-900/20 p-3 flex flex-col justify-center border-slate-100 dark:border-gray-850">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" /> Stars
                    </span>
                    <span className="text-sm font-extrabold font-outfit text-slate-800 dark:text-white mt-1">
                      {activeRepoDetail.stars?.toLocaleString()}
                    </span>
                  </div>
                  <div className="glass-card bg-slate-50/25 dark:bg-slate-900/20 p-3 flex flex-col justify-center border-slate-100 dark:border-gray-850">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-indigo-500" /> Forks
                    </span>
                    <span className="text-sm font-extrabold font-outfit text-slate-800 dark:text-white mt-1">
                      {activeRepoDetail.forks?.toLocaleString()}
                    </span>
                  </div>
                  <div className="glass-card bg-slate-50/25 dark:bg-slate-900/20 p-3 flex flex-col justify-center border-slate-100 dark:border-gray-850">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Issues
                    </span>
                    <span className="text-sm font-extrabold font-outfit text-slate-800 dark:text-white mt-1">
                      {activeRepoDetail.issues || 0}
                    </span>
                  </div>
                  <div className="glass-card bg-slate-50/25 dark:bg-slate-900/20 p-3 flex flex-col justify-center border-slate-100 dark:border-gray-850">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-sky-500" /> Owner
                    </span>
                    <span className="text-xs font-extrabold font-outfit text-slate-800 dark:text-white mt-1truncate truncate block">
                      @{activeRepoDetail.owner}
                    </span>
                  </div>
                </div>

                {/* Readme scrollable text pane container */}
                <div className="glass-card bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-gray-800 p-5 overflow-y-auto max-h-[500px] border shadow-inner">
                  <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 pb-2 border-b border-slate-100 dark:border-gray-850 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    README.md Content
                  </h4>
                  <div className="prose dark:prose-invert max-w-none break-words">
                    {activeRepoDetail.readme ? renderMarkdown(activeRepoDetail.readme) : (
                      <p className="text-xs text-slate-400 italic">No README content available.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Repos Feed Lists Panel */
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold font-outfit text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${(selectedLanguage || minStars > 1000 || maxStars < 250000 || minForks > 0) ? 'bg-green-500 animate-pulse' : 'bg-indigo-500'}`}></span>
                  {showBookmarksOnly 
                    ? 'Bookmarked Repositories Feed' 
                    : (selectedLanguage || minStars > 1000 || maxStars < 250000 || minForks > 0)
                      ? 'Filtered Collection Feed (Showing Ratings, Forks & READMEs)' 
                      : 'Trending Repositories Feed'}
                </h3>

                {showBookmarksOnly ? (
                  favoriteRepos.length === 0 ? (
                    <div className="glass-card py-16 flex flex-col items-center justify-center border-slate-100 dark:border-gray-850 bg-slate-50/10">
                      <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-500">No bookmarked repositories found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favoriteRepos.map((repo) => (
                        <RepoCard key={repo._id} repo={repo} onClick={() => handleOpenRepoDetail(repo)} />
                      ))}
                    </div>
                  )
                ) : loadingRepos ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RepoCardSkeleton />
                    <RepoCardSkeleton />
                    <RepoCardSkeleton />
                    <RepoCardSkeleton />
                  </div>
                ) : errorRepos ? (
                  <div className="glass-card py-16 flex flex-col items-center justify-center border-red-100 dark:border-red-950/20 bg-red-50/10">
                    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-xs font-bold text-red-655 dark:text-red-400">Database server connection timed out</p>
                  </div>
                ) : repositories.length === 0 ? (
                  <div className="glass-card py-16 flex flex-col items-center justify-center border-slate-100 dark:border-gray-850">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">No matching repositories found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {repositories.map((repo) => (
                      <RepoCard key={repo._id} repo={repo} onClick={() => handleOpenRepoDetail(repo)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GitHub pagination */}
          {!activeRepoDetail && !showBookmarksOnly && repositories.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-6 border-t border-slate-100 dark:border-gray-800/40 pt-4">
              <button
                onClick={() => setRepoPage((p) => Math.max(1, p - 1))}
                disabled={repoPage === 1}
                className="btn-secondary p-1.5 rounded-xl text-slate-650 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase">
                Page {repoPage} of {repoTotalPages}
              </span>
              <button
                onClick={() => setRepoPage((p) => Math.min(repoTotalPages, p + 1))}
                disabled={repoPage === repoTotalPages}
                className="btn-secondary p-1.5 rounded-xl text-slate-650 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column (Reddit Subreddit/Discussions Live Explorer) */}
        <div className="glass-card p-6 border-slate-100 dark:border-gray-800/80 bg-white/60 dark:bg-[#0f172a]/40 shadow-sm flex flex-col justify-between self-start min-h-[750px]">
          <div>
            {/* Column Header */}
            <div className="flex flex-col border-b border-slate-100 dark:border-gray-800/60 pb-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-md font-extrabold font-outfit text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                  Reddit Discussions Explorer
                </h2>
                {liveRedditPosts && (
                  <button
                    onClick={() => {
                      setLiveRedditPosts(null);
                      setLiveRedditQuery('');
                      setActiveRedditPostDetail(null);
                      setSelectedRedditPost(null);
                    }}
                    className="btn-secondary py-1 px-3 text-[9px] uppercase tracking-wider font-extrabold border-slate-200 dark:border-gray-800"
                  >
                    ← Back to global trending
                  </button>
                )}
              </div>

              {/* Subreddit filter tabs */}
              {!activeRedditPostDetail && !showBookmarksOnly && !liveRedditPosts && (
                <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  {subredditsFilter.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSubreddit(sub === 'All' ? '' : sub)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        (sub === 'All' && !selectedSubreddit) || selectedSubreddit === sub.toLowerCase()
                          ? 'bg-white dark:bg-[#161e31] text-orange-500 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subreddit Live Search Field */}
            {!activeRedditPostDetail && (
              <form onSubmit={handleLiveRedditSearch} className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                  Enter Subreddit/Keyword to pull live discussions
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={liveRedditQuery}
                      onChange={(e) => setLiveRedditQuery(e.target.value)}
                      placeholder="e.g. r/javascript or opensource"
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                    />
                    <Search className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingLiveReddit || !liveRedditQuery.trim()}
                    className="btn-primary py-2 px-4 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center gap-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-40"
                  >
                    {loadingLiveReddit ? 'Searching...' : 'Search Reddit'}
                  </button>
                </div>
                {errorLiveReddit && (
                  <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errorLiveReddit}
                  </p>
                )}
              </form>
            )}

            {/* Display: Comments Detail Pane vs List feed */}
            {activeRedditPostDetail ? (
              /* Inline Reddit post detail & comments thread reader view */
              <div className="animate-scale-up space-y-4">
                {/* Topic info card */}
                <div className="flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-gray-850 p-4 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/50 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-full">
                      r/{activeRedditPostDetail.subreddit}
                    </span>
                    <h3 className="text-sm font-bold font-outfit text-slate-800 dark:text-white mt-2 leading-snug">
                      {activeRedditPostDetail.title}
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-1 font-medium">
                      Posted by u/{activeRedditPostDetail.author}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleToggleRedditFavoriteLive(selectedRedditPost?._id)}
                      className={`p-2.5 rounded-xl border transition-all duration-200 ${
                        selectedRedditPost?.isFavorite || favoritePosts.some(p => p._id === selectedRedditPost?._id)
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-500 scale-105 shadow-sm'
                          : 'border-slate-200 dark:border-gray-850 text-slate-400 hover:text-slate-650'
                      }`}
                      title="Bookmark Discussion"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveRedditPostDetail(null);
                        setSelectedRedditPost(null);
                      }}
                      className="btn-secondary py-2 px-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1 border-slate-200 dark:border-gray-800"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card bg-slate-50/25 dark:bg-slate-900/20 p-3 flex flex-col justify-center border-slate-100 dark:border-gray-850">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-orange-500" /> Score
                    </span>
                    <span className="text-sm font-extrabold font-outfit text-slate-800 dark:text-white mt-1">
                      {activeRedditPostDetail.upvotes?.toLocaleString()}
                    </span>
                  </div>
                  <div className="glass-card bg-slate-50/25 dark:bg-slate-900/20 p-3 flex flex-col justify-center border-slate-100 dark:border-gray-850">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Comments
                    </span>
                    <span className="text-sm font-extrabold font-outfit text-slate-800 dark:text-white mt-1">
                      {activeRedditPostDetail.comments?.length || 0} top threads
                    </span>
                  </div>
                </div>

                {/* Post body selftext markup box */}
                {activeRedditPostDetail.selftext && activeRedditPostDetail.selftext !== 'No text content provided.' && (
                  <div className="glass-card bg-white dark:bg-[#111827] border-slate-100 dark:border-gray-850 p-4 shadow-sm max-h-[220px] overflow-y-auto">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2 border-b border-slate-50 dark:border-gray-850 pb-1">
                      Post Content Markdown
                    </span>
                    <div className="prose dark:prose-invert max-w-none text-xs">
                      {renderMarkdown(activeRedditPostDetail.selftext)}
                    </div>
                  </div>
                )}

                {/* top parent comments feed */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-outfit text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1 border-t border-slate-100 dark:border-gray-800/40 pt-3">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                    Top Parent discussions ({activeRedditPostDetail.comments?.length || 0})
                  </h4>

                  {activeRedditPostDetail.comments?.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No comments could be retrieved for this post.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {activeRedditPostDetail.comments?.map((comment, index) => (
                        <div key={index} className="glass-card p-3.5 bg-slate-50/20 dark:bg-slate-900/10 border-slate-100 dark:border-gray-850/80 shadow-sm relative group hover:border-orange-500/20 transition-all duration-200">
                          <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <CornerDownRight className="w-3.5 h-3.5 text-orange-400" />
                              u/{comment.author}
                            </span>
                            <span className="flex items-center gap-0.5 text-orange-500 uppercase tracking-widest text-[8px] border border-orange-500/10 px-1.5 py-0.5 rounded-md">
                              {comment.upvotes} points
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-655 dark:text-slate-300 font-medium whitespace-pre-wrap select-text pr-2">
                            {comment.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Lists Feeds View */
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold font-outfit text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {showBookmarksOnly ? 'Bookmarked Discussions Feed' : 'Developer Discussions Feed'}
                </h3>

                {loadingLiveReddit ? (
                  <div className="space-y-4 animate-pulse">
                    <RedditCardSkeleton />
                    <RedditCardSkeleton />
                    <RedditCardSkeleton />
                    <RedditCardSkeleton />
                  </div>
                ) : showBookmarksOnly ? (
                  favoritePosts.length === 0 ? (
                    <div className="glass-card py-16 flex flex-col items-center justify-center border-slate-100 dark:border-gray-850 bg-slate-50/10">
                      <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-500">No bookmarked discussions found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoritePosts.map((post) => (
                        <RedditCard key={post._id} post={post} onClick={() => handleOpenRedditPostDetail(post)} />
                      ))}
                    </div>
                  )
                ) : liveRedditPosts ? (
                  /* Display searched subreddit/discussions results */
                  liveRedditPosts.length === 0 ? (
                    <div className="glass-card py-16 flex flex-col items-center justify-center border-slate-100 dark:border-gray-850">
                      <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-500">No live discussions matching search.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {liveRedditPosts.map((post) => (
                        <RedditCard key={post._id} post={post} onClick={() => handleOpenRedditPostDetail(post)} />
                      ))}
                    </div>
                  )
                ) : loadingReddit ? (
                  <div className="space-y-4">
                    <RedditCardSkeleton />
                    <RedditCardSkeleton />
                    <RedditCardSkeleton />
                    <RedditCardSkeleton />
                  </div>
                ) : errorReddit ? (
                  <div className="glass-card py-16 flex flex-col items-center justify-center border-red-100 dark:border-red-950/20 bg-red-50/10">
                    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-xs font-bold text-red-655 dark:text-red-400">Database server connection timed out</p>
                  </div>
                ) : redditPosts.length === 0 ? (
                  <div className="glass-card py-16 flex flex-col items-center justify-center border-slate-100 dark:border-gray-850">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">No matching discussions found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {redditPosts.map((post) => (
                      <RedditCard key={post._id} post={post} onClick={() => handleOpenRedditPostDetail(post)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reddit pagination */}
          {!activeRedditPostDetail && !showBookmarksOnly && !liveRedditPosts && redditPosts.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-6 border-t border-slate-100 dark:border-gray-800/40 pt-4">
              <button
                onClick={() => setRedditPage((p) => Math.max(1, p - 1))}
                disabled={redditPage === 1}
                className="btn-secondary p-1.5 rounded-xl text-slate-650 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase">
                Page {redditPage} of {redditTotalPages}
              </span>
              <button
                onClick={() => setRedditPage((p) => Math.min(redditTotalPages, p + 1))}
                disabled={redditPage === redditTotalPages}
                className="btn-secondary p-1.5 rounded-xl text-slate-650 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Dynamic comments loading state overlay indicator */}
      {loadingRedditComments && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-500/35 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-white animate-pulse">
              Syncing Reddit Discussion Thread...
            </p>
          </div>
        </div>
      )}

      {errorRedditComments && (
        <div className="fixed bottom-6 right-6 glass-card border-red-500/30 bg-red-950/90 text-white p-4 rounded-xl shadow-lg flex items-center gap-2 max-w-sm z-50 animate-scale-up">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-red-400">Comments error</p>
            <p className="text-[10px] text-slate-300 mt-0.5">{errorRedditComments}</p>
          </div>
          <button onClick={() => setErrorRedditComments(null)} className="text-xs text-slate-450 hover:text-white uppercase font-bold ml-auto pl-2">Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
