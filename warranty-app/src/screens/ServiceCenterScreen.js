import React, { useState, useEffect } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Linking, Platform } from 'react-native';
import { Text, Appbar, Card, Chip, Button, ActivityIndicator, Searchbar } from 'react-native-paper';
import * as Location from 'expo-location';
import { locationApi } from '../api/location';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ServiceCenterScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { productId } = route.params || {};
  
  const [serviceCenters, setServiceCenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat, lon;
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        lat = location.coords.latitude;
        lon = location.coords.longitude;
        setUserLocation({ latitude: lat, longitude: lon });
      }

      let data;
      if (productId) {
        data = await locationApi.getServiceCentersForProduct(productId, lat, lon, 50);
      } else {
        data = await locationApi.getServiceCenters(lat, lon, { radius: 50 });
      }
      
      setServiceCenters(data.serviceCenters || []);
    } catch (error) {
      console.error('Load service centers error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDirections = (sc) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    
    const url = Platform.select({
      ios: `${scheme}?daddr=${sc.latitude},${sc.longitude}`,
      android: `${scheme}${sc.latitude},${sc.longitude}?q=${sc.latitude},${sc.longitude}(${sc.name})`
    });
    
    Linking.openURL(url);
  };

  const callPhone = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (website) => {
    Linking.openURL(website);
  };

  const filteredCenters = serviceCenters.filter(sc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sc.name.toLowerCase().includes(query) ||
      (sc.brand && sc.brand.toLowerCase().includes(query)) ||
      (sc.city && sc.city.toLowerCase().includes(query)) ||
      (sc.address && sc.address.toLowerCase().includes(query))
    );
  });

  const renderServiceCenter = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.title}>{item.name}</Text>
            {item.brand && (
              <Text variant="bodySmall" style={styles.brand}>{item.brand}</Text>
            )}
          </View>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FF9800" />
              <Text variant="bodySmall" style={styles.rating}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {item.distance && (
          <View style={styles.distanceRow}>
            <Icon name="map-marker-distance" size={16} color={theme.colors.textSecondary} />
            <Text variant="bodySmall" style={styles.distance}>
              {item.distance.toFixed(1)} km away
            </Text>
          </View>
        )}

        <View style={styles.addressRow}>
          <Icon name="map-marker" size={16} color={theme.colors.textSecondary} />
          <Text variant="bodySmall" style={styles.address}>
            {item.address}, {item.city}
          </Text>
        </View>

        {item.phone && (
          <View style={styles.contactRow}>
            <Icon name="phone" size={16} color={theme.colors.textSecondary} />
            <Text 
              variant="bodySmall" 
              style={styles.contactLink}
              onPress={() => callPhone(item.phone)}
            >
              {item.phone}
            </Text>
          </View>
        )}

        {item.description && (
          <Text variant="bodySmall" style={styles.description}>
            {item.description}
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="directions"
            onPress={() => openDirections(item)}
            style={styles.actionButton}
          >
            {t('location.directions') || 'Directions'}
          </Button>
          {item.website && (
            <Button
              mode="outlined"
              icon="web"
              onPress={() => openWebsite(item.website)}
              style={styles.actionButton}
            >
              {t('location.website') || 'Website'}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('location.serviceCenters') || 'Service Centers'} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('location.serviceCenters') || 'Service Centers'} />
        <Appbar.Action icon="map" onPress={() => navigation.navigate('Map')} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('location.searchServiceCenters') || 'Search service centers...'}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {filteredCenters.length > 0 ? (
        <>
          <Text style={styles.resultsCount}>
            {filteredCenters.length} {t('location.serviceCenter') || 'service center'}{filteredCenters.length !== 1 ? 's' : ''} {t('location.nearby') || 'nearby'}
          </Text>
          <FlatList
            data={filteredCenters}
            renderItem={renderServiceCenter}
            keyExtractor={item => item.service_center_id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="wrenchoutline" size={64} color={theme.colors.textSecondary} />
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {t('location.noServiceCenters') || 'No Service Centers Found'}
          </Text>
          <Text style={styles.emptyText}>
            {t('location.tryIncreasingRadius') || 'Try increasing your search radius or check back later'}
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { padding: 16, backgroundColor: theme.colors.surface },
  searchBar: { elevation: 2 },
  resultsCount: { padding: 16, fontWeight: 'bold', color: theme.colors.text },
  listContainer: { padding: 8 },
  card: { marginBottom: 16, elevation: 2, backgroundColor: theme.colors.surface },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  headerLeft: { flex: 1 },
  title: { color: theme.colors.text },
  brand: { color: theme.colors.textSecondary, marginTop: 4 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: theme.colors.text },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  distance: { color: theme.colors.textSecondary },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  address: { flex: 1, color: theme.colors.textSecondary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  contactLink: { color: theme.colors.primary, textDecorationLine: 'underline' },
  description: { marginTop: 8, color: theme.colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionButton: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { marginTop: 16, marginBottom: 8, color: theme.colors.text },
  emptyText: { textAlign: 'center', color: theme.colors.textSecondary }
});

