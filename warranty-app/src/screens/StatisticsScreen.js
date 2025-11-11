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
  useTheme as usePaperTheme
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { analyticsApi } from '../api/analytics';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

export default function StatisticsScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const paperTheme = usePaperTheme();
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
    if (amount == null || amount === undefined || isNaN(amount)) {
      return '0 RSD';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${numAmount.toLocaleString('sr-RS', { maximumFractionDigits: 0 })} RSD`;
  };

  const periods = [
    { key: '1month', label: '1M' },
    { key: '3months', label: '3M' },
    { key: '6months', label: '6M' },
    { key: '1year', label: '1Y' },
    { key: 'all', label: t('statistics.all') || 'All' }
  ];

  const styles = createStyles(theme, isDark);

  if (isLoading && !analytics) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('statistics.title')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('statistics.title')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('statistics.noData') || 'No data available'}</Text>
        </View>
      </View>
    );
  }

  const { overview, trends, charts, insights } = analytics;

  // Prepare chart data
  const monthlySpending = charts?.monthly_spending || [];
  const monthlyLabels = monthlySpending.map(d => d.month?.split(' ')[0] || '');
  const monthlyValues = monthlySpending.map(d => d.amount || 0);

  const lineChartData = {
    labels: monthlyLabels.length > 0 ? monthlyLabels : [''],
    datasets: [{
      data: monthlyValues.length > 0 ? monthlyValues : [0]
    }]
  };

  // Category pie chart colors
  const pieColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  const categoryBreakdown = charts?.category_breakdown || [];
  const categoryPieData = categoryBreakdown.slice(0, 5).map((cat, index) => ({
    name: cat.category_name || 'Unknown',
    population: cat.amount || 0,
    color: pieColors[index % pieColors.length],
    legendFontColor: theme.colors.textSecondary,
    legendFontSize: 12
  }));

  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    color: (opacity = 1) => isDark 
      ? `rgba(187, 134, 252, ${opacity})` 
      : `rgba(149, 112, 207, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
      fill: theme.colors.textSecondary
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.divider,
      strokeWidth: 1
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('statistics.title')} />
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
              selectedColor={theme.colors.primary}
            >
              {period.label}
            </Chip>
          ))}
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <Card style={[styles.overviewCard, { backgroundColor: isDark ? '#2C2C3A' : '#E8EAF6' }]}>
            <Card.Content>
              <Icon name="wallet" size={32} color={theme.colors.primary} />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {formatCurrency(overview?.total_spent)}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                {t('statistics.totalSpent')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: isDark ? '#2C3A2C' : '#E8F5E9' }]}>
            <Card.Content>
              <Icon name="cart" size={32} color={theme.colors.success} />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {overview?.total_products || 0}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                {t('statistics.totalProducts')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: isDark ? '#3A3A2C' : '#FFF3E0' }]}>
            <Card.Content>
              <Icon name="chart-line" size={32} color={theme.colors.warning} />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {formatCurrency(overview?.average_price)}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                {t('statistics.averagePrice') || 'Avg Price'}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, { backgroundColor: isDark ? '#3A2C2C' : '#FCE4EC' }]}>
            <Card.Content>
              <Icon name="shield-check" size={32} color={theme.colors.error} />
              <Text variant="titleLarge" style={styles.overviewValue}>
                {overview?.active_warranties || 0}
              </Text>
              <Text variant="bodySmall" style={styles.overviewLabel}>
                {t('statistics.activeWarranties')}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Spending Trend */}
        {monthlyValues.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {t('statistics.spendingTrend') || 'Spending Trend'}
                </Text>
                <View style={styles.trendBadge}>
                  <Icon
                    name={trends.spending_change >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={trends.spending_change >= 0 ? theme.colors.success : theme.colors.error}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      { color: trends.spending_change >= 0 ? theme.colors.success : theme.colors.error }
                    ]}
                  >
                    {Math.abs(trends?.spending_change || 0).toFixed(1)}%
                  </Text>
                </View>
              </View>

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

              <View style={styles.trendInfo}>
                <View>
                  <Text variant="bodySmall" style={styles.trendInfoLabel}>
                    {t('statistics.thisMonth') || 'This Month'}
                  </Text>
                  <Text variant="titleSmall" style={styles.trendInfoValue}>
                    {formatCurrency(trends?.last_month_spent)}
                  </Text>
                </View>
                <View>
                  <Text variant="bodySmall" style={styles.trendInfoLabel}>
                    {t('statistics.lastMonth') || 'Last Month'}
                  </Text>
                  <Text variant="titleSmall" style={styles.trendInfoValue}>
                    {formatCurrency(trends?.previous_month_spent)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Category Breakdown */}
        {categoryPieData.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('statistics.byCategory')}
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

              {categoryBreakdown.map((cat, index) => (
                <TouchableOpacity
                  key={cat.category_id}
                  style={styles.categoryRow}
                  onPress={() => navigation.navigate('ProductDetail', {
                    categoryId: cat.category_id
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
                      <Text variant="bodyMedium" style={styles.categoryName}>
                        {cat.category_name}
                      </Text>
                      <Text variant="bodySmall" style={styles.categoryCount}>
                        {cat.count} {t('statistics.items')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryValues}>
                    <Text variant="titleSmall" style={styles.categoryAmount}>
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
        {charts?.store_breakdown && charts.store_breakdown.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('statistics.topStores') || 'Top Stores'}
              </Text>

              {charts.store_breakdown.slice(0, 5).map((store, index) => (
                <View key={store.store_id} style={styles.storeRow}>
                  <View style={styles.storeInfo}>
                    <Text variant="bodyMedium" style={styles.storeRank}>
                      {index + 1}
                    </Text>
                    <View>
                      <Text variant="bodyMedium" style={styles.storeName}>
                        {store.store_name}
                      </Text>
                      <Text variant="bodySmall" style={styles.storeCount}>
                        {store.count} {t('statistics.purchases') || 'purchases'}
                      </Text>
                    </View>
                  </View>
                  <Text variant="titleSmall" style={styles.storeAmount}>
                    {formatCurrency(store.amount)}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Insights */}
        {insights?.most_expensive_product && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('statistics.insights') || 'Insights'}
              </Text>

              <View style={styles.insightRow}>
                <Icon name="star" size={24} color={theme.colors.warning} />
                <View style={styles.insightText}>
                  <Text variant="bodyMedium" style={styles.insightTitle}>
                    {t('statistics.mostExpensive') || 'Most Expensive Purchase'}
                  </Text>
                  <Text variant="bodySmall" style={styles.insightDetail}>
                    {insights.most_expensive_product.product_name || 'Unknown'} •{' '}
                    {formatCurrency(insights.most_expensive_product.price)}
                  </Text>
                </View>
              </View>

              {insights?.top_category_by_count && (
                <View style={styles.insightRow}>
                  <Icon name="trending-up" size={24} color={theme.colors.success} />
                  <View style={styles.insightText}>
                    <Text variant="bodyMedium" style={styles.insightTitle}>
                      {t('statistics.mostPurchased') || 'Most Purchased Category'}
                    </Text>
                    <Text variant="bodySmall" style={styles.insightDetail}>
                      {insights.top_category_by_count.category_name || 'Unknown'} •{' '}
                      {insights.top_category_by_count.count || 0} {t('statistics.items')}
                    </Text>
                  </View>
                </View>
              )}

              {insights?.top_category_by_value && (
                <View style={styles.insightRow}>
                  <Icon name="cash-multiple" size={24} color={theme.colors.error} />
                  <View style={styles.insightText}>
                    <Text variant="bodyMedium" style={styles.insightTitle}>
                      {t('statistics.highestSpending') || 'Highest Spending Category'}
                    </Text>
                    <Text variant="bodySmall" style={styles.insightDetail}>
                      {insights.top_category_by_value.category_name || 'Unknown'} •{' '}
                      {formatCurrency(insights.top_category_by_value.amount)}
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Warranty Expiration Forecast */}
        {charts?.expiration_forecast && charts.expiration_forecast.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('statistics.warrantyExpirations') || 'Warranty Expirations (Next 6 Months)'}
              </Text>

              <BarChart
                data={{
                  labels: charts.expiration_forecast.map(d => d.month?.split(' ')[0] || ''),
                  datasets: [{
                    data: charts.expiration_forecast.map(d => d.count || 0)
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

const createStyles = (theme, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  appBar: {
    backgroundColor: theme.colors.appBar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: 8
  },
  content: {
    flex: 1
  },
  periodContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    flexWrap: 'wrap'
  },
  periodChip: {
    marginRight: 8,
    marginBottom: 4
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
    fontSize: 18,
    color: theme.colors.text
  },
  overviewLabel: {
    marginTop: 4,
    opacity: 0.7,
    color: theme.colors.textSecondary
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontWeight: 'bold',
    color: theme.colors.text
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
    borderTopColor: theme.colors.divider
  },
  trendInfoLabel: {
    opacity: 0.6,
    marginBottom: 4,
    color: theme.colors.textSecondary
  },
  trendInfoValue: {
    color: theme.colors.text,
    fontWeight: '600'
  },
  divider: {
    marginVertical: 16,
    backgroundColor: theme.colors.divider
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
    gap: 12,
    flex: 1
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  categoryName: {
    color: theme.colors.text
  },
  categoryCount: {
    opacity: 0.6,
    marginTop: 2,
    color: theme.colors.textSecondary
  },
  categoryValues: {
    alignItems: 'flex-end'
  },
  categoryAmount: {
    color: theme.colors.text,
    fontWeight: '600'
  },
  categoryPercentage: {
    opacity: 0.6,
    marginTop: 2,
    color: theme.colors.textSecondary
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  storeRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: isDark ? '#3A3A4A' : '#E8EAF6',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  storeName: {
    color: theme.colors.text
  },
  storeCount: {
    opacity: 0.6,
    marginTop: 2,
    color: theme.colors.textSecondary
  },
  storeAmount: {
    color: theme.colors.text,
    fontWeight: '600'
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
  insightTitle: {
    color: theme.colors.text
  },
  insightDetail: {
    opacity: 0.6,
    marginTop: 4,
    color: theme.colors.textSecondary
  },
  bottomPadding: {
    height: 32
  }
});
