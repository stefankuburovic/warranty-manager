import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-camera', () => {
  const RN = require('react-native');
  const React = require('react');
  return {
    Camera: {
      requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
      getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    },
    CameraView: ({ children, ...props }) => {
      return React.createElement(RN.View, { ...props, testID: 'camera-view' }, children);
    },
    useCameraPermissions: jest.fn(() => [
      { granted: true, canAskAgain: true },
      jest.fn(() => Promise.resolve({ granted: true })),
    ]),
    BarCodeScanner: {
      Constants: {
        BarCodeType: {
          qr: 'qr',
          ean13: 'ean13',
        },
      },
    },
  };
});

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'file://test.jpg' }] })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'file://test.jpg' }] })),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'file://test.pdf' }] })),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 44.7866, longitude: 20.4489 },
  })),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: jest.fn(),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

// Vector icons are mocked via moduleNameMapper in jest.config.js

jest.mock('react-native-paper', () => {
  const RN = require('react-native');
  const React = require('react');
  // Create a proper Button mock that accepts children (like Paper's Button)
  const PaperButton = ({ children, onPress, ...props }) => {
    // Render children as text so they're accessible via getByText
    const childText = typeof children === 'string' ? children : 
      (React.Children.toArray(children).find(child => typeof child === 'string') || children);
    return React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: props.testID }, 
      React.createElement(RN.Text, { testID: props.testID ? `${props.testID}-text` : undefined }, childText)
    );
  };
  
  const PaperMock = {
    Provider: ({ children }) => children,
    Portal: ({ children }) => children,
    Text: RN.Text,
    View: RN.View,
    Button: PaperButton,
    TextInput: Object.assign(({ label, placeholder, value, onChangeText, ...props }) => {
      // Mock TextInput that renders label as text and input as TextInput
      const React = require('react');
      const RN = require('react-native');
      return React.createElement(RN.View, props, 
        label && React.createElement(RN.Text, { testID: `label-${label}` }, label),
        React.createElement(RN.TextInput, { 
          placeholder, 
          value, 
          onChangeText,
          testID: placeholder || `input-${label}`,
          ...props 
        })
      );
    }, {
      Icon: ({ icon, onPress, ...props }) => {
        const React = require('react');
        const RN = require('react-native');
        return React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: `textinput-icon-${icon}` });
      },
    }),
    Card: Object.assign(({ children, ...props }) => React.createElement(RN.View, props, children), {
      Content: ({ children, ...props }) => React.createElement(RN.View, props, children),
      Title: ({ children, ...props }) => React.createElement(RN.Text, props, children),
      Actions: ({ children, ...props }) => React.createElement(RN.View, props, children),
    }),
    Appbar: Object.assign(({ children, ...props }) => React.createElement(RN.View, props, children), {
      Header: ({ children, ...props }) => React.createElement(RN.View, props, children),
      Action: ({ icon, onPress, ...props }) => React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: `appbar-action-${icon}` }),
      Content: ({ title, children, ...props }) => React.createElement(RN.View, props, 
        title && React.createElement(RN.Text, {}, title),
        children
      ),
      BackAction: ({ onPress, ...props }) => React.createElement(RN.TouchableOpacity, { onPress, ...props }),
    }),
    Chip: ({ children, ...props }) => {
      const React = require('react');
      return React.createElement(RN.View, props, 
        React.createElement(RN.Text, {}, children)
      );
    },
    ActivityIndicator: RN.ActivityIndicator,
    Dialog: Object.assign(({ children, visible, ...props }) => visible ? React.createElement(RN.View, props, children) : null, {
      Title: ({ children, ...props }) => React.createElement(RN.Text, props, children),
      Content: ({ children, ...props }) => React.createElement(RN.View, props, children),
      Actions: ({ children, ...props }) => React.createElement(RN.View, props, children),
    }),
    Modal: ({ children, visible, ...props }) => visible ? React.createElement(RN.View, props, children) : null,
    List: Object.assign(({ children, ...props }) => React.createElement(RN.View, props, children), {
      Item: ({ title, description, left, right, onPress, ...props }) => {
        return React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: `list-item-${title || 'default'}` },
          title && React.createElement(RN.Text, {}, title),
          description && React.createElement(RN.Text, {}, description),
          left,
          right
        );
      },
      Section: ({ children, ...props }) => {
        return React.createElement(RN.View, { ...props, testID: 'list-section' },
          children
        );
      },
      Subheader: ({ children, ...props }) => {
        return React.createElement(RN.Text, { ...props, testID: 'list-subheader' }, children);
      },
      Icon: ({ icon, ...props }) => {
        return React.createElement(RN.View, { ...props, testID: `list-icon-${icon}` });
      },
    }),
    RadioButton: Object.assign(({ ...props }) => React.createElement(RN.View, props), {
      Group: ({ children, value, onValueChange, ...props }) => {
        return React.createElement(RN.View, { ...props, testID: 'radio-group' }, children);
      },
      Item: ({ label, value, onPress, ...props }) => {
        const React = require('react');
        return React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: `radio-item-${value || label || 'default'}` },
          label && React.createElement(RN.Text, {}, label)
        );
      },
    }),
    Avatar: Object.assign(({ children, ...props }) => React.createElement(RN.View, props, children), {
      Text: ({ label, ...props }) => {
        const React = require('react');
        return React.createElement(RN.View, props,
          React.createElement(RN.Text, {}, label || 'AV')
        );
      },
      Image: ({ source, ...props }) => {
        const React = require('react');
        return React.createElement(RN.Image, { source, ...props });
      },
    }),
    IconButton: ({ ...props }) => React.createElement(RN.View, props),
    Divider: () => null,
    FAB: Object.assign(({ icon, label, onPress, ...props }) => {
      const React = require('react');
      return React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: `fab-${label || icon || 'default'}` },
        label && React.createElement(RN.Text, {}, label)
      );
    }, {
      Group: ({ children, ...props }) => {
        const React = require('react');
        return React.createElement(RN.View, props, children);
      },
      Action: ({ icon, label, onPress, ...props }) => {
        const React = require('react');
        return React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: `fab-action-${label || icon || 'default'}` },
          label && React.createElement(RN.Text, {}, label)
        );
      },
    }),
    Searchbar: ({ value, onChangeText, placeholder, ...props }) => {
      const React = require('react');
      return React.createElement(RN.View, props,
        React.createElement(RN.TextInput, { 
          value, 
          onChangeText, 
          placeholder,
          testID: `searchbar-${placeholder || 'default'}`,
          ...props 
        })
      );
    },
    Menu: Object.assign(({ children, visible, anchor, ...props }) => {
      const React = require('react');
      return visible ? React.createElement(RN.View, props, children) : null;
    }, {
      Item: ({ onPress, title, ...props }) => {
        const React = require('react');
        return React.createElement(RN.TouchableOpacity, { onPress, ...props },
          React.createElement(RN.Text, {}, title)
        );
      },
    }),
    useTheme: () => ({
      colors: {
        primary: '#6200ee',
        background: '#ffffff',
        surface: '#ffffff',
        text: '#000000',
        textSecondary: '#666666',
        error: '#b00020',
        success: '#4caf50',
        warning: '#ff9800',
        border: '#e0e0e0',
        divider: '#e0e0e0',
        appBar: '#6200ee',
      },
      dark: false,
    }),
  };
  // Add Portal.Host as a nested property on Portal
  const PortalComponent = PaperMock.Portal;
  PortalComponent.Host = ({ children }) => children;
  return PaperMock;
});

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...props }) => {
      return React.createElement(RN.View, props, children);
    },
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: 'languageDetector',
    init: jest.fn(),
  },
}));

// Mock context providers
jest.mock('./src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { user_id: 1, email: 'test@example.com', username: 'testuser' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    signIn: jest.fn(),
    signInWithCredentials: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

jest.mock('./src/context/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
  ToastProvider: ({ children }) => children,
}));

jest.mock('./src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#6200ee',
        background: '#ffffff',
        surface: '#ffffff',
        text: '#000000',
        textSecondary: '#666666',
        error: '#b00020',
        success: '#4caf50',
        warning: '#ff9800',
        border: '#e0e0e0',
        divider: '#e0e0e0',
        appBar: '#6200ee',
      },
      dark: false,
    },
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock API clients
jest.mock('./src/api/products', () => ({
  productsApi: {
    getProducts: jest.fn(() => Promise.resolve({ products: [] })),
    getProductById: jest.fn(() => Promise.resolve({})),
    createProduct: jest.fn(() => Promise.resolve({})),
    updateProduct: jest.fn(() => Promise.resolve({})),
    deleteProduct: jest.fn(() => Promise.resolve({})),
  },
}));

jest.mock('./src/api/auth', () => ({
  authApi: {
    login: jest.fn(() => Promise.resolve({ token: 'test-token' })),
    register: jest.fn(() => Promise.resolve({})),
    logout: jest.fn(() => Promise.resolve({})),
  },
}));

jest.mock('./src/api/stores', () => ({
  storesApi: {
    getStores: jest.fn(() => Promise.resolve({ stores: [] })),
    createStore: jest.fn(() => Promise.resolve({ store: {} })),
  },
}));

jest.mock('./src/api/categories', () => ({
  categoriesApi: {
    getCategories: jest.fn(() => Promise.resolve({ categories: [] })),
  },
}));

jest.mock('./src/api/ocr', () => ({
  ocrApi: {
    scanReceipt: jest.fn(() => Promise.resolve({})),
  },
}));

jest.mock('./src/api/documents', () => ({
  documentsApi: {
    uploadDocument: jest.fn(() => Promise.resolve({})),
  },
}));

// Mock Logo component
jest.mock('./src/components/Logo', () => {
  const RN = require('react-native');
  const React = require('react');
  return ({ size, style, variant, animated, showText, ...props }) => {
    return React.createElement(RN.View, { ...props, testID: 'logo' }, 
      showText && React.createElement(RN.Text, {}, 'Logo')
    );
  };
});

// Mock ProductCard component
jest.mock('./src/components/ProductCard', () => {
  const RN = require('react-native');
  const React = require('react');
  return ({ product, onPress, ...props }) => {
    return React.createElement(RN.TouchableOpacity, { onPress, ...props, testID: `product-card-${product?.product_id || 'default'}` },
      React.createElement(RN.Text, {}, product?.product_name || 'Product')
    );
  };
});

// Mock StoreSelector component
jest.mock('./src/components/StoreSelector', () => {
  const RN = require('react-native');
  const React = require('react');
  return ({ value, onSelect, style, ...props }) => {
    return React.createElement(RN.View, { ...props, testID: 'store-selector' },
      React.createElement(RN.Text, {}, 'StoreSelector')
    );
  };
});

// Mock CategorySelector component
jest.mock('./src/components/CategorySelector', () => {
  const RN = require('react-native');
  const React = require('react');
  return ({ value, onSelect, style, ...props }) => {
    return React.createElement(RN.View, { ...props, testID: 'category-selector' },
      React.createElement(RN.Text, {}, 'CategorySelector')
    );
  };
});

// Mock Autocomplete component (used by CategorySelector)
jest.mock('./src/components/Autocomplete', () => {
  const RN = require('react-native');
  const React = require('react');
  return ({ value, onChangeText, data, onSelect, ...props }) => {
    return React.createElement(RN.View, { ...props, testID: 'autocomplete' },
      React.createElement(RN.TextInput, { value, onChangeText, ...props })
    );
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

