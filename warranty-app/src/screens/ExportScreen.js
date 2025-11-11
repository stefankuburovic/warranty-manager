import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Appbar, Card, RadioButton, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { exportApi } from '../api/export';

export default function ExportScreen({ navigation }) {
  const { t } = useTranslation();
  const [exportType, setExportType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      let arrayBuffer, filename;
      
      if (exportType === 'all') {
        arrayBuffer = await exportApi.exportAllProducts();
        filename = `warranty-report-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (exportType === 'filtered') {
        const filters = {};
        if (filterStatus !== 'all') {
          filters.status = filterStatus;
        }
        arrayBuffer = await exportApi.exportFiltered(filters);
        filename = `warranty-${filterStatus}-${new Date().toISOString().split('T')[0]}.pdf`;
      }
      
      await exportApi.downloadAndSharePDF(arrayBuffer, filename);
      
      Alert.alert(
        t('common.success'),
        t('export.exportSuccess')
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        t('common.error'),
        t('export.exportFailed')
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('export.title')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {t('export.selectExportType')}
            </Text>

            <RadioButton.Group onValueChange={setExportType} value={exportType}>
              <RadioButton.Item
                label={t('export.allProducts')}
                value="all"
                style={styles.radioItem}
              />
              <Text variant="bodySmall" style={styles.radioDescription}>
                {t('export.allProductsDescription')}
              </Text>

              <RadioButton.Item
                label={t('export.filtered')}
                value="filtered"
                style={styles.radioItem}
              />
              <Text variant="bodySmall" style={styles.radioDescription}>
                {t('export.filteredDescription')}
              </Text>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {exportType === 'filtered' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('filter.filterBy')}
              </Text>

              <Text variant="bodyMedium" style={styles.filterLabel}>
                {t('filter.status')}
              </Text>

              <View style={styles.chipContainer}>
                <Chip
                  selected={filterStatus === 'all'}
                  onPress={() => setFilterStatus('all')}
                  style={styles.chip}
                >
                  {t('filter.all')}
                </Chip>
                <Chip
                  selected={filterStatus === 'active'}
                  onPress={() => setFilterStatus('active')}
                  style={styles.chip}
                >
                  {t('filter.active')}
                </Chip>
                <Chip
                  selected={filterStatus === 'expired'}
                  onPress={() => setFilterStatus('expired')}
                  style={styles.chip}
                >
                  {t('filter.expired')}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('export.whatIsIncluded')}
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature1')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature2')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature3')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature4')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.featureText}>
                  {t('export.feature5')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="file-pdf-box"
          onPress={handleExport}
          loading={isExporting}
          disabled={isExporting}
          style={styles.exportButton}
        >
          {t('export.generatePDF')}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1,
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 2
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold'
  },
  radioItem: {
    paddingVertical: 4
  },
  radioDescription: {
    color: '#666',
    marginLeft: 48,
    marginBottom: 12,
    marginTop: -8
  },
  filterLabel: {
    marginBottom: 12,
    color: '#666'
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    marginRight: 8,
    marginBottom: 8
  },
  featureList: {
    marginTop: 8
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  bullet: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  exportButton: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 8
  }
});

