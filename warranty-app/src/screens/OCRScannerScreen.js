import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { ocrApi } from '../api/ocr';

export default function OCRScannerScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
      exif: false
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setOcrResult(null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setOcrResult(null);
    }
  };

  const scanReceipt = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await ocrApi.scanReceipt(image);
      setOcrResult(result);
      
      if (result.confidence < 50) {
        Alert.alert(
          'Low Confidence',
          'OCR confidence is low. Please verify the extracted data carefully.'
        );
      }
    } catch (error) {
      console.error('OCR scan error:', error);
      Alert.alert('Error', 'Failed to scan receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const useExtractedData = () => {
    if (!ocrResult || !ocrResult.suggestions) {
      Alert.alert('Error', 'No data to use');
      return;
    }

    navigation.navigate('AddProduct', {
      ocrData: ocrResult.suggestions,
      receiptImage: image
    });
  };

  const retake = () => {
    setImage(null);
    setOcrResult(null);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('ocr.scanReceipt')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {!image ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              Scan Your Receipt
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Take a photo or choose an existing image of your receipt
            </Text>

            <Button
              mode="contained"
              icon="camera"
              onPress={takePicture}
              style={styles.actionButton}
            >
              Take Photo
            </Button>

            <Button
              mode="outlined"
              icon="image"
              onPress={pickImage}
              style={styles.actionButton}
            >
              Choose from Gallery
            </Button>
          </View>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Image source={{ uri: image }} style={styles.image} />
                
                {!ocrResult && !isProcessing && (
                  <View style={styles.actions}>
                    <Button
                      mode="contained"
                      onPress={scanReceipt}
                      icon="text-recognition"
                      style={styles.scanButton}
                    >
                      Scan Receipt
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={retake}
                      style={styles.retakeButton}
                    >
                      Retake
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>

            {isProcessing && (
              <Card style={styles.card}>
                <Card.Content style={styles.processingContainer}>
                  <ActivityIndicator size="large" />
                  <Text variant="titleMedium" style={styles.processingText}>
                    Scanning receipt...
                  </Text>
                  <Text variant="bodySmall" style={styles.processingSubtext}>
                    This may take a few seconds
                  </Text>
                </Card.Content>
              </Card>
            )}

            {ocrResult && (
              <>
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.resultHeader}>
                      <Text variant="titleLarge">Extracted Data</Text>
                      <Chip
                        mode="flat"
                        style={[
                          styles.confidenceChip,
                          {
                            backgroundColor: 
                              ocrResult.confidence >= 75 ? theme.colors.success + '20' :
                              ocrResult.confidence >= 50 ? theme.colors.warning + '20' :
                              theme.colors.error + '20'
                          }
                        ]}
                        textStyle={{
                          color:
                            ocrResult.confidence >= 75 ? theme.colors.success :
                            ocrResult.confidence >= 50 ? theme.colors.warning :
                            theme.colors.error
                        }}
                      >
                        {ocrResult.confidence}% Confidence
                      </Chip>
                    </View>

                    {ocrResult.suggestions?.product_name && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Product:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.product_name}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions?.store_name && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Store:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.store_name}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions?.purchase_price && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Price:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.purchase_price} {ocrResult.suggestions.currency || 'RSD'}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions?.purchase_date && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Date:</Text>
                        <Text style={styles.dataValue}>
                          {new Date(ocrResult.suggestions.purchase_date).toLocaleDateString('sr-RS')}
                        </Text>
                      </View>
                    )}

                    <Button
                      mode="contained"
                      onPress={useExtractedData}
                      icon="check"
                      style={styles.useButton}
                    >
                      Use This Data
                    </Button>

                    <Button
                      mode="outlined"
                      onPress={retake}
                      style={styles.retakeButton}
                    >
                      Scan Another Receipt
                    </Button>
                  </Card.Content>
                </Card>

                {ocrResult.extracted_data?.items && ocrResult.extracted_data.items.length > 0 && (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.itemsTitle}>
                        Detected Items
                      </Text>
                      {ocrResult.extracted_data.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>{item.price} RSD</Text>
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
                )}

                {ocrResult.raw_text && (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.rawTextTitle}>
                        Raw OCR Text
                      </Text>
                      <Text variant="bodySmall" style={styles.rawText}>
                        {ocrResult.raw_text}
                      </Text>
                    </Card.Content>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  appBar: {
    backgroundColor: theme.colors.appBar
  },
  content: {
    flex: 1,
    padding: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center',
    color: theme.colors.text
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 40
  },
  actionButton: {
    marginBottom: 16,
    width: '100%'
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16
  },
  actions: {
    marginTop: 8
  },
  scanButton: {
    marginBottom: 12
  },
  retakeButton: {
    marginTop: 8
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20
  },
  processingText: {
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.text
  },
  processingSubtext: {
    color: theme.colors.textSecondary
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  confidenceChip: {
    height: 28
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider
  },
  dataLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
    color: theme.colors.text
  },
  useButton: {
    marginTop: 16
  },
  itemsTitle: {
    marginBottom: 12,
    color: theme.colors.text
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text
  },
  rawTextTitle: {
    marginBottom: 12,
    color: theme.colors.text
  },
  rawText: {
    fontFamily: 'monospace',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
    color: theme.colors.textSecondary
  }
});

