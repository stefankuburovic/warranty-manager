import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { signIn, signInWithCredentials, isLoading } = useAuth();
  const { showToast } = useToast();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      showToast(t('auth.fillAllFields'), 'error');
      return;
    }

    try {
      await signInWithCredentials(username, password);
      // showToast(t('auth.welcome'), 'success');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage;
      // Check for timeout errors
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = t('error.network');
      } else if (err.response?.status === 401) {
        errorMessage = err.response?.data?.error || t('auth.loginFailed');
      } else {
        errorMessage = err.response?.data?.error || t('auth.loginFailed');
      }
      showToast(errorMessage, 'error');
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Logo 
            size="xlarge" 
            variant="default" 
            animated 
            imageSource={require('../../assets/logo.png')}
          />
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>
          {t('auth.welcome')}
        </Text>
        
        <Text variant="bodyLarge" style={styles.subtitle}>
          {t('auth.signInToContinue')}
        </Text>

        <View style={styles.form}>
          <TextInput
            label={t('auth.usernameOrEmail')}
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

          <Button
            mode="text"
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            {t('auth.forgotPassword')}
          </Button>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          >
            {t('auth.signIn')}
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            mode="outlined"
            onPress={signIn}
            loading={isLoading}
            disabled={isLoading}
            icon="google"
            style={styles.googleButton}
          >
            {t('auth.signInWithGoogle')}
          </Button>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>{t('auth.dontHaveAccount')} </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              compact
            >
              {t('auth.register')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: theme.colors.text
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: theme.colors.textSecondary
  },
  form: {
    width: '100%'
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 10
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 8
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border
  },
  dividerText: {
    marginHorizontal: 10,
    color: theme.colors.textSecondary
  },
  googleButton: {
    marginBottom: 20
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  registerText: {
    color: theme.colors.text
  }
});

