import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Linking
} from 'react-native';
import {
  Text,
  IconButton,
  ActivityIndicator,
  Portal,
  Modal,
  TextInput,
  Button
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { barcodeApi } from '../api/barcode';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function BarcodeScannerScreen({ navigation, route }) {
  const { theme } = useTheme();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  const scanAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
    startScanAnimation();
  }, [permission, requestPermission]);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    console.log(`Barcode scanned: ${data} (${type})`);

    // Process barcode
    await processBarcode(data, type);
  };

  const processBarcode = async (barcode, type) => {
    try {
      // Determine if it's a QR code or regular barcode
      // expo-camera uses string types like 'qr', 'ean13', etc.
      if (type === 'qr' || type === 256) {
        // Parse QR code
        const result = await barcodeApi.parseQRCode(barcode);
        
        if (result.success) {
          if (result.type === 'warranty_certificate' || result.type === 'warranty_data') {
            // Navigate to add product with pre-filled warranty data
            navigation.navigate('AddProduct', {
              warrantyData: result.data
            });
          } else if (result.type === 'warranty_url') {
            Alert.alert(
              'Warranty URL Found',
              'This QR code contains a warranty registration URL.',
              [
                { text: 'Cancel', style: 'cancel', onPress: resetScanner },
                { 
                  text: 'Open URL', 
                  onPress: async () => {
                    try {
                      await Linking.openURL(result.url);
                    } catch (error) {
                      Alert.alert('Error', 'Could not open URL');
                    }
                    resetScanner();
                  }
                }
              ]
            );
          } else {
            // Show QR data
            Alert.alert('QR Code Scanned', barcode, [
              { text: 'OK', onPress: resetScanner }
            ]);
          }
        } else {
          Alert.alert('Error', 'Could not parse QR code', [
            { text: 'OK', onPress: resetScanner }
          ]);
        }
      } else {
        // Regular barcode - lookup product
        const result = await barcodeApi.lookupBarcode(barcode);

        if (result.found_in_database) {
          // Product already exists
          Alert.alert(
            'Product Found',
            'You already have this product in your inventory. Would you like to view it?',
            [
              { text: 'Cancel', style: 'cancel', onPress: resetScanner },
              {
                text: 'View Product',
                onPress: () => {
                  navigation.navigate('ProductDetail', {
                    productId: result.existing_product.product_id
                  });
                }
              }
            ]
          );
        } else if (result.success && result.product) {
          // Product found in external database
          navigation.navigate('ScanResult', {
            barcode,
            productData: result.product,
            source: result.source
          });
        } else {
          // Product not found
          Alert.alert(
            'Product Not Found',
            'This product was not found in our databases. Would you like to add it manually?',
            [
              { text: 'Cancel', style: 'cancel', onPress: resetScanner },
              {
                text: 'Add Manually',
                onPress: () => {
                  navigation.navigate('AddProduct', {
                    barcode
                  });
                }
              }
            ]
          );
        }
      }

      // Save to scan history
      try {
        await barcodeApi.saveScanHistory(barcode, result, result.success);
      } catch (error) {
        console.error('Error saving scan history:', error);
      }

    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(
        'Error',
        'Failed to process barcode. Please try again.',
        [{ text: 'OK', onPress: resetScanner }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setIsProcessing(false);
  };

  const handleManualEntry = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    setShowManualInput(false);
    setIsProcessing(true);

    // Validate barcode first
    try {
      const validation = await barcodeApi.validateBarcode(manualBarcode.trim());
      
      if (!validation.valid) {
        Alert.alert('Invalid Barcode', validation.message);
        setIsProcessing(false);
        setManualBarcode('');
        return;
      }

      // Process the barcode
      await processBarcode(validation.barcode, 'manual');
      setManualBarcode('');

    } catch (error) {
      console.error('Manual barcode error:', error);
      Alert.alert('Error', 'Failed to process barcode');
      setIsProcessing(false);
    }
  };

  // Ensure theme is available before creating styles
  if (!theme || !theme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Create styles early so they're available for all return statements
  const styles = createStyles(theme);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 16 }}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.permissionText, { color: theme.colors.text }]}>
          Camera permission is required to scan barcodes
        </Text>
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 24 }}>
          Grant Permission
        </Button>
      </View>
    );
  }

  const scanLinePosition = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 2]
  });

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.camera}
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
          ],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="close"
            iconColor="#fff"
            size={28}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleMedium" style={styles.headerTitle}>
            Scan Barcode
          </Text>
          <IconButton
            icon="keyboard"
            iconColor="#fff"
            size={24}
            onPress={() => setShowManualInput(true)}
          />
        </View>

        {/* Scan Area */}
        <View style={styles.scanArea}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Scan Line Animation */}
          {!scanned && !isProcessing && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: scanLinePosition }]
                }
              ]}
            />
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {isProcessing
              ? 'Looking up product...'
              : 'Position barcode within the frame'}
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFlashOn(!flashOn)}
          >
            <IconButton
              icon={flashOn ? 'flashlight-off' : 'flashlight'}
              iconColor="#fff"
              size={32}
            />
            <Text style={styles.controlText}>
              {flashOn ? 'Flash Off' : 'Flash On'}
            </Text>
          </TouchableOpacity>

          {scanned && !isProcessing && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={resetScanner}
            >
              <IconButton icon="refresh" iconColor="#fff" size={32} />
              <Text style={styles.controlText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>

      {/* Manual Barcode Input Modal */}
      <Portal>
        <Modal
          visible={showManualInput}
          onDismiss={() => setShowManualInput(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.text }]}>
            Enter Barcode Manually
          </Text>
          <Text variant="bodyMedium" style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
            Enter the product's barcode number
          </Text>

          <TextInput
            label="Barcode Number"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            autoFocus
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowManualInput(false);
                setManualBarcode('');
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleManualEntry}
              style={styles.modalButton}
              loading={isProcessing}
              disabled={isProcessing}
            >
              Lookup
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const createStyles = (theme) => {
  // Ensure theme has colors with fallbacks
  const colors = theme?.colors || {};
  const primaryColor = colors.primary || '#6200ee';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000'
    },
  camera: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold'
  },
  scanArea: {
    position: 'absolute',
    top: height * 0.25,
    left: (width - SCAN_AREA_SIZE) / 2,
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: primaryColor,
    borderWidth: 4
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: primaryColor,
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  processingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16
  },
  instructions: {
    position: 'absolute',
    top: height * 0.25 + SCAN_AREA_SIZE + 32,
    width: '100%',
    alignItems: 'center'
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32
  },
  controlButton: {
    alignItems: 'center'
  },
  controlText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    paddingHorizontal: 32
  },
  modalContainer: {
    padding: 24,
    margin: 20,
    borderRadius: 8
  },
  modalTitle: {
    marginBottom: 8,
    fontWeight: 'bold'
  },
  modalSubtitle: {
    marginBottom: 24
  },
  input: {
    marginBottom: 24
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  modalButton: {
    flex: 1
  }
  });
};

