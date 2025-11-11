import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Appbar, Switch, Card, Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { notificationsApi } from '../api/notifications';
import notificationService from '../services/notificationService';

export default function NotificationSettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    notification_enabled: false,
    has_token: false,
    last_check: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert(t('common.error'), t('notification.loadSettingsFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled) => {
    try {
      setIsSaving(true);
      
      if (enabled) {
        // Request permissions and register token
        const token = await notificationService.registerForPushNotifications();
        if (token) {
          await notificationsApi.registerToken(token);
        } else {
          Alert.alert(
            t('notification.permissionRequired'),
            t('notification.permissionDescription')
          );
          return;
        }
      } else {
        // Disable notifications
        await notificationsApi.toggleNotifications(false);
      }

      setSettings(prev => ({ ...prev, notification_enabled: enabled }));
      Alert.alert(
        t('common.success'),
        enabled ? t('notification.notificationsEnabled') : t('notification.notificationsDisabled')
      );
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert(t('common.error'), t('notification.updateSettingsFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationsApi.sendTest();
      Alert.alert(t('notification.testSent'), t('notification.testSentMessage'));
    } catch (error) {
      console.error('Error sending test:', error);
      Alert.alert(t('common.error'), t('notification.sendTestFailed'));
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      await notificationService.setBadgeCount(0);
      Alert.alert(t('common.success'), t('notification.notificationsCleared'));
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert(t('common.error'), t('notification.clearFailed'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('notification.notificationSettings')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('notification.notificationSettings')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="titleMedium">{t('notification.enableNotifications')}</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  {t('notification.enableDescription')}
                </Text>
              </View>
              <Switch
                value={settings.notification_enabled}
                onValueChange={handleToggleNotifications}
                disabled={isSaving}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('notification.status')}:</Text>
              <Text style={[
                styles.infoValue,
                { color: settings.has_token ? '#4caf50' : '#f44336' }
              ]}>
                {settings.has_token ? t('notification.registered') : t('notification.notRegistered')}
              </Text>
            </View>

            {settings.last_check && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('notification.lastCheck')}:</Text>
                <Text style={styles.infoValue}>
                  {new Date(settings.last_check).toLocaleString('sr-RS')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('notification.reminderSchedule')}
            </Text>
            <Text variant="bodyMedium" style={styles.scheduleText}>
              {t('notification.reminderScheduleDescription')}
            </Text>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                {t('notification.reminder30Days')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                {t('notification.reminder7Days')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                {t('notification.reminderExpired')}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.scheduleNote}>
              {t('notification.scheduleNote')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('notification.actions')}
            </Text>

            <Button
              mode="contained"
              onPress={() => navigation.navigate('NotificationPreferences')}
              icon="bell-cog"
              style={styles.actionButton}
            >
              Advanced Preferences
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('NotificationHistory')}
              icon="history"
              style={styles.actionButton}
            >
              {t('notification.viewHistory')}
            </Button>

            <Button
              mode="outlined"
              onPress={handleClearAll}
              icon="delete-sweep"
              style={styles.actionButton}
            >
              {t('notification.clearAll')}
            </Button>

            {__DEV__ && (
              <Button
                mode="outlined"
                onPress={handleTestNotification}
                icon="test-tube"
                style={styles.actionButton}
              >
                {t('notification.testNotification')}
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('notification.aboutNotifications')}
            </Text>
            <Text variant="bodyMedium" style={styles.aboutText}>
              {t('notification.aboutDescription')}
            </Text>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                {t('notification.benefit1')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                {t('notification.benefit2')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.scheduleItemText}>
                {t('notification.benefit3')}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
    marginBottom: 12,
    fontWeight: 'bold'
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingInfo: {
    flex: 1,
    marginRight: 16
  },
  settingDescription: {
    color: '#666',
    marginTop: 4
  },
  divider: {
    marginVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  infoLabel: {
    color: '#666',
    fontSize: 14
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500'
  },
  scheduleText: {
    marginBottom: 12,
    color: '#666'
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  bullet: {
    marginRight: 8,
    color: '#6200ee'
  },
  scheduleItemText: {
    flex: 1,
    fontSize: 14
  },
  scheduleNote: {
    marginTop: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  actionButton: {
    marginBottom: 12
  },
  aboutText: {
    marginBottom: 12,
    color: '#666'
  }
});

