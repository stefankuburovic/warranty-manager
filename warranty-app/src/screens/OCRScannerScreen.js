import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ocrApi } from '../api/ocr';

export default function OCRScannerScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [image, setImage] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'pdf'
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('ocr.permissionNeeded'), t('ocr.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
      exif: false
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setFileUri(result.assets[0].uri);
      setFileType('image');
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
      setFileUri(result.assets[0].uri);
      setFileType('image');
      setOcrResult(null);
    }
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        setFileType('pdf');
        setImage(null); // Clear image preview for PDF
        setOcrResult(null);
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert(t('common.error'), t('ocr.pdfPickFailed') || 'Failed to pick PDF');
    }
  };

  const scanReceipt = async () => {
    if (!fileUri) {
      Alert.alert(t('common.error'), t('ocr.selectImage') || 'Please select an image or PDF');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await ocrApi.scanReceipt(fileUri, fileType);
      setOcrResult(result);
      
      if (result.confidence < 50) {
        Alert.alert(
          t('ocr.lowConfidence'),
          t('ocr.lowConfidenceDescription')
        );
      }
    } catch (error) {
      console.error('OCR scan error:', error);
      Alert.alert(t('common.error'), t('ocr.scanFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const useExtractedData = () => {
    if (!ocrResult || !ocrResult.suggestions) {
      Alert.alert(t('common.error'), t('ocr.noDataToUse'));
      return;
    }

    navigation.navigate('AddProduct', {
      ocrData: ocrResult.suggestions,
      receiptImage: fileType === 'image' ? fileUri : null,
      receiptPDF: fileType === 'pdf' ? fileUri : null
    });
  };

  const retake = () => {
    setImage(null);
    setFileUri(null);
    setFileType(null);
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
        {!fileUri ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              {t('ocr.scanYourReceipt')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t('ocr.scanYourReceiptDescription')}
            </Text>

            <Button
              mode="contained"
              icon="camera"
              onPress={takePicture}
              style={styles.actionButton}
            >
              {t('ocr.takePhoto')}
            </Button>

            <Button
              mode="outlined"
              icon="image"
              onPress={pickImage}
              style={styles.actionButton}
            >
              {t('ocr.chooseFromGallery')}
            </Button>

            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={pickPDF}
              style={styles.actionButton}
            >
              {t('ocr.choosePDF') || t('document.choosePDF')}
            </Button>
          </View>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                {fileType === 'pdf' ? (
                  <View style={styles.pdfPreview}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text variant="bodyMedium" style={styles.pdfText}>
                      {t('document.pdf')} {t('ocr.selected') || 'selected'}
                    </Text>
                  </View>
                ) : (
                  <Image source={{ uri: image }} style={styles.image} />
                )}
                
                {!ocrResult && !isProcessing && (
                  <View style={styles.actions}>
                    <Button
                      mode="contained"
                      onPress={scanReceipt}
                      icon="text-recognition"
                      style={styles.scanButton}
                    >
                      {t('ocr.scanReceiptButton')}
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={retake}
                      style={styles.retakeButton}
                    >
                      {t('ocr.retake')}
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
                    {t('ocr.scanning')}
                  </Text>
                  <Text variant="bodySmall" style={styles.processingSubtext}>
                    {t('ocr.scanningDescription')}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {ocrResult && (
              <>
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.resultHeader}>
                      <Text variant="titleLarge">{t('ocr.extractedData')}</Text>
                      <Chip
                        mode="outlined"
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
                        {t('ocr.confidencePercent', { percent: ocrResult.confidence })}
                      </Chip>
                    </View>

                    {ocrResult.suggestions?.product_name && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>{t('ocr.product')}:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.product_name}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions?.store_name && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>{t('ocr.store')}:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.store_name}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions?.purchase_price && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>{t('ocr.price')}:</Text>
                        <Text style={styles.dataValue}>
                          {ocrResult.suggestions.purchase_price} {ocrResult.suggestions.currency || t('currency.RSD')}
                        </Text>
                      </View>
                    )}

                    {ocrResult.suggestions?.purchase_date && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>{t('ocr.date')}:</Text>
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
                      {t('ocr.useThisData')}
                    </Button>

                    <Button
                      mode="outlined"
                      onPress={retake}
                      style={styles.retakeButton}
                    >
                      {t('ocr.scanAnother')}
                    </Button>
                  </Card.Content>
                </Card>

                {ocrResult.extracted_data?.items && ocrResult.extracted_data.items.length > 0 && (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.itemsTitle}>
                        {t('ocr.detectedItems')}
                      </Text>
                      {ocrResult.extracted_data.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>{item.price} {t('currency.RSD')}</Text>
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
                )}

                {ocrResult.raw_text && (
                  <Card style={styles.card}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.rawTextTitle}>
                        {t('ocr.rawText')}
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
    height: 34
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
  },
  pdfPreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  pdfIcon: {
    fontSize: 64,
    marginBottom: 8
  },
  pdfText: {
    color: theme.colors.text
  }
});

