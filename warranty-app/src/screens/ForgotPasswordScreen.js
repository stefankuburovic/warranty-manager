import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api/auth';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.enterEmail'));
      return;
    }

    try {
      setIsLoading(true);
      await authApi.forgotPassword(email);
      
      Alert.alert(
        t('common.success'),
        t('auth.resetLinkSent'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('auth.forgotPassword')} />
      </Appbar.Header>

      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          {t('auth.resetPassword')}
        </Text>

        <Text variant="bodyMedium" style={styles.description}>
          {t('auth.resetPasswordDescription')}
        </Text>

        <TextInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          left={<TextInput.Icon icon="email" />}
          textColor={theme.colors.text}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        >
          {t('auth.sendResetLink')}
        </Button>
      </View>
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
    padding: 20
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: theme.colors.text
  },
  description: {
    marginBottom: 30,
    textAlign: 'center',
    color: theme.colors.textSecondary
  },
  input: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface
  },
  submitButton: {
    paddingVertical: 8
  }
});

