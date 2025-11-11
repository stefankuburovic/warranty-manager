const { Product, Category, Store } = require('../models');
const { Op } = require('sequelize');
const { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  format,
  differenceInDays,
  startOfYear,
  endOfYear
} = require('date-fns');

// Get comprehensive analytics
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { period = '6months' } = req.query; // 1month, 3months, 6months, 1year, all

    // Calculate date range
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case '1month':
        startDate = subMonths(endDate, 1);
        break;
      case '3months':
        startDate = subMonths(endDate, 3);
        break;
      case '6months':
        startDate = subMonths(endDate, 6);
        break;
      case '1year':
        startDate = subMonths(endDate, 12);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Far back date
        break;
      default:
        startDate = subMonths(endDate, 6);
    }

    // Get all products in date range
    const products = await Product.findAll({
      where: {
        user_id: userId,
        is_active: true,
        purchase_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'] },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ],
      order: [['purchase_date', 'ASC']]
    });

    // Calculate overview statistics
    const totalProducts = products.length;
    const totalSpent = products.reduce((sum, p) => sum + (parseFloat(p.purchase_price) || 0), 0);
    const avgPrice = totalProducts > 0 ? totalSpent / totalProducts : 0;
    const maxPrice = products.length > 0 
      ? Math.max(...products.map(p => parseFloat(p.purchase_price) || 0)) 
      : 0;
    
    const today = new Date();
    const activeWarranties = products.filter(p => new Date(p.warranty_end_date) >= today).length;
    const expiredWarranties = totalProducts - activeWarranties;

    // Spending by month
    const monthlySpending = {};
    products.forEach(product => {
      const monthKey = format(new Date(product.purchase_date), 'yyyy-MM');
      if (!monthlySpending[monthKey]) {
        monthlySpending[monthKey] = {
          month: format(new Date(product.purchase_date), 'MMM yyyy'),
          amount: 0,
          count: 0
        };
      }
      monthlySpending[monthKey].amount += parseFloat(product.purchase_price) || 0;
      monthlySpending[monthKey].count += 1;
    });

    const monthlyData = Object.values(monthlySpending).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );

    // Spending by category
    const categorySpending = {};
    products.forEach(product => {
      if (product.Category) {
        const catId = product.Category.category_id;
        if (!categorySpending[catId]) {
          categorySpending[catId] = {
            category_id: catId,
            category_name: product.Category.category_name,
            icon_name: product.Category.icon_name,
            amount: 0,
            count: 0,
            percentage: 0
          };
        }
        categorySpending[catId].amount += parseFloat(product.purchase_price) || 0;
        categorySpending[catId].count += 1;
      }
    });

    // Calculate percentages
    Object.values(categorySpending).forEach(cat => {
      cat.percentage = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
    });

    const categoryData = Object.values(categorySpending).sort((a, b) => b.amount - a.amount);

    // Spending by store
    const storeSpending = {};
    products.forEach(product => {
      if (product.Store) {
        const storeId = product.Store.store_id;
        if (!storeSpending[storeId]) {
          storeSpending[storeId] = {
            store_id: storeId,
            store_name: product.Store.store_name,
            store_chain: product.Store.store_chain,
            amount: 0,
            count: 0,
            percentage: 0
          };
        }
        storeSpending[storeId].amount += parseFloat(product.purchase_price) || 0;
        storeSpending[storeId].count += 1;
      }
    });

    // Calculate percentages
    Object.values(storeSpending).forEach(store => {
      store.percentage = totalSpent > 0 ? (store.amount / totalSpent) * 100 : 0;
    });

    const storeData = Object.values(storeSpending).sort((a, b) => b.amount - a.amount);

    // Calculate trends
    const lastMonthStart = subMonths(endDate, 1);
    const lastMonthProducts = products.filter(p => 
      new Date(p.purchase_date) >= lastMonthStart
    );
    const lastMonthSpent = lastMonthProducts.reduce((sum, p) => 
      sum + (parseFloat(p.purchase_price) || 0), 0
    );

    const previousMonthStart = subMonths(endDate, 2);
    const previousMonthEnd = subMonths(endDate, 1);
    const previousMonthProducts = products.filter(p => {
      const date = new Date(p.purchase_date);
      return date >= previousMonthStart && date < previousMonthEnd;
    });
    const previousMonthSpent = previousMonthProducts.reduce((sum, p) => 
      sum + (parseFloat(p.purchase_price) || 0), 0
    );

    const spendingChange = previousMonthSpent > 0 
      ? ((lastMonthSpent - previousMonthSpent) / previousMonthSpent) * 100 
      : 0;

    // Warranty expiration forecast (next 6 months)
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const expiringProducts = await Product.findAll({
      where: {
        user_id: userId,
        is_active: true,
        warranty_end_date: {
          [Op.between]: [today, sixMonthsFromNow]
        }
      },
      order: [['warranty_end_date', 'ASC']]
    });

    const expirationForecast = {};
    expiringProducts.forEach(product => {
      const monthKey = format(new Date(product.warranty_end_date), 'yyyy-MM');
      if (!expirationForecast[monthKey]) {
        expirationForecast[monthKey] = {
          month: format(new Date(product.warranty_end_date), 'MMM yyyy'),
          count: 0
        };
      }
      expirationForecast[monthKey].count += 1;
    });

    const expirationData = Object.values(expirationForecast).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );

    // Top categories (by count and value)
    const topCategoryByCount = categoryData.length > 0 ? categoryData[0] : null;
    const topCategoryByValue = categoryData.length > 0 
      ? categoryData.reduce((max, cat) => cat.amount > max.amount ? cat : max, categoryData[0])
      : null;

    // Most expensive product
    const mostExpensive = products.length > 0
      ? products.reduce((max, p) => 
          (parseFloat(p.purchase_price) || 0) > (parseFloat(max.purchase_price) || 0) ? p : max
        )
      : null;

    res.json({
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      overview: {
        total_products: totalProducts,
        total_spent: totalSpent,
        average_price: avgPrice,
        max_price: maxPrice,
        active_warranties: activeWarranties,
        expired_warranties: expiredWarranties
      },
      trends: {
        last_month_spent: lastMonthSpent,
        previous_month_spent: previousMonthSpent,
        spending_change: spendingChange,
        spending_trend: spendingChange > 0 ? 'increasing' : spendingChange < 0 ? 'decreasing' : 'stable'
      },
      charts: {
        monthly_spending: monthlyData,
        category_breakdown: categoryData,
        store_breakdown: storeData,
        expiration_forecast: expirationData
      },
      insights: {
        top_category_by_count: topCategoryByCount,
        top_category_by_value: topCategoryByValue,
        most_expensive_product: mostExpensive ? {
          product_id: mostExpensive.product_id,
          product_name: mostExpensive.product_name,
          price: mostExpensive.purchase_price,
          purchase_date: mostExpensive.purchase_date
        } : null
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Get detailed category analytics
exports.getCategoryAnalytics = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { category_id } = req.params;

    const products = await Product.findAll({
      where: {
        user_id: userId,
        category_id: parseInt(category_id),
        is_active: true
      },
      include: [
        { model: Store, attributes: ['store_name'] }
      ],
      order: [['purchase_date', 'DESC']]
    });

    const totalSpent = products.reduce((sum, p) => sum + (parseFloat(p.purchase_price) || 0), 0);
    const avgPrice = products.length > 0 ? totalSpent / products.length : 0;

    // Monthly breakdown
    const monthlyData = {};
    products.forEach(p => {
      const month = format(new Date(p.purchase_date), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      monthlyData[month].count += 1;
      monthlyData[month].amount += parseFloat(p.purchase_price) || 0;
    });

    res.json({
      category_id: parseInt(category_id),
      total_products: products.length,
      total_spent: totalSpent,
      average_price: avgPrice,
      monthly_breakdown: monthlyData,
      products: products.slice(0, 10) // Recent 10 products
    });

  } catch (error) {
    console.error('Get category analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
};

// Get spending comparison
exports.getSpendingComparison = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { type = 'monthly' } = req.query; // monthly, quarterly, yearly

    const currentYear = new Date().getFullYear();
    const products = await Product.findAll({
      where: {
        user_id: userId,
        is_active: true,
        purchase_date: {
          [Op.gte]: new Date(`${currentYear - 1}-01-01`)
        }
      },
      order: [['purchase_date', 'ASC']]
    });

    let comparisonData = [];

    if (type === 'monthly') {
      // Compare last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const monthProducts = products.filter(p => {
          const pDate = new Date(p.purchase_date);
          return pDate >= monthStart && pDate <= monthEnd;
        });

        const monthSpent = monthProducts.reduce((sum, p) => 
          sum + (parseFloat(p.purchase_price) || 0), 0
        );

        comparisonData.push({
          period: format(date, 'MMM yyyy'),
          amount: monthSpent,
          count: monthProducts.length
        });
      }
    } else if (type === 'yearly') {
      // Compare last 3 years
      for (let year = currentYear - 2; year <= currentYear; year++) {
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(new Date(year, 11, 31));
        
        const yearProducts = products.filter(p => {
          const pDate = new Date(p.purchase_date);
          return pDate >= yearStart && pDate <= yearEnd;
        });

        const yearSpent = yearProducts.reduce((sum, p) => 
          sum + (parseFloat(p.purchase_price) || 0), 0
        );

        comparisonData.push({
          period: year.toString(),
          amount: yearSpent,
          count: yearProducts.length
        });
      }
    }

    res.json({
      comparison_type: type,
      data: comparisonData
    });

  } catch (error) {
    console.error('Get spending comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch spending comparison' });
  }
};

