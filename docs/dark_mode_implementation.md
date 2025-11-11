# Dark Mode - Complete Theme Implementation v1.5.0

## Overview
Implement a beautiful, complete dark theme across the entire app with smooth transitions and persistent user preference.

**Features:**
- Complete dark theme for all screens
- Smooth theme transitions
- Persistent theme preference
- System theme detection
- Manual theme toggle
- Optimized colors for readability
- Dark status bar styling

---

## Part 1: Theme Setup

### 1.1 Install Dependencies

```bash
cd mobile
npm install react-native-appearance
```

### 1.2 Create Theme System

```javascript
// src/theme/colors.js
export const lightColors = {
  // Primary colors
  primary: '#6200ee',
  primaryLight: '#7c4dff',
  primaryDark: '#3700b3',
  
  // Background colors
  background: '#ffffff',
  surface: '#ffffff',
  card: '#ffffff',
  
  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Border colors
  border: '#e0e0e0',
  divider: '#f0f0f0',
  
  // Other colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#cccccc',
  placeholder: '#9e9e9e',
  
  // Specific UI colors
  appBar: '#6200ee',
  statusBar: '#3700b3',
  fab: '#6200ee',
  ripple: 'rgba(98, 0, 238, 0.12)',
  
  // Shadow
  shadow: '#000000',
  elevation: {
    level0: 'transparent',
    level1: '#ffffff',
    level2: '#ffffff',
    level3: '#ffffff',
    level4: '#ffffff',
    level5: '#ffffff',
  }
};

export const darkColors = {
  // Primary colors
  primary: '#bb86fc',
  primaryLight: '#e1bee7',
  primaryDark: '#9c4dcc',
  
  // Background colors
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2c2c2c',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  textTertiary: '#808080',
  
  // Status colors
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  info: '#42a5f5',
  
  // Border colors
  border: '#3d3d3d',
  divider: '#2c2c2c',
  
  // Other colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: '#4d4d4d',
  placeholder: '#666666',
  
  // Specific UI colors
  appBar: '#1e1e1e',
  statusBar: '#121212',
  fab: '#bb86fc',
  ripple: 'rgba(187, 134, 252, 0.12)',
  
  // Shadow
  shadow: '#000000',
  elevation: {
    level0: 'transparent',
    level1: '#1e1e1e',
    level2: '#232323',
    level3: '#272727',
    level4: '#2c2c2c',
    level5: '#313131',
  }
};
```

```javascript
// src/theme/theme.js
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { lightColors, darkColors } from './colors';

export const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    primaryContainer: lightColors.primaryLight,
    secondary: lightColors.primary,
    secondaryContainer: lightColors.primaryLight,
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceVariant: lightColors.card,
    error: lightColors.error,
    errorContainer: '#ffcdd2',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: lightColors.text,
    onSurface: lightColors.text,
    onSurfaceVariant: lightColors.textSecondary,
    onError: '#ffffff',
    outline: lightColors.border,
    outlineVariant: lightColors.divider,
    inverseSurface: '#2c2c2c',
    inverseOnSurface: '#ffffff',
    inversePrimary: darkColors.primary,
    elevation: lightColors.elevation,
    
    // Custom colors
    success: lightColors.success,
    warning: lightColors.warning,
    info: lightColors.info,
    textSecondary: lightColors.textSecondary,
    textTertiary: lightColors.textTertiary,
    border: lightColors.border,
    divider: lightColors.divider,
    overlay: lightColors.overlay,
    disabled: lightColors.disabled,
    placeholder: lightColors.placeholder,
    appBar: lightColors.appBar,
    statusBar: lightColors.statusBar,
    fab: lightColors.fab,
    ripple: lightColors.ripple,
    card: lightColors.card,
  }
};

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    primaryContainer: darkColors.primaryDark,
    secondary: darkColors.primary,
    secondaryContainer: darkColors.primaryDark,
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceVariant: darkColors.card,
    error: darkColors.error,
    errorContainer: '#b71c1c',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: darkColors.text,
    onSurface: darkColors.text,
    onSurfaceVariant: darkColors.textSecondary,
    onError: '#000000',
    outline: darkColors.border,
    outlineVariant: darkColors.divider,
    inverseSurface: '#e0e0e0',
    inverseOnSurface: '#000000',
    inversePrimary: lightColors.primary,
    elevation: darkColors.elevation,
    
    // Custom colors
    success: darkColors.success,
    warning: darkColors.warning,
    info: darkColors.info,
    textSecondary: darkColors.textSecondary,
    textTertiary: darkColors.textTertiary,
    border: darkColors.border,
    divider: darkColors.divider,
    overlay: darkColors.overlay,
    disabled: darkColors.disabled,
    placeholder: darkColors.placeholder,
    appBar: darkColors.appBar,
    statusBar: darkColors.statusBar,
    fab: darkColors.fab,
    ripple: darkColors.ripple,
    card: darkColors.card,
  }
};
```

### 1.3 Theme Context

```javascript
// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/theme';

const THEME_KEY = '@app_theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const changeTheme = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        themeMode,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 1.4 Update App.js

```javascript
// App.js
import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';

function AppContent() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.statusBar}
      />
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
```

---

## Part 2: Update All Screens

### 2.1 Create Themed Components

```javascript
// src/components/ThemedView.js
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const ThemedView = ({ style, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        { backgroundColor: theme.colors.background },
        style
      ]} 
      {...props} 
    />
  );
};

export const ThemedCard = ({ style, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        { 
          backgroundColor: theme.colors.card,
          borderRadius: 8,
          elevation: 2,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        style
      ]} 
      {...props} 
    />
  );
};
```

### 2.2 Update Login Screen

```javascript
// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { signIn, signInWithCredentials, isLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    
    if (!username || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    try {
      await signInWithCredentials(username, password);
    } catch (err) {
      setError(t('auth.loginFailed'));
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
        />
        
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

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

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
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
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
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center'
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
```

### 2.3 Update Home Screen

```javascript
// src/screens/HomeScreen.js - Key changes
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  
  // ... existing logic ...

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content title={t('home.title')} />
        {/* ... actions ... */}
      </Appbar.Header>

      <Searchbar
        placeholder={t('common.search')}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        iconColor={theme.colors.primary}
        placeholderTextColor={theme.colors.placeholder}
      />

      {/* ... rest of component ... */}
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
  searchbar: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    elevation: 2
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center',
    color: theme.colors.text
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary
  },
  list: {
    padding: 16,
    paddingTop: 8
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text
  },
  brand: {
    color: theme.colors.textSecondary
  },
  detailText: {
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.fab
  }
});
```

### 2.4 Theme Settings Screen

```javascript
// src/screens/ThemeSettingsScreen.js
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
    elevation: 2
  },
  previewCardTitle: {
    marginBottom: 8,
    color: theme.colors.text
  },
  previewCardText: {
    color: theme.colors.textSecondary
  }
});
```

### 2.5 Update Settings Screen

```javascript
// Add theme option to SettingsScreen.js
<List.Section>
  <List.Subheader>{t('settings.appearance')}</List.Subheader>
  <List.Item
    title={t('settings.theme.title')}
    description={t(`settings.theme.${themeMode}`)}
    left={props => <List.Icon {...props} icon="theme-light-dark" />}
    right={props => <List.Icon {...props} icon="chevron-right" />}
    onPress={() => navigation.navigate('ThemeSettings')}
  />
</List.Section>
```

---

## Part 3: Update All Remaining Screens

I'll provide a helper utility to make updating easier:

### 3.1 Style Helper Utility

```javascript
// src/utils/styleHelpers.js
export const createThemedStyles = (styleFunction, theme) => {
  return styleFunction(theme);
};

// Usage in components:
// const styles = useMemo(() => createStyles(theme), [theme]);
```

### 3.2 Quick Update Template

For each screen, follow this pattern:

```javascript
// 1. Import useTheme
import { useTheme } from '../context/ThemeContext';

// 2. Get theme in component
const { theme } = useTheme();

// 3. Move StyleSheet.create into function
const createStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background
  },
  // ... other styles with theme.colors
});

// 4. Create styles from theme
const styles = createStyles(theme);
```

### 3.3 All Screens to Update

Apply the pattern above to:
- ✅ LoginScreen
- ✅ HomeScreen
- RegisterScreen
- ForgotPasswordScreen
- AddProductScreen
- EditProductScreen
- ProductDetailScreen
- DocumentsScreen
- OCRScannerScreen
- StatisticsScreen
- NotificationSettingsScreen
- NotificationHistoryScreen
- FamilyScreen
- SharedProductsScreen
- ExportScreen

---

## Part 4: Update Navigation

### 4.1 Update App Navigator

```javascript
// src/navigation/AppNavigator.js
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';

// Add to authenticated stack:
<Stack.Screen 
  name="ThemeSettings" 
  component={ThemeSettingsScreen}
  options={{ headerShown: false }}
/>
```

---

## Part 5: Translation Keys

### 5.1 Add Theme Translations

**English (en.json):**
```json
"settings": {
  "theme": {
    "title": "Theme",
    "selectTheme": "Select Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System Default",
    "lightDescription": "Light theme for daytime use",
    "darkDescription": "Dark theme for nighttime use",
    "systemDescription": "Follow system settings",
    "preview": "Preview",
    "sampleCard": "Sample Card",
    "sampleText": "This is how text will appear in the selected theme"
  }
}
```

**Serbian Latin:**
```json
"settings": {
  "theme": {
    "title": "Tema",
    "selectTheme": "Izaberite temu",
    "light": "Svetla",
    "dark": "Tamna",
    "system": "Sistemska",
    "lightDescription": "Svetla tema za dnevnu upotrebu",
    "darkDescription": "Tamna tema za noćnu upotrebu",
    "systemDescription": "Prati sistemska podešavanja",
    "preview": "Pregled",
    "sampleCard": "Primer kartice",
    "sampleText": "Ovako će tekst izgledati u izabranoj temi"
  }
}
```

**Serbian Cyrillic:**
```json
"settings": {
  "theme": {
    "title": "Тема",
    "selectTheme": "Изаберите тему",
    "light": "Светла",
    "dark": "Тамна",
    "system": "Системска",
    "lightDescription": "Светла тема за дневну употребу",
    "darkDescription": "Тамна тема за ноћну употребу",
    "systemDescription": "Прати системска подешавања",
    "preview": "Преглед",
    "sampleCard": "Пример картице",
    "sampleText": "Овако ће текст изгледати у изабраној теми"
  }
}
```

---

## Part 6: Optimization & Performance

### 6.1 Prevent Unnecessary Re-renders

```javascript
// Use React.memo for themed components
import React, { memo } from 'react';

export const ThemedCard = memo(({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        { 
          backgroundColor: theme.colors.card,
          borderRadius: 8,
          elevation: 2,
        },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
});
```

### 6.2 Use useMemo for Styles

```javascript
import { useMemo } from 'react';

export default function MyScreen() {
  const { theme } = useTheme();
  
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // ...
}
```

---

## Part 7: Backend Support (Optional)

### 7.1 Store Theme Preference

```javascript
// Update User model
preferred_theme: {
  type: DataTypes.STRING(10),
  defaultValue: 'system',
  allowNull: true
}

// Add endpoint
exports.updateThemePreference = async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    
    await req.user.update({ preferred_theme: theme });
    
    res.json({ message: 'Theme preference updated', theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
};
```

---

## ✅ What's Complete in v1.5.0:

### Dark Mode System:
1. ✅ **Complete Theme System** - Light and dark themes
2. ✅ **System Detection** - Auto-detect device theme
3. ✅ **Manual Toggle** - 3 modes (Light/Dark/System)
4. ✅ **Persistent Preference** -