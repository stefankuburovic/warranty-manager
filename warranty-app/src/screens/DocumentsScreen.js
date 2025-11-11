import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert, TouchableOpacity, Linking } from 'react-native';
import { Text, Appbar, Card, IconButton, FAB, Dialog, Portal, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { documentsApi } from '../api/documents';

export default function DocumentsScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { productId, productName } = route.params;
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogVisible, setUploadDialogVisible] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [productId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsApi.getProductDocuments(productId);
      setDocuments(data.documents);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file, documentType = 'receipt') => {
    try {
      setIsUploading(true);
      setUploadDialogVisible(false);

      const isPrimary = documents.length === 0; // First document is primary
      await documentsApi.uploadDocument(productId, file, documentType, isPrimary);
      
      Alert.alert('Success', 'Document uploaded successfully');
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadDocument({
        uri: result.assets[0].uri,
        fileName: `receipt_${Date.now()}.jpg`,
        type: 'image/jpeg'
      });
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadDocument({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
        type: result.assets[0].type || 'image/jpeg'
      });
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      uploadDocument({
        uri: result.uri,
        fileName: result.name,
        type: result.mimeType || 'application/pdf'
      });
    }
  };

  const handleDeleteDocument = (documentId) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentsApi.deleteDocument(documentId);
              Alert.alert('Success', 'Document deleted');
              loadDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsPrimary = async (documentId) => {
    try {
      await documentsApi.markAsPrimary(documentId);
      Alert.alert('Success', 'Document marked as primary');
      loadDocuments();
    } catch (error) {
      console.error('Error marking as primary:', error);
      Alert.alert('Error', 'Failed to update document');
    }
  };

  const handleViewDocument = (url) => {
    Linking.openURL(url);
  };

  const styles = createStyles(theme);

  const renderDocument = ({ item }) => {
    const isPDF = item.mime_type === 'application/pdf';
    const uploadDate = new Date(item.upload_date).toLocaleDateString('sr-RS');

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.documentHeader}>
            <View style={styles.documentInfo}>
              <Text variant="titleMedium">{item.file_name}</Text>
              <Text variant="bodySmall" style={styles.documentMeta}>
                {item.document_type} • {uploadDate}
              </Text>
              {item.is_primary && (
                <Text variant="bodySmall" style={styles.primaryBadge}>
                  ⭐ Primary Document
                </Text>
              )}
            </View>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteDocument(item.document_id)}
            />
          </View>

          <TouchableOpacity 
            onPress={() => handleViewDocument(item.cloud_storage_url)}
            style={styles.previewContainer}
          >
            {isPDF ? (
              <View style={styles.pdfPlaceholder}>
                <Text style={styles.pdfIcon}>📄</Text>
                <Text>Tap to view PDF</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: item.thumbnail_url || item.cloud_storage_url }} 
                style={styles.preview}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>

          <View style={styles.actions}>
            <Button 
              mode="outlined" 
              onPress={() => handleViewDocument(item.cloud_storage_url)}
              icon="eye"
              style={styles.actionButton}
            >
              View
            </Button>
            {!item.is_primary && (
              <Button 
                mode="outlined" 
                onPress={() => handleMarkAsPrimary(item.document_id)}
                icon="star"
                style={styles.actionButton}
              >
                Set Primary
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('document.documents')} subtitle={productName} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}...</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {t('document.noDocuments')}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {t('document.addDocumentsHint')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.document_id.toString()}
          renderItem={renderDocument}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setUploadDialogVisible(true)}
        loading={isUploading}
      />

      <Portal>
        <Dialog visible={uploadDialogVisible} onDismiss={() => setUploadDialogVisible(false)}>
          <Dialog.Title>{t('document.uploadDocument')}</Dialog.Title>
          <Dialog.Content>
            <Button 
              mode="contained" 
              onPress={handleTakePhoto}
              icon="camera"
              style={styles.dialogButton}
            >
              {t('document.camera')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handlePickImage}
              icon="image"
              style={styles.dialogButton}
            >
              {t('document.gallery')}
            </Button>
            <Button 
              mode="contained" 
              onPress={handlePickDocument}
              icon="file-pdf-box"
              style={styles.dialogButton}
            >
              {t('document.pdf')}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUploadDialogVisible(false)}>{t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: theme.colors.textSecondary
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
    color: theme.colors.textSecondary
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  documentInfo: {
    flex: 1
  },
  documentMeta: {
    color: theme.colors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize'
  },
  primaryBadge: {
    color: theme.colors.warning,
    marginTop: 4
  },
  previewContainer: {
    marginVertical: 12
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  pdfPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  pdfIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.fab
  },
  dialogButton: {
    marginBottom: 12
  }
});

