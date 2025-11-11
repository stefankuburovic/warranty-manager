import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Appbar, FAB, Chip, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { locationApi } from '../api/location';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [showStores, setShowStores] = useState(true);
  const [showServiceCenters, setShowServiceCenters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        
        setUserLocation(userCoords);
        setMapRegion({
          ...userCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        });
        
        loadData(userCoords.latitude, userCoords.longitude);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setIsLoading(false);
    }
  };

  const loadData = async (lat, lon) => {
    try {
      setIsLoading(true);
      
      const [storesData, serviceCentersData] = await Promise.all([
        locationApi.getStoresWithLocations(lat, lon, 50),
        locationApi.getServiceCenters(lat, lon, { radius: 50 })
      ]);
      
      setStores(storesData.stores || []);
      setServiceCenters(serviceCentersData.serviceCenters || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRegion) {
      setMapRegion({
        ...userLocation,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta
      });
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('location.map')} />
      </Appbar.Header>

      {mapRegion && (
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title={t('location.yourLocation')}
              pinColor="blue"
            />
          )}

          {/* Store markers */}
          {showStores && stores.map(store => (
            <Marker
              key={`store-${store.store_id}`}
              coordinate={{
                latitude: parseFloat(store.latitude),
                longitude: parseFloat(store.longitude)
              }}
              pinColor="red"
            >
              <Callout onPress={() => navigation.navigate('StoreDetail', { storeId: store.store_id })}>
                <View style={styles.callout}>
                  <Text variant="titleSmall">{store.store_name}</Text>
                  {store.distance && (
                    <Text variant="bodySmall">{t('location.kmAway', { distance: store.distance.toFixed(1) })}</Text>
                  )}
                  <Text variant="bodySmall">
                    {store.Products?.length || 0} {store.Products?.length === 1 ? t('product.title') : t('product.title') + 's'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}

          {/* Service center markers */}
          {showServiceCenters && serviceCenters.map(sc => (
            <Marker
              key={`sc-${sc.service_center_id}`}
              coordinate={{
                latitude: parseFloat(sc.latitude),
                longitude: parseFloat(sc.longitude)
              }}
              pinColor="green"
            >
              <Callout>
                <View style={styles.callout}>
                  <Text variant="titleSmall">{sc.name}</Text>
                  {sc.brand && <Text variant="bodySmall">{sc.brand}</Text>}
                  {sc.distance && (
                    <Text variant="bodySmall">{t('location.kmAway', { distance: sc.distance.toFixed(1) })}</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Filter chips */}
      <View style={styles.filterContainer}>
        <Chip
          selected={showStores}
          onPress={() => setShowStores(!showStores)}
          style={styles.chip}
          icon="store"
        >
          {t('location.stores')} ({stores.length})
        </Chip>
        <Chip
          selected={showServiceCenters}
          onPress={() => setShowServiceCenters(!showServiceCenters)}
          style={styles.chip}
          icon="wrench"
        >
          {t('location.serviceCenters')} ({serviceCenters.length})
        </Chip>
      </View>

      {/* Center on user button */}
      <FAB
        icon="crosshairs-gps"
        style={styles.fab}
        onPress={centerOnUser}
        small
      />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  map: { flex: 1 },
  filterContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8
  },
  chip: { backgroundColor: theme.colors.surface },
  callout: {
    width: 200,
    padding: 8
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: theme.colors.surface
  }
});

