import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Appbar, List, RadioButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, themeMode, changeTheme } = useTheme();

  const styles = createStyles(theme);

  const themeOptions = [
    { value: 'light', label: t('settings.theme.light'), icon: 'white-balance-sunny' },
    { value: 'dark', label: t('settings.theme.dark'), icon: 'moon-waning-crescent' },
    { value: 'system', label: t('settings.theme.system'), icon: 'cog' }
  ];

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.theme.title')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader style={styles.subheader}>
            {t('settings.theme.selectTheme')}
          </List.Subheader>
          
          <RadioButton.Group onValueChange={changeTheme} value={themeMode}>
            {themeOptions.map((option) => (
              <List.Item
                key={option.value}
                title={option.label}
                description={t(`settings.theme.${option.value}Description`)}
                left={props => <List.Icon {...props} icon={option.icon} />}
                right={() => (
                  <RadioButton value={option.value} />
                )}
                onPress={() => changeTheme(option.value)}
                style={styles.listItem}
              />
            ))}
          </RadioButton.Group>
        </List.Section>

        <View style={styles.previewContainer}>
          <Text variant="titleMedium" style={styles.previewTitle}>
            {t('settings.theme.preview')}
          </Text>
          <View style={styles.previewCard}>
            <Text variant="headlineSmall" style={styles.previewCardTitle}>
              {t('settings.theme.sampleCard')}
            </Text>
            <Text variant="bodyMedium" style={styles.previewCardText}>
              {t('settings.theme.sampleText')}
            </Text>
          </View>
        </View>
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
  subheader: {
    color: theme.colors.primary
  },
  listItem: {
    backgroundColor: theme.colors.surface
  },
  previewContainer: {
    padding: 16,
    marginTop: 16
  },
  previewTitle: {
    marginBottom: 16,
    color: theme.colors.text
  },
  previewCard: {
    padding: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewCardTitle: {
    marginBottom: 8,
    color: theme.colors.text
  },
  previewCardText: {
    color: theme.colors.textSecondary
  }
});

