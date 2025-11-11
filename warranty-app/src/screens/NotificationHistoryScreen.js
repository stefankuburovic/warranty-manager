import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Appbar, Card, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { notificationsApi } from '../api/notifications';

export default function NotificationHistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getHistory();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case '30_days':
        return '#2196f3';
      case '7_days':
        return '#ff9800';
      case 'expired':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case '30_days':
        return t('notification.type30Days');
      case '7_days':
        return t('notification.type7Days');
      case 'expired':
        return t('notification.typeExpired');
      case 'custom':
        return t('notification.typeCustom');
      default:
        return type;
    }
  };

  const renderNotification = ({ item }) => {
    const sentDate = new Date(item.sent_at).toLocaleString('sr-RS');
    const typeColor = getNotificationTypeColor(item.notification_type);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="titleMedium" style={styles.title}>
                {item.title}
              </Text>
              <Chip
                mode="flat"
                style={[styles.typeChip, { backgroundColor: typeColor + '20' }]}
                textStyle={{ color: typeColor, fontSize: 11 }}
              >
                {getNotificationTypeLabel(item.notification_type)}
              </Chip>
            </View>
            {!item.was_successful && (
              <Chip
                mode="flat"
                style={styles.failedChip}
                textStyle={{ color: '#f44336', fontSize: 11 }}
              >
                {t('notification.failed')}
              </Chip>
            )}
          </View>

          <Text variant="bodyMedium" style={styles.body}>
            {item.body}
          </Text>

          {item.Product && (
            <Text variant="bodySmall" style={styles.product}>
              {t('notification.product')}: {item.Product.product_name}
            </Text>
          )}

          <Text variant="bodySmall" style={styles.date}>
            {sentDate}
          </Text>

          {item.error_message && (
            <Text variant="bodySmall" style={styles.error}>
              {t('notification.error')}: {item.error_message}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('notification.notificationHistory')} />
      </Appbar.Header>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>{t('common.loading')}</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {t('notification.noNotifications')}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {t('notification.noNotificationsDescription')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.log_id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666'
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 12,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  headerLeft: {
    flex: 1,
    marginRight: 8
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4
  },
  typeChip: {
    alignSelf: 'flex-start',
    height: 24,
    marginTop: 4
  },
  failedChip: {
    backgroundColor: '#f4433620',
    height: 24
  },
  body: {
    marginBottom: 8,
    color: '#333'
  },
  product: {
    color: '#666',
    marginBottom: 4
  },
  date: {
    color: '#999',
    fontSize: 12
  },
  error: {
    color: '#f44336',
    marginTop: 8,
    fontStyle: 'italic'
  }
});

