import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import {
  Text, Appbar, Switch, Card, Divider, Button, Chip,
  List, ActivityIndicator, Portal, Dialog, SegmentedButtons
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { notificationsApi } from '../api/notifications';

export default function NotificationPreferencesScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('notification_time');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getPreferences();
      // Backend returns preferences object directly (not wrapped)
      // axios response.data contains the preferences object
      if (data) {
        setPrefs(data);
      } else {
        throw new Error('No preferences data received');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', `Failed to load preferences: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      await notificationsApi.updatePreferences(prefs);
      Alert.alert('Success', 'Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePref = (key, value) => {
    setPrefs({ ...prefs, [key]: value });
  };

  const toggleInterval = (days) => {
    const intervals = Array.isArray(prefs.reminder_intervals) 
      ? [...prefs.reminder_intervals] 
      : [3, 7, 14, 30];
    
    const index = intervals.indexOf(days);
    
    if (index > -1) {
      if (intervals.length === 1) {
        Alert.alert('Notice', 'Must have at least one reminder interval');
        return;
      }
      intervals.splice(index, 1);
    } else {
      intervals.push(days);
      intervals.sort((a, b) => a - b);
    }
    
    updatePref('reminder_intervals', intervals);
  };

  const handleTimePick = (event, selectedTime) => {
    setShowTimePicker(false);
    
    if (event.type === 'set' && selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      updatePref(timePickerMode, `${hours}:${minutes}:00`);
    }
  };

  const testNotifications = async () => {
    try {
      setShowTestDialog(true);
      setTestResults(null);
      const result = await notificationsApi.testChannels('all');
      setTestResults(result.results);
    } catch (error) {
      console.error('Error testing notifications:', error);
      Alert.alert('Error', 'Failed to send test notifications');
      setShowTestDialog(false);
    }
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : '09:00';
  };

  const getTimePickerValue = () => {
    const timeString = prefs?.[timePickerMode] || '09:00:00';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours) || 9);
    date.setMinutes(parseInt(minutes) || 0);
    return date;
  };

  if (isLoading || !prefs) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Notification Preferences" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  const reminderIntervals = [3, 7, 14, 30, 60, 90];
  const userIntervals = Array.isArray(prefs.reminder_intervals) 
    ? prefs.reminder_intervals 
    : [3, 7, 14, 30];

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Notification Preferences" />
        <Appbar.Action icon="check" onPress={savePreferences} disabled={isSaving} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        
        {/* Global Toggle */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text variant="titleMedium">Enable Notifications</Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  Receive warranty expiration reminders
                </Text>
              </View>
              <Switch
                value={prefs.notifications_enabled}
                onValueChange={(v) => updatePref('notifications_enabled', v)}
              />
            </View>
          </Card.Content>
        </Card>

        {prefs.notifications_enabled && (
          <>
            {/* Notification Channels */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Notification Channels
                </Text>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text variant="bodyMedium">📱 Push Notifications</Text>
                    <Text variant="bodySmall" style={styles.settingSubtext}>
                      In-app notifications
                    </Text>
                  </View>
                  <Switch
                    value={prefs.push_enabled}
                    onValueChange={(v) => updatePref('push_enabled', v)}
                  />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text variant="bodyMedium">📧 Email Notifications</Text>
                    <Text variant="bodySmall" style={styles.settingSubtext}>
                      Receive emails for reminders
                    </Text>
                  </View>
                  <Switch
                    value={prefs.email_enabled}
                    onValueChange={(v) => updatePref('email_enabled', v)}
                  />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text variant="bodyMedium">💬 SMS Notifications</Text>
                    <Text variant="bodySmall" style={styles.settingSubtext}>
                      Text messages
                    </Text>
                  </View>
                  <Switch
                    value={prefs.sms_enabled}
                    onValueChange={(v) => updatePref('sms_enabled', v)}
                  />
                </View>
              </Card.Content>
            </Card>

            {/* Reminder Schedule */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Reminder Schedule
                </Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  Days before warranty expires
                </Text>

                <View style={styles.chipsContainer}>
                  {reminderIntervals.map(days => (
                    <Chip
                      key={days}
                      selected={userIntervals.includes(days)}
                      onPress={() => toggleInterval(days)}
                      style={styles.chip}
                    >
                      {days} days
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>

            {/* Timing Settings */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Timing
                </Text>

                <List.Item
                  title="Notification Time"
                  description={formatTime(prefs.notification_time)}
                  left={props => <List.Icon {...props} icon="clock-outline" />}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => {
                    setTimePickerMode('notification_time');
                    setShowTimePicker(true);
                  }}
                />

                <Divider />

                <List.Item
                  title="Quiet Hours Start"
                  description={formatTime(prefs.quiet_hours_start)}
                  left={props => <List.Icon {...props} icon="weather-night" />}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => {
                    setTimePickerMode('quiet_hours_start');
                    setShowTimePicker(true);
                  }}
                />

                <Divider />

                <List.Item
                  title="Quiet Hours End"
                  description={formatTime(prefs.quiet_hours_end)}
                  left={props => <List.Icon {...props} icon="weather-sunny" />}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => {
                    setTimePickerMode('quiet_hours_end');
                    setShowTimePicker(true);
                  }}
                />
              </Card.Content>
            </Card>

            {/* Advanced Settings */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Advanced
                </Text>

                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text variant="bodyMedium">Group Notifications</Text>
                    <Text variant="bodySmall" style={styles.settingSubtext}>
                      Combine multiple reminders
                    </Text>
                  </View>
                  <Switch
                    value={prefs.group_notifications}
                    onValueChange={(v) => updatePref('group_notifications', v)}
                  />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text variant="bodyMedium">Do Not Disturb</Text>
                    <Text variant="bodySmall" style={styles.settingSubtext}>
                      Pause notifications temporarily
                    </Text>
                  </View>
                  <Switch
                    value={prefs.dnd_enabled}
                    onValueChange={(v) => updatePref('dnd_enabled', v)}
                  />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.sliderContainer}>
                  <Text variant="bodyMedium">Max Daily Notifications</Text>
                  <View style={styles.sliderRow}>
                    <Text variant="bodySmall" style={styles.sliderValue}>
                      {prefs.max_daily_notifications || 10}
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={20}
                      step={1}
                      value={prefs.max_daily_notifications || 10}
                      onValueChange={(v) => updatePref('max_daily_notifications', Math.round(v))}
                      minimumTrackTintColor="#6366F1"
                      maximumTrackTintColor="#E0E0E0"
                      thumbTintColor="#6366F1"
                    />
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.settingColumn}>
                  <Text variant="bodyMedium">Priority Filter</Text>
                  <Text variant="bodySmall" style={styles.subtitle}>
                    Which priorities to receive
                  </Text>
                  <SegmentedButtons
                    value={prefs.priority_filter || 'all'}
                    onValueChange={(v) => updatePref('priority_filter', v)}
                    buttons={[
                      { value: 'all', label: 'All' },
                      { value: 'high_only', label: 'High+' },
                      { value: 'critical_only', label: 'Critical' },
                    ]}
                    style={styles.segmentedButtons}
                  />
                </View>
              </Card.Content>
            </Card>

            {/* Test Notifications */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Test Notifications
                </Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  Verify your notification setup
                </Text>

                <Button
                  mode="outlined"
                  onPress={testNotifications}
                  style={styles.testButton}
                  icon="bell-ring"
                >
                  Send Test Notifications
                </Button>
              </Card.Content>
            </Card>

          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={getTimePickerValue()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimePick}
        />
      )}

      {/* Test Results Dialog */}
      <Portal>
        <Dialog visible={showTestDialog} onDismiss={() => setShowTestDialog(false)}>
          <Dialog.Title>Test Results</Dialog.Title>
          <Dialog.Content>
            {!testResults ? (
              <View style={styles.testLoadingContainer}>
                <ActivityIndicator />
                <Text style={styles.testLoadingText}>Sending...</Text>
              </View>
            ) : (
              <View>
                {testResults.push && (
                  <View style={styles.testResult}>
                    <Text variant="bodyMedium">
                      {testResults.push.success ? '✅' : '❌'} Push
                    </Text>
                    <Text variant="bodySmall" style={styles.testResultDetail}>
                      {testResults.push.success ? 'Sent' : testResults.push.error}
                    </Text>
                  </View>
                )}
                {testResults.email && (
                  <View style={styles.testResult}>
                    <Text variant="bodyMedium">
                      {testResults.email.success ? '✅' : '❌'} Email
                    </Text>
                    <Text variant="bodySmall" style={styles.testResultDetail}>
                      {testResults.email.success ? 'Sent' : testResults.email.error}
                    </Text>
                  </View>
                )}
                {testResults.sms && (
                  <View style={styles.testResult}>
                    <Text variant="bodyMedium">
                      {testResults.sms.success ? '✅' : '❌'} SMS
                    </Text>
                    <Text variant="bodySmall" style={styles.testResultDetail}>
                      {testResults.sms.success ? 'Sent' : testResults.sms.error}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTestDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  card: { margin: 16, marginTop: 8, elevation: 2 },
  cardTitle: { marginBottom: 8, fontWeight: 'bold' },
  subtitle: { marginTop: 4, opacity: 0.6 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingText: { flex: 1, marginRight: 16 },
  settingSubtext: { marginTop: 4, opacity: 0.6, fontSize: 12 },
  settingColumn: { paddingVertical: 8 },
  divider: { marginVertical: 12 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  chip: { marginRight: 8, marginBottom: 8 },
  sliderContainer: { paddingVertical: 8 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sliderValue: { minWidth: 30, fontWeight: 'bold', color: '#6366F1' },
  slider: { flex: 1, marginLeft: 12 },
  segmentedButtons: { marginTop: 12 },
  testButton: { marginTop: 16 },
  testLoadingContainer: { alignItems: 'center', paddingVertical: 20 },
  testLoadingText: { marginTop: 12, opacity: 0.7 },
  testResult: { marginBottom: 16 },
  testResultDetail: { marginTop: 4, opacity: 0.7 },
  bottomPadding: { height: 32 }
});

