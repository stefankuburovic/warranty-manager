import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { register, isLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    // Validation
    if (!username || !email || !fullName || !password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (username.length < 3) {
      setError(t('auth.usernameMinLength'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      await register({ username, email, full_name: fullName, password });
      // Navigation will happen automatically via AuthContext
      // No need to navigate manually - the app will redirect to Home
    } catch (err) {
      setError(err.response?.data?.error || t('auth.registrationFailed'));
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('auth.register')} />
      </Appbar.Header>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Logo size="large" variant="default" />
          </View>
          
          <Text variant="headlineSmall" style={styles.title}>
            {t('auth.createAccount')}
          </Text>

          <TextInput
            label={t('auth.username')}
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            left={<TextInput.Icon icon="account" />}
            textColor={theme.colors.text}
          />

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

          <TextInput
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account-circle" />}
            textColor={theme.colors.text}
          />

          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            left={<TextInput.Icon icon="lock" />}
            textColor={theme.colors.text}
          />

          <TextInput
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            left={<TextInput.Icon icon="lock-check" />}
            textColor={theme.colors.text}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Text variant="bodySmall" style={styles.hint}>
            {t('auth.passwordRequirements')}
          </Text>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
          >
            {t('auth.register')}
          </Button>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              compact
            >
              {t('auth.signIn')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.colors.text
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center'
  },
  hint: {
    color: theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center'
  },
  registerButton: {
    marginTop: 10,
    paddingVertical: 8
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  loginText: {
    color: theme.colors.text
  }
});

