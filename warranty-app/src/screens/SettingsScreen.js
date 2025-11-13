import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Appbar, List, Divider, Dialog, Portal, RadioButton, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, themeMode, changeTheme } = useTheme();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage());

  const languages = getAvailableLanguages();
  
  const themeOptions = [
    { value: 'light', label: t('settings.theme.light') },
    { value: 'dark', label: t('settings.theme.dark') },
    { value: 'system', label: t('settings.theme.system') }
  ];

  useEffect(() => {
    setSelectedLanguage(getCurrentLanguage());
  }, []);

  const handleLanguageChange = async (languageCode) => {
    const success = await changeLanguage(languageCode);
    if (success) {
      setSelectedLanguage(languageCode);
      setLanguageDialogVisible(false);
    } else {
      Alert.alert(t('common.error'), t('error.generic'));
    }
  };

  const handleThemeChange = async (themeValue) => {
    await changeTheme(themeValue);
    setThemeDialogVisible(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      t('auth.signOut'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.signOut'), 
          style: 'destructive',
          onPress: signOut 
        }
      ]
    );
  };

  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === selectedLanguage);
    return lang ? lang.nativeName : '';
  };

  const getThemeModeLabel = () => {
    switch (themeMode) {
      case 'light':
        return t('settings.theme.light');
      case 'dark':
        return t('settings.theme.dark');
      case 'system':
        return t('settings.theme.system');
      default:
        return t('settings.theme.system');
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {/* Language Section */}
        <List.Section>
          <List.Subheader>{t('settings.language')}</List.Subheader>
          <List.Item
            title={t('settings.selectLanguage')}
            description={getCurrentLanguageName()}
            left={props => <List.Icon {...props} icon="translate" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setLanguageDialogVisible(true)}
          />
        </List.Section>

        <Divider />

        {/* Appearance Section */}
        <List.Section>
          <List.Subheader>{t('settings.appearance')}</List.Subheader>
          <List.Item
            title={t('settings.theme.title')}
            description={getThemeModeLabel()}
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setThemeDialogVisible(true)}
          />
        </List.Section>

        <Divider />

        {/* Account Section */}
        <List.Section>
          <List.Subheader>{t('settings.account')}</List.Subheader>
          <List.Item
            title={t('settings.profile')}
            left={props => <List.Icon {...props} icon="account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Profile')}
          />
          <List.Item
            title={t('notification.notificationSettings')}
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </List.Section>

        <Divider />

        {/* About Section */}
        <List.Section>
          <List.Subheader>{t('settings.about')}</List.Subheader>
          <List.Item
            title={t('settings.version')}
            description="2.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title={t('settings.privacyPolicy')}
            left={props => <List.Icon {...props} icon="shield-account" />}
            right={props => <List.Icon {...props} icon="open-in-new" />}
            onPress={() => {}}
          />
          <List.Item
            title={t('settings.termsOfService')}
            left={props => <List.Icon {...props} icon="file-document" />}
            right={props => <List.Icon {...props} icon="open-in-new" />}
            onPress={() => {}}
          />
          <List.Item
            title={t('settings.help')}
            left={props => <List.Icon {...props} icon="help-circle" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </List.Section>

        <Divider />

        {/* Sign Out */}
        <List.Item
          title={t('auth.signOut')}
          titleStyle={{ color: '#f44336' }}
          left={props => <List.Icon {...props} icon="logout" color="#f44336" />}
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </ScrollView>

      {/* Language Selection Dialog */}
      <Portal>
        <Dialog 
          visible={languageDialogVisible} 
          onDismiss={() => setLanguageDialogVisible(false)}
        >
          <Dialog.Title>{t('settings.selectLanguage')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group 
              onValueChange={handleLanguageChange}
              value={selectedLanguage}
            >
              {languages.map(lang => (
                <RadioButton.Item
                  key={lang.code}
                  label={lang.nativeName}
                  value={lang.code}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLanguageDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Theme Selection Dialog */}
      <Portal>
        <Dialog 
          visible={themeDialogVisible} 
          onDismiss={() => setThemeDialogVisible(false)}
        >
          <Dialog.Title>{t('settings.theme.selectTheme')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group 
              onValueChange={handleThemeChange}
              value={themeMode}
            >
              {themeOptions.map(option => (
                <RadioButton.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setThemeDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
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
  content: {
    flex: 1
  },
  contentContainer: {
    paddingBottom: 16
  },
  signOutButton: {
    marginTop: 16,
    marginBottom: 8
  }
});

