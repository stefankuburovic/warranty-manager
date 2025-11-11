const NodeGeocoder = require('node-geocoder');
const geolib = require('geolib');

const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null
});

class LocationService {
  
  // Geocode an address to coordinates
  async geocodeAddress(address) {
    try {
      const results = await geocoder.geocode(address);
      
      if (results && results.length > 0) {
        const location = results[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          formattedAddress: location.formattedAddress,
          city: location.city,
          country: location.country,
          postalCode: location.zipcode
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude, longitude) {
    try {
      const results = await geocoder.reverse({ 
        lat: latitude, 
        lon: longitude 
      });
      
      if (results && results.length > 0) {
        const location = results[0];
        return {
          address: location.formattedAddress,
          city: location.city,
          country: location.country,
          postalCode: location.zipcode
        };
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Calculate distance between two points (in kilometers)
  calculateDistance(lat1, lon1, lat2, lon2) {
    return geolib.getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    ) / 1000; // Convert meters to kilometers
  }

  // Find nearby locations within radius
  findNearby(userLat, userLon, locations, radiusKm = 50) {
    return locations
      .map(location => {
        const distance = this.calculateDistance(
          userLat,
          userLon,
          location.latitude,
          location.longitude
        );
        
        return {
          ...location,
          distance
        };
      })
      .filter(location => location.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  // Get bounding box for map view
  getBoundingBox(locations) {
    if (locations.length === 0) return null;

    const bounds = geolib.getBounds(
      locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude
      }))
    );

    return {
      minLat: bounds.minLat,
      maxLat: bounds.maxLat,
      minLng: bounds.minLng,
      maxLng: bounds.maxLng
    };
  }

  // Calculate center point of multiple locations
  getCenterPoint(locations) {
    if (locations.length === 0) return null;

    const center = geolib.getCenter(
      locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude
      }))
    );

    return {
      latitude: center.latitude,
      longitude: center.longitude
    };
  }

  // Group nearby locations (clustering)
  clusterLocations(locations, distanceThresholdKm = 1) {
    const clusters = [];
    const processed = new Set();

    locations.forEach((location, index) => {
      if (processed.has(index)) return;

      const cluster = [location];
      processed.add(index);

      locations.forEach((otherLocation, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return;

        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          otherLocation.latitude,
          otherLocation.longitude
        );

        if (distance <= distanceThresholdKm) {
          cluster.push(otherLocation);
          processed.add(otherIndex);
        }
      });

      clusters.push({
        center: this.getCenterPoint(cluster),
        locations: cluster,
        count: cluster.length
      });
    });

    return clusters;
  }

  // Validate coordinates
  isValidCoordinates(latitude, longitude) {
    return (
      latitude >= -90 && 
      latitude <= 90 && 
      longitude >= -180 && 
      longitude <= 180
    );
  }

  // Format distance for display
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }
}

module.exports = new LocationService();

