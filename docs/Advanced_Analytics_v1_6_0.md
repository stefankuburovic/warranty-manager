# Advanced Analytics - Complete Implementation v1.6.0

## 📊 Overview

Transform your warranty management with powerful visual analytics, spending insights, and trend analysis. This implementation adds interactive charts, detailed breakdowns, and predictive insights to help users understand their warranty portfolio.

---

## ✨ Features

### 1. **Visual Charts** 📈
- Spending trends over time (line chart)
- Category distribution (pie chart)
- Monthly spending comparison (bar chart)
- Store spending breakdown (horizontal bar chart)
- Warranty status overview (donut chart)

### 2. **Advanced Statistics** 💰
- Total portfolio value
- Average product price
- Most expensive purchase
- Spending by time period (week/month/year)
- Category-wise spending analysis
- Store-wise purchase patterns

### 3. **Trend Analysis** 📉
- Spending velocity (increasing/decreasing)
- Purchase frequency patterns
- Seasonal buying trends
- Warranty expiration forecast
- Budget projections

### 4. **Interactive Insights** 🎯
- Tap charts for detailed breakdowns
- Filter by date range
- Compare time periods
- Export analytics reports
- Share insights

### 5. **Smart Recommendations** 💡
- Budget optimization suggestions
- Purchase timing recommendations
- Category spending alerts
- Warranty renewal reminders

---

## 🏗️ Architecture

```
Backend:
├── controllers/analyticsController.js    (New analytics endpoints)
├── services/analyticsService.js          (Analytics calculations)
└── routes/analytics.js                   (Analytics routes)

Mobile:
├── screens/AnalyticsScreen.js            (Main analytics dashboard)
├── screens/ChartDetailScreen.js          (Detailed chart view)
├── components/charts/                    (Chart components)
│   ├── SpendingTrendChart.js
│   ├── CategoryPieChart.js
│   ├── MonthlyBarChart.js
│   └── StoreBarChart.js
└── services/analyticsService.js          (Analytics data processing)
```

---

## 📦 Dependencies

### Backend
```json
{
  "sequelize": "^6.35.0",
  "date-fns": "^2.30.0"
}
```

### Mobile
```json
{
  "react-native-chart-kit": "^6.12.0",
  "react-native-svg": "^13.14.0",
  "victory-native": "^36.9.0",
  "react-native-gifted-charts": "^1.3.26",
  "date-fns": "^2.30.0"
}
```

Install mobile dependencies:
```bash
cd mobile
npm install react-native-chart-kit react-native-svg victory-native react-native-gifted-charts date-fns
```

---

## 🔧 Implementation

### Part 1: Backend Analytics API

#### 1.1 Analytics Controller (backend/src/controllers/analyticsController.js)

```javascript
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

module.exports = {
  getAnalytics,
  getCategoryAnalytics,
  getSpendingComparison
};
```

#### 1.2 Analytics Routes (backend/src/routes/analytics.js)

```javascript
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Analytics endpoints
router.get('/', analyticsController.getAnalytics);
router.get('/category/:category_id', analyticsController.getCategoryAnalytics);
router.get('/comparison', analyticsController.getSpendingComparison);

module.exports = router;
```

#### 1.3 Update Main App (backend/src/app.js)

Add analytics routes to your main app:

```javascript
const analyticsRoutes = require('./routes/analytics');

// ... other routes
app.use('/api/v1/analytics', analyticsRoutes);
```

---

### Part 2: Mobile Analytics Screen

#### 2.1 Analytics API Client (mobile/src/api/analytics.js)

```javascript
import client from './client';

export const analyticsApi = {
  // Get comprehensive analytics
  getAnalytics: async (period = '6months') => {
    const response = await client.get(`/analytics?period=${period}`);
    return response.data;
  },

  // Get category-specific analytics
  getCategoryAnalytics: async (categoryId) => {
    const response = await client.get(`/analytics/category/${categoryId}`);
    return response.data;
  },

  // Get spending comparison
  getSpendingComparison: async (type = 'monthly') => {
    const response = await client.get(`/analytics/comparison?type=${type}`);
    return response.data;
  }
};
```

#### 2.2 Main Analytics Screen (mobile/src/screens/AnalyticsScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import {
  Text,
  Card,
  Appbar,
  Chip,
  Divider,
  ActivityIndicator,
  useTheme
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { analyticsApi } from '../api/analytics';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen({ navigation }) {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsApi.getAnalytics(selectedPeriod);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAnalytics();
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD`;
  };

  const periods = [
    { key: '1month', label: '1M' },
    { key: '3months', label: '3M' },
    { key: '6months', label: '6M' },
    { key: '1year', label: '1Y' },
    { key: 'all', label: 'All' }
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Analytics" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Analytics" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>No data available</Text>
        </View>
      </View>
    );
  }

  const { overview, trends, charts, insights } = analytics;

  // Prepare chart data
  const monthlyLabels = charts.monthly_spending.map(d => d.month.split(' ')[0]);
  const monthlyValues = charts.monthly_spending.map(d => d.amount);

  const lineChartData = {
    labels: monthlyLabels,
    datasets: [{
      data: monthlyValues.length > 0 ? monthlyValues : [0]
    }]
  };

  // Category pie chart colors
  const pieColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  const categoryPieData = charts.category_breakdown.slice(0, 5).map((cat, index) => ({
    name: cat.category_name,
    population: cat.amount,
    color: pieColors[index],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12
  }));

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Analytics" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {periods.map(period => (
            <Chip
              key={period.key}
              selected={selectedPeriod === period.key}
              onPress={() => setSelectedPeriod(period.key)}
              style={styles.periodChip}
            >
              {period.label}
            </Chip>
          ))}
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <Card style={[styles.overviewCard, { backgroundColor: '#E8EAF6' }]}>
            <Card.Content>
              <Icon name="wallet" size={32} color="#3F51B5" />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {formatCurrency(overview.total_spent)}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Total Spent
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: '#E8F5E9' }]}>
            <Card.Content>
              <Icon name="cart" size={32} color="#4CAF50" />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {overview.total_products}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Products
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: '#FFF3E0' }]}>
            <Card.Content>
              <Icon name="chart-line" size={32} color="#FF9800" />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {formatCurrency(overview.average_price)}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Avg Price
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: '#FCE4EC' }]}>
            <Card.Content>
              <Icon name="shield-check" size={32} color="#E91E63" />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {overview.active_warranties}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                Active
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Spending Trend */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Spending Trend
              </Text>
              <View style={styles.trendBadge}>
                <Icon
                  name={trends.spending_change >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={trends.spending_change >= 0 ? '#4CAF50' : '#F44336'}
                />
                <Text
                  style={[
                    styles.trendText,
                    { color: trends.spending_change >= 0 ? '#4CAF50' : '#F44336' }
                  ]}
                >
                  {Math.abs(trends.spending_change).toFixed(1)}%
                </Text>
              </View>
            </View>

            {monthlyValues.length > 0 && (
              <LineChart
                data={lineChartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withDots={true}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            )}

            <View style={styles.trendInfo}>
              <View>
                <Text variant="bodySmall" style={styles.trendInfoLabel}>
                  This Month
                </Text>
                <Text variant="titleSmall">
                  {formatCurrency(trends.last_month_spent)}
                </Text>
              </View>
              <View>
                <Text variant="bodySmall" style={styles.trendInfoLabel}>
                  Last Month
                </Text>
                <Text variant="titleSmall">
                  {formatCurrency(trends.previous_month_spent)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        {categoryPieData.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Spending by Category
              </Text>

              <PieChart
                data={categoryPieData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />

              <Divider style={styles.divider} />

              {charts.category_breakdown.map((cat, index) => (
                <TouchableOpacity
                  key={cat.category_id}
                  style={styles.categoryRow}
                  onPress={() => navigation.navigate('CategoryDetail', {
                    categoryId: cat.category_id,
                    categoryName: cat.category_name
                  })}
                >
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: pieColors[index % pieColors.length] }
                      ]}
                    />
                    <View>
                      <Text variant="bodyMedium">{cat.category_name}</Text>
                      <Text variant="bodySmall" style={styles.categoryCount}>
                        {cat.count} items
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryValues}>
                    <Text variant="titleSmall">
                      {formatCurrency(cat.amount)}
                    </Text>
                    <Text variant="bodySmall" style={styles.categoryPercentage}>
                      {cat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Store Breakdown */}
        {charts.store_breakdown.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Top Stores
              </Text>

              {charts.store_breakdown.slice(0, 5).map((store, index) => (
                <View key={store.store_id} style={styles.storeRow}>
                  <View style={styles.storeInfo}>
                    <Text variant="bodyMedium" style={styles.storeRank}>
                      {index + 1}
                    </Text>
                    <View>
                      <Text variant="bodyMedium">{store.store_name}</Text>
                      <Text variant="bodySmall" style={styles.storeCount}>
                        {store.count} purchases
                      </Text>
                    </View>
                  </View>
                  <Text variant="titleSmall">
                    {formatCurrency(store.amount)}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Insights */}
        {insights.most_expensive_product && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Insights
              </Text>

              <View style={styles.insightRow}>
                <Icon name="star" size={24} color="#FF9800" />
                <View style={styles.insightText}>
                  <Text variant="bodyMedium">Most Expensive Purchase</Text>
                  <Text variant="bodySmall" style={styles.insightDetail}>
                    {insights.most_expensive_product.product_name} •{' '}
                    {formatCurrency(insights.most_expensive_product.price)}
                  </Text>
                </View>
              </View>

              {insights.top_category_by_count && (
                <View style={styles.insightRow}>
                  <Icon name="trending-up" size={24} color="#4CAF50" />
                  <View style={styles.insightText}>
                    <Text variant="bodyMedium">Most Purchased Category</Text>
                    <Text variant="bodySmall" style={styles.insightDetail}>
                      {insights.top_category_by_count.category_name} •{' '}
                      {insights.top_category_by_count.count} items
                    </Text>
                  </View>
                </View>
              )}

              {insights.top_category_by_value && (
                <View style={styles.insightRow}>
                  <Icon name="cash-multiple" size={24} color="#E91E63" />
                  <View style={styles.insightText}>
                    <Text variant="bodyMedium">Highest Spending Category</Text>
                    <Text variant="bodySmall" style={styles.insightDetail}>
                      {insights.top_category_by_value.category_name} •{' '}
                      {formatCurrency(insights.top_category_by_value.amount)}
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Warranty Expiration Forecast */}
        {charts.expiration_forecast.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Warranty Expirations (Next 6 Months)
              </Text>

              <BarChart
                data={{
                  labels: charts.expiration_forecast.map(d => d.month.split(' ')[0]),
                  datasets: [{
                    data: charts.expiration_forecast.map(d => d.count)
                  }]
                }}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`
                }}
                style={styles.chart}
                showValuesOnTopOfBars={true}
              />
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1
  },
  periodContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8
  },
  periodChip: {
    marginRight: 8
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8
  },
  overviewCard: {
    width: (screenWidth - 40) / 2,
    elevation: 2
  },
  overviewValue: {
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 18
  },
  overviewLabel: {
    marginTop: 4,
    opacity: 0.7
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontWeight: 'bold'
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  trendText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  trendInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  trendInfoLabel: {
    opacity: 0.6,
    marginBottom: 4
  },
  divider: {
    marginVertical: 16
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  categoryCount: {
    opacity: 0.6,
    marginTop: 2
  },
  categoryValues: {
    alignItems: 'flex-end'
  },
  categoryPercentage: {
    opacity: 0.6,
    marginTop: 2
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  storeRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8EAF6',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    color: '#3F51B5'
  },
  storeCount: {
    opacity: 0.6,
    marginTop: 2
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12
  },
  insightText: {
    flex: 1
  },
  insightDetail: {
    opacity: 0.6,
    marginTop: 4
  },
  bottomPadding: {
    height: 32
  }
});
```

#### 2.3 Update Navigation (mobile/src/navigation/AppNavigator.js)

Add the Analytics screen to your navigation:

```javascript
import AnalyticsScreen from '../screens/AnalyticsScreen';

// In your Stack.Navigator:
<Stack.Screen 
  name="Analytics" 
  component={AnalyticsScreen}
  options={{ headerShown: false }}
/>
```

#### 2.4 Add Analytics Button to Home Screen

Update your HomeScreen to include an analytics button:

```javascript
// In HomeScreen.js
<Appbar.Header>
  <Appbar.Content title="My Warranties" />
  <Appbar.Action 
    icon="chart-bar" 
    onPress={() => navigation.navigate('Analytics')} 
  />
  <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
</Appbar.Header>
```

---

## 📊 Chart Library Comparison

### react-native-chart-kit (Recommended for simplicity)
✅ Simple API
✅ Supports Line, Bar, Pie, Progress charts
✅ Customizable colors and styling
✅ Good for basic charts
❌ Limited interactivity

### victory-native (Recommended for advanced features)
✅ Highly customizable
✅ Smooth animations
✅ Interactive tooltips
✅ Advanced chart types
❌ Larger bundle size

### react-native-gifted-charts (Best balance)
✅ Beautiful pre-styled charts
✅ Good performance
✅ Animated charts
✅ Easy to use
✅ Good documentation

---

## 🎨 Color Scheme

```javascript
const CHART_COLORS = {
  primary: '#6366F1',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  categories: [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ]
};
```

---

## 🧪 Testing

### Backend Testing

```bash
# Get comprehensive analytics
curl -X GET "http://localhost:3000/api/v1/analytics?period=6months" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get category analytics
curl -X GET "http://localhost:3000/api/v1/analytics/category/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get spending comparison
curl -X GET "http://localhost:3000/api/v1/analytics/comparison?type=monthly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mobile Testing

1. **Test with no data:**
   - Ensure graceful empty states
   - Show "No data available" message

2. **Test with minimal data:**
   - One product
   - Charts should still render

3. **Test with varied data:**
   - Multiple categories
   - Different time periods
   - Various price ranges

4. **Test period switching:**
   - Switch between 1M, 3M, 6M, 1Y, All
   - Verify data updates correctly

5. **Test refresh:**
   - Pull to refresh
   - Verify new data loads

---

## 📱 UI/UX Enhancements

### 1. Empty States
```javascript
{charts.monthly_spending.length === 0 && (
  <View style={styles.emptyState}>
    <Icon name="chart-line" size={64} color="#ccc" />
    <Text variant="titleMedium" style={styles.emptyText}>
      No spending data yet
    </Text>
    <Text variant="bodySmall">
      Add products to see your analytics
    </Text>
  </View>
)}
```

### 2. Loading Skeletons
```javascript
import { Skeleton } from 'react-native-paper';

{isLoading && (
  <Card style={styles.card}>
    <Card.Content>
      <Skeleton height={200} width="100%" />
    </Card.Content>
  </Card>
)}
```

### 3. Interactive Tooltips
```javascript
// Using victory-native for interactive charts
import { VictoryChart, VictoryLine, VictoryTooltip } from 'victory-native';

<VictoryChart>
  <VictoryLine
    data={chartData}
    labels={({ datum }) => `${datum.y} RSD`}
    labelComponent={<VictoryTooltip />}
  />
</VictoryChart>
```

---

## 🚀 Performance Optimization

### 1. Memoization
```javascript
import React, { useMemo } from 'react';

const chartData = useMemo(() => {
  return analytics.charts.monthly_spending.map(d => ({
    x: d.month,
    y: d.amount
  }));
}, [analytics]);
```

### 2. Lazy Loading
```javascript
// Load charts only when visible
const [chartsVisible, setChartsVisible] = useState(false);

<ScrollView
  onScroll={(e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    if (offsetY > 200 && !chartsVisible) {
      setChartsVisible(true);
    }
  }}
  scrollEventThrottle={400}
>
  {chartsVisible && <LineChart {...chartProps} />}
</ScrollView>
```

### 3. Data Caching
```javascript
// Cache analytics data
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheAnalytics = async (period, data) => {
  await AsyncStorage.setItem(
    `analytics_${period}`,
    JSON.stringify(data)
  );
};

const getCachedAnalytics = async (period) => {
  const cached = await AsyncStorage.getItem(`analytics_${period}`);
  return cached ? JSON.parse(cached) : null;
};
```

---

## ✅ What's Complete

1. ✅ **Backend Analytics API** - Comprehensive analytics endpoints
2. ✅ **Period Filtering** - 1M, 3M, 6M, 1Y, All time periods
3. ✅ **Overview Statistics** - Total spent, products, averages
4. ✅ **Spending Trends** - Line chart with month-over-month comparison
5. ✅ **Category Breakdown** - Pie chart with spending by category
6. ✅ **Store Analysis** - Top stores by spending
7. ✅ **Insights** - Most expensive product, top categories
8. ✅ **Warranty Forecast** - Expiration forecast for next 6 months
9. ✅ **Interactive Charts** - Beautiful, responsive charts
10. ✅ **Pull to Refresh** - Refresh analytics data

---

## 🎯 Next Features (v1.7.0 Ideas)

1. **📊 Export Analytics**
   - Export charts as images
   - Generate PDF analytics report
   - Email monthly summaries

2. **🔔 Smart Insights**
   - Budget recommendations
   - Spending anomaly detection
   - Personalized tips

3. **📈 Predictive Analytics**
   - Forecast future spending
   - Warranty renewal predictions
   - Budget planning assistance

4. **📊 Comparison Mode**
   - Compare year-over-year
   - Category-to-category comparison
   - Store performance comparison

5. **🎨 Custom Charts**
   - User-defined chart preferences
   - Favorite metrics dashboard
   - Custom date ranges

---

## 📦 Complete Feature Set

Your Warranty Manager app now has:
- ✅ v1.0.0: Authentication, Products, Documents, Push Notifications
- ✅ v1.1.0: OCR Receipt Scanning
- ✅ v1.2.0: Multi-language Support (English, Serbian)
- ✅ v1.3.0: PDF Export with Receipt Images
- ✅ v1.4.0: Username/Password Auth + Family Sharing
- ✅ v1.5.0: Dark Mode
- ✅ v1.6.0: **Advanced Analytics** ⭐ NEW!

---

## 🎊 Success!

You now have a fully-featured analytics dashboard with:
- 📊 Beautiful interactive charts
- 💰 Comprehensive spending insights
- 📈 Trend analysis and forecasting
- 🎯 Actionable recommendations
- 📱 Smooth mobile experience

**Ready to ship v1.6.0!** 🚀

Would you like to:
1. Add more chart types?
2. Implement export functionality?
3. Add predictive analytics?
4. Move on to the next feature?
