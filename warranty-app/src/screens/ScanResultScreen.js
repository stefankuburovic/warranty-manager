import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Button,
  Divider,
  Chip
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

export default function ScanResultScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { barcode, productData, source } = route.params;
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProduct = () => {
    // Navigate to Add Product screen with pre-filled data
    navigation.navigate('AddProduct', {
      scannedData: {
        barcode,
        product_name: productData.name,
        brand: productData.brand,
        model: productData.model,
        category: productData.category,
        description: productData.description,
        image_url: productData.image_url
      }
    });
  };

  const handleScanAgain = () => {
    navigation.goBack();
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Product Found" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Success Banner */}
        <Card style={styles.successCard}>
          <Card.Content>
            <View style={styles.successContent}>
              <Text variant="headlineSmall" style={styles.successText}>
                ✓ Product Found!
              </Text>
              <Chip mode="outlined" style={styles.sourceChip}>
                Source: {source}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Product Image */}
        {productData.image_url && (
          <Card style={styles.card}>
            <Card.Content>
              <Image
                source={{ uri: productData.image_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </Card.Content>
          </Card>
        )}

        {/* Product Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.productName}>
              {productData.name}
            </Text>

            {productData.brand && (
              <Text variant="bodyLarge" style={styles.brand}>
                {productData.brand}
              </Text>
            )}

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Barcode:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {barcode}
              </Text>
            </View>

            {productData.model && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Model:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {productData.model}
                </Text>
              </View>
            )}

            {productData.category && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Category:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {productData.category}
                </Text>
              </View>
            )}

            {productData.manufacturer && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Manufacturer:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {productData.manufacturer}
                </Text>
              </View>
            )}

            {productData.description && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Description:
                </Text>
                <Text variant="bodyMedium" style={styles.description}>
                  {productData.description}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={handleAddProduct}
            style={styles.addButton}
            icon="plus"
            loading={isAdding}
            disabled={isAdding}
          >
            Add to My Products
          </Button>

          <Button
            mode="outlined"
            onPress={handleScanAgain}
            style={styles.scanButton}
            icon="barcode-scan"
          >
            Scan Another
          </Button>
        </View>

        <View style={styles.bottomPadding} />
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
    flex: 1
  },
  successCard: {
    margin: 16,
    backgroundColor: theme.colors.success + '20',
    elevation: 2
  },
  successContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  successText: {
    color: theme.colors.success,
    fontWeight: 'bold'
  },
  sourceChip: {
    backgroundColor: theme.colors.surface
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: 8
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text
  },
  brand: {
    color: theme.colors.textSecondary,
    marginBottom: 16
  },
  divider: {
    marginVertical: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  label: {
    fontWeight: '600',
    color: theme.colors.textSecondary,
    flex: 1
  },
  value: {
    flex: 2,
    textAlign: 'right',
    color: theme.colors.text
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text
  },
  description: {
    color: theme.colors.textSecondary,
    lineHeight: 20
  },
  actions: {
    padding: 16,
    gap: 12
  },
  addButton: {
    paddingVertical: 8
  },
  scanButton: {
    paddingVertical: 8
  },
  bottomPadding: {
    height: 32
  }
});

