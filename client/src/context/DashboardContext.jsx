import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  // Theme Dark Mode State (initial check in localStorage)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to modern premium dark theme!
  });

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [redditSearch, setRedditSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [minStars, setMinStars] = useState(1000);
  const [maxStars, setMaxStars] = useState(250000);
  const [minForks, setMinForks] = useState(0);
  const [sortBy, setSortBy] = useState('stars');
  
  // Bookmarks Toggle & Cache
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [favoriteRepos, setFavoriteRepos] = useState([]);
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Sync dark class on body element
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load favorites from API
  const fetchFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    try {
      const [repoFavs, postFavs] = await Promise.all([
        apiClient.get('/github/favorites'),
        apiClient.get('/reddit/favorites'),
      ]);
      setFavoriteRepos(repoFavs.data || []);
      setFavoritePosts(postFavs.data || []);
    } catch (error) {
      console.error('[DashboardContext] Failed to load favorites:', error.message);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  // Fetch bookmarks on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Toggle GitHub Repository Favorite
  const toggleFavoriteRepo = async (repoId) => {
    try {
      const res = await apiClient.post('/github/favorites', { repositoryId: repoId });
      
      // Re-fetch all favorites to ensure database synchronization
      await fetchFavorites();
      return res;
    } catch (err) {
      console.error('[DashboardContext] Error toggling repository bookmark:', err.message);
    }
  };

  // Toggle Reddit Post Favorite
  const toggleFavoritePost = async (postId) => {
    try {
      const res = await apiClient.post('/reddit/favorites', { postId });
      
      // Re-fetch all favorites
      await fetchFavorites();
      return res;
    } catch (err) {
      console.error('[DashboardContext] Error toggling Reddit post bookmark:', err.message);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        searchQuery,
        setSearchQuery,
        redditSearch,
        setRedditSearch,
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
        setShowBookmarksOnly,
        favoriteRepos,
        favoritePosts,
        loadingFavorites,
        toggleFavoriteRepo,
        toggleFavoritePost,
        refreshFavorites: fetchFavorites
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
