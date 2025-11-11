const searchService = require('../services/searchService');
const { SavedSearch, SearchHistory } = require('../models');
const { Op } = require('sequelize');

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { query, filters, page, limit, sortBy } = req.body;

    const results = await searchService.searchProducts(
      userId,
      query,
      filters,
      { page, limit, sortBy }
    );

    // Save to search history if query exists
    if (query && query.trim().length > 0) {
      await searchService.saveSearchHistory(
        userId,
        query,
        filters,
        results.total
      );
    }

    res.json(results);

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get search suggestions
exports.getSearchSuggestions = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await searchService.getSearchSuggestions(userId, query);
    res.json({ suggestions });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

// Get search history
exports.getSearchHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 20 } = req.query;

    const history = await SearchHistory.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ history });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
};

// Clear search history
exports.clearSearchHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await SearchHistory.destroy({
      where: { user_id: userId }
    });

    res.json({ message: 'History cleared' });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};

// Save search
exports.saveSearch = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { searchName, searchQuery, filters, sortBy, isDefault } = req.body;

    if (!searchName) {
      return res.status(400).json({ error: 'Search name is required' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await SavedSearch.update(
        { is_default: false },
        { where: { user_id: userId } }
      );
    }

    const savedSearch = await SavedSearch.create({
      user_id: userId,
      search_name: searchName,
      search_query: searchQuery,
      filters,
      sort_by: sortBy,
      is_default: isDefault || false
    });

    res.json({ savedSearch });

  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
};

// Get saved searches
exports.getSavedSearches = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const searches = await SavedSearch.findAll({
      where: { user_id: userId },
      order: [['last_used_at', 'DESC NULLS LAST'], ['created_at', 'DESC']]
    });

    res.json({ searches });

  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ error: 'Failed to get saved searches' });
  }
};

// Update saved search
exports.updateSavedSearch = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { savedSearchId } = req.params;
    const updates = req.body;

    const search = await SavedSearch.findOne({
      where: {
        saved_search_id: parseInt(savedSearchId),
        user_id: userId
      }
    });

    if (!search) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    // If setting as default, unset others
    if (updates.is_default) {
      await SavedSearch.update(
        { is_default: false },
        { where: { user_id: userId } }
      );
    }

    await search.update(updates);

    res.json({ savedSearch: search });

  } catch (error) {
    console.error('Update saved search error:', error);
    res.status(500).json({ error: 'Failed to update search' });
  }
};

// Delete saved search
exports.deleteSavedSearch = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { savedSearchId } = req.params;

    const deleted = await SavedSearch.destroy({
      where: {
        saved_search_id: parseInt(savedSearchId),
        user_id: userId
      }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    res.json({ message: 'Search deleted' });

  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ error: 'Failed to delete search' });
  }
};

// Use saved search (increment usage)
exports.useSavedSearch = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { savedSearchId } = req.params;

    const search = await SavedSearch.findOne({
      where: {
        saved_search_id: parseInt(savedSearchId),
        user_id: userId
      }
    });

    if (!search) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    await search.update({
      usage_count: search.usage_count + 1,
      last_used_at: new Date()
    });

    res.json({ savedSearch: search });

  } catch (error) {
    console.error('Use saved search error:', error);
    res.status(500).json({ error: 'Failed to use search' });
  }
};

// Get popular searches
exports.getPopularSearches = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const popular = await searchService.getPopularSearches(userId, 10);

    res.json({ popular });

  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({ error: 'Failed to get popular searches' });
  }
};

