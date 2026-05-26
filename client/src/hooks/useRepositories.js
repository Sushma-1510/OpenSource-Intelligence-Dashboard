import { useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../services/api';
import { DashboardContext } from '../context/DashboardContext';

export const useRepositories = () => {
  const {
    searchQuery,
    selectedLanguage,
    minStars,
    maxStars,
    minForks,
    sortBy,
  } = useContext(DashboardContext);

  const [repositories, setRepositories] = useState([]);
  const [trendingRepos, setTrendingRepos] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced Search and Filter Fetching logic
  const fetchRepos = useCallback(async (currentPage, activeSearch) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sort: sortBy,
        order: 'desc',
      };

      if (activeSearch) params.search = activeSearch;
      if (selectedLanguage) params.language = selectedLanguage;
      if (minStars) params.minStars = minStars;
      if (maxStars) params.maxStars = maxStars;
      if (minForks) params.minForks = minForks;

      const response = await apiClient.get('/github/repositories', { params });
      
      setRepositories(response.data || []);
      setTotalPages(response.pages || 1);
      setTotalCount(response.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories');
      console.error('[useRepositories] Error fetching repos:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, minStars, maxStars, minForks, sortBy]);

  // Fetch repositories with debounced search
  useEffect(() => {
    // Reset page back to 1 when filters change
    setPage(1);
    
    const delayDebounceFn = setTimeout(() => {
      fetchRepos(1, searchQuery);
    }, 400); // 400ms debounce buffer

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedLanguage, minStars, maxStars, minForks, sortBy, fetchRepos]);

  // Fetch additional pages without resetting page counter
  useEffect(() => {
    if (page > 1) {
      fetchRepos(page, searchQuery);
    }
  }, [page, fetchRepos, searchQuery]);

  // Fetch static trending list (High TrendingScore)
  const fetchTrending = useCallback(async () => {
    setLoadingTrending(true);
    try {
      const response = await apiClient.get('/github/trending', { params: { limit: 5 } });
      setTrendingRepos(response.data || []);
    } catch (err) {
      console.error('[useRepositories] Error fetching trending repos:', err);
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return {
    repositories,
    trendingRepos,
    loading,
    loadingTrending,
    error,
    page,
    totalPages,
    totalCount,
    setPage,
    refetch: () => fetchRepos(page, searchQuery),
    refreshTrending: fetchTrending
  };
};
