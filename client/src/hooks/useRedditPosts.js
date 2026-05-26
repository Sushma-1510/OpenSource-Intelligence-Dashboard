import { useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../services/api';
import { DashboardContext } from '../context/DashboardContext';

export const useRedditPosts = () => {
  const { redditSearch } = useContext(DashboardContext);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSubreddit, setSelectedSubreddit] = useState('');

  const fetchPosts = useCallback(async (currentPage, activeSearch, activeSubreddit) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sort: 'upvotes',
        order: 'desc',
      };

      if (activeSearch) params.search = activeSearch;
      if (activeSubreddit) params.subreddit = activeSubreddit;

      const response = await apiClient.get('/reddit/posts', { params });
      
      setPosts(response.data || []);
      setTotalPages(response.pages || 1);
      setTotalCount(response.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch Reddit discussions');
      console.error('[useRedditPosts] Error fetching Reddit posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch with debounced search/filters
  useEffect(() => {
    setPage(1);
    
    const delayDebounceFn = setTimeout(() => {
      fetchPosts(1, redditSearch, selectedSubreddit);
    }, 400); // 400ms debounce buffer

    return () => clearTimeout(delayDebounceFn);
  }, [redditSearch, selectedSubreddit, fetchPosts]);

  // Fetch subsequent pages
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, redditSearch, selectedSubreddit);
    }
  }, [page, redditSearch, selectedSubreddit, fetchPosts]);

  return {
    posts,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    setPage,
    selectedSubreddit,
    setSelectedSubreddit,
    refetch: () => fetchPosts(page, redditSearch, selectedSubreddit)
  };
};
