const { Product, Category, Store, SearchHistory, sequelize } = require('../models');
const { Op } = require('sequelize');
const Fuse = require('fuse.js');

class SearchService {
  
  // Main search function
  async searchProducts(userId, searchQuery, filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'relevance'
      } = options;

      // Build base query
      const whereClause = {
        user_id: userId,
        is_active: true
      };

      // Apply filters
      if (filters.categories && filters.categories.length > 0) {
        whereClause.category_id = { [Op.in]: filters.categories };
      }

      if (filters.stores && filters.stores.length > 0) {
        whereClause.store_id = { [Op.in]: filters.stores };
      }

      if (filters.status) {
        const today = new Date();
        
        switch (filters.status) {
          case 'active':
            whereClause.warranty_end_date = { [Op.gte]: today };
            break;
          case 'expiring':
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            whereClause.warranty_end_date = {
              [Op.between]: [today, thirtyDaysFromNow]
            };
            break;
          case 'expired':
            whereClause.warranty_end_date = { [Op.lt]: today };
            break;
        }
      }

      if (filters.priceRange) {
        whereClause.purchase_price = {
          [Op.between]: [filters.priceRange.min, filters.priceRange.max]
        };
      }

      if (filters.purchaseDateRange) {
        whereClause.purchase_date = {
          [Op.between]: [
            new Date(filters.purchaseDateRange.start),
            new Date(filters.purchaseDateRange.end)
          ]
        };
      }

      if (filters.warrantyDateRange) {
        whereClause.warranty_end_date = {
          [Op.between]: [
            new Date(filters.warrantyDateRange.start),
            new Date(filters.warrantyDateRange.end)
          ]
        };
      }

      // If there's a search query, use different strategy
      if (searchQuery && searchQuery.trim().length > 0) {
        return await this.searchWithQuery(userId, searchQuery, whereClause, options);
      }

      // No search query, just filtered results
      const order = this.getSortOrder(sortBy);
      const offset = (page - 1) * limit;

      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] },
          { model: Store, attributes: ['store_id', 'store_name', 'store_chain'] }
        ],
        order,
        limit,
        offset
      });

      return {
        products: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        hasMore: page < Math.ceil(count / limit)
      };

    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  // Search with query string
  async searchWithQuery(userId, searchQuery, baseWhere, options) {
    const { page = 1, limit = 20, sortBy = 'relevance' } = options;

    // Parse search operators
    const parsedQuery = this.parseSearchQuery(searchQuery);

    // Get all products matching base filters
    const products = await Product.findAll({
      where: baseWhere,
      include: [
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] },
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'] }
      ]
    });

    // Use Fuse.js for fuzzy search
    const fuse = new Fuse(products.map(p => p.toJSON()), {
      keys: [
        { name: 'product_name', weight: 0.3 },
        { name: 'brand', weight: 0.2 },
        { name: 'model_number', weight: 0.2 },
        { name: 'serial_number', weight: 0.1 },
        { name: 'notes', weight: 0.1 },
        { name: 'Category.category_name', weight: 0.05 },
        { name: 'Store.store_name', weight: 0.05 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true
    });

    // Search
    let results = parsedQuery.mainQuery.trim() ? fuse.search(parsedQuery.mainQuery) : products.map(p => ({ item: p.toJSON(), score: 0, matches: [] }));

    // Apply operators
    if (parsedQuery.mustInclude.length > 0) {
      results = results.filter(result => {
        const text = this.getProductSearchText(result.item).toLowerCase();
        return parsedQuery.mustInclude.every(term => text.includes(term.toLowerCase()));
      });
    }

    if (parsedQuery.mustExclude.length > 0) {
      results = results.filter(result => {
        const text = this.getProductSearchText(result.item).toLowerCase();
        return !parsedQuery.mustExclude.some(term => text.includes(term.toLowerCase()));
      });
    }

    // Sort if not by relevance
    if (sortBy !== 'relevance') {
      const sortedProducts = this.sortProducts(
        results.map(r => r.item),
        sortBy
      );
      results = sortedProducts.map(item => ({ item, score: 0, matches: [] }));
    }

    // Paginate
    const offset = (page - 1) * limit;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      products: paginatedResults.map(r => r.item),
      total: results.length,
      page,
      totalPages: Math.ceil(results.length / limit),
      hasMore: page < Math.ceil(results.length / limit),
      matches: paginatedResults.map(r => r.matches)
    };
  }

  // Parse search query for operators
  parseSearchQuery(query) {
    const mustInclude = [];
    const mustExclude = [];
    let mainQuery = query;

    // Extract quoted phrases (exact match)
    const quotedRegex = /"([^"]+)"/g;
    let match;
    while ((match = quotedRegex.exec(query)) !== null) {
      mustInclude.push(match[1]);
      mainQuery = mainQuery.replace(match[0], '');
    }

    // Extract NOT terms
    const notRegex = /-(\w+)/g;
    while ((match = notRegex.exec(query)) !== null) {
      mustExclude.push(match[1]);
      mainQuery = mainQuery.replace(match[0], '');
    }

    // Extract AND terms (treat as must include)
    const andRegex = /\+(\w+)/g;
    while ((match = andRegex.exec(query)) !== null) {
      mustInclude.push(match[1]);
      mainQuery = mainQuery.replace(match[0], '');
    }

    return {
      mainQuery: mainQuery.trim(),
      mustInclude,
      mustExclude
    };
  }

  getProductSearchText(product) {
    return [
      product.product_name,
      product.brand,
      product.model_number,
      product.serial_number,
      product.notes,
      product.Category?.category_name,
      product.Store?.store_name
    ].filter(Boolean).join(' ');
  }

  sortProducts(products, sortBy) {
    const sortFunctions = {
      'name_asc': (a, b) => a.product_name.localeCompare(b.product_name),
      'name_desc': (a, b) => b.product_name.localeCompare(a.product_name),
      'price_asc': (a, b) => (parseFloat(a.purchase_price) || 0) - (parseFloat(b.purchase_price) || 0),
      'price_desc': (a, b) => (parseFloat(b.purchase_price) || 0) - (parseFloat(a.purchase_price) || 0),
      'purchase_date_asc': (a, b) => new Date(a.purchase_date) - new Date(b.purchase_date),
      'purchase_date_desc': (a, b) => new Date(b.purchase_date) - new Date(a.purchase_date),
      'warranty_expiry_asc': (a, b) => new Date(a.warranty_end_date || 0) - new Date(b.warranty_end_date || 0),
      'warranty_expiry_desc': (a, b) => new Date(b.warranty_end_date || 0) - new Date(a.warranty_end_date || 0)
    };

    return products.sort(sortFunctions[sortBy] || sortFunctions['purchase_date_desc']);
  }

  getSortOrder(sortBy) {
    const sortMap = {
      'name_asc': [['product_name', 'ASC']],
      'name_desc': [['product_name', 'DESC']],
      'price_asc': [['purchase_price', 'ASC']],
      'price_desc': [['purchase_price', 'DESC']],
      'purchase_date_asc': [['purchase_date', 'ASC']],
      'purchase_date_desc': [['purchase_date', 'DESC']],
      'warranty_expiry_asc': [['warranty_end_date', 'ASC']],
      'warranty_expiry_desc': [['warranty_end_date', 'DESC']]
    };

    return sortMap[sortBy] || sortMap['purchase_date_desc'];
  }

  // Get search suggestions
  async getSearchSuggestions(userId, query, limit = 5) {
    try {
      // Get from search history
      const history = await SearchHistory.findAll({
        where: {
          user_id: userId,
          search_query: {
            [Op.like]: `%${query}%`
          }
        },
        order: [['created_at', 'DESC']],
        limit,
        attributes: ['search_query', 'results_count']
      });

      // Get product names/brands that match
      const products = await Product.findAll({
        where: {
          user_id: userId,
          is_active: true,
          [Op.or]: [
            { product_name: { [Op.iLike]: `%${query}%` } },
            { brand: { [Op.iLike]: `%${query}%` } },
            { model_number: { [Op.iLike]: `%${query}%` } }
          ]
        },
        limit: 5,
        attributes: ['product_name', 'brand', 'model_number']
      });

      const suggestions = [
        ...history.map(h => ({
          type: 'history',
          text: h.search_query,
          count: h.results_count
        })),
        ...products.map(p => ({
          type: 'product',
          text: p.product_name,
          brand: p.brand
        }))
      ];

      // Remove duplicates
      const unique = suggestions.filter((item, index, self) =>
        index === self.findIndex(t => t.text === item.text)
      );

      return unique.slice(0, limit);

    } catch (error) {
      console.error('Get search suggestions error:', error);
      return [];
    }
  }

  // Save search to history
  async saveSearchHistory(userId, searchQuery, filters, resultsCount) {
    try {
      await SearchHistory.create({
        user_id: userId,
        search_query: searchQuery,
        filters,
        results_count: resultsCount
      });

      // Keep only last 50 searches
      const allHistory = await SearchHistory.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        offset: 50
      });

      if (allHistory.length > 0) {
        await SearchHistory.destroy({
          where: {
            history_id: {
              [Op.in]: allHistory.map(h => h.history_id)
            }
          }
        });
      }

    } catch (error) {
      console.error('Save search history error:', error);
    }
  }

  // Get popular searches
  async getPopularSearches(userId, limit = 10) {
    try {
      const searches = await SearchHistory.findAll({
        where: { user_id: userId },
        attributes: [
          'search_query',
          [sequelize.fn('COUNT', sequelize.col('search_query')), 'count']
        ],
        group: ['search_query'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit,
        raw: true
      });

      return searches;

    } catch (error) {
      console.error('Get popular searches error:', error);
      return [];
    }
  }
}

module.exports = new SearchService();

