import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeContext';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'default' // 'default', 'success', 'error', 'warning', 'info'
  });

  const showToast = useCallback((message, type = 'default', duration = 4000) => {
    setSnackbar({
      visible: true,
      message,
      type,
      duration
    });
  }, []);

  const hideToast = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  const getSnackbarStyle = () => {
    switch (snackbar.type) {
      case 'success':
        return { backgroundColor: theme.colors.success };
      case 'error':
        return { backgroundColor: theme.colors.error };
      case 'warning':
        return { backgroundColor: theme.colors.warning };
      case 'info':
        return { backgroundColor: theme.colors.info };
      default:
        return { backgroundColor: theme.colors.surface };
    }
  };

  const getTextColor = () => {
    return snackbar.type === 'default' ? theme.colors.text : '#FFFFFF';
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Portal>
        <Snackbar
          visible={snackbar.visible}
          onDismiss={hideToast}
          duration={snackbar.duration || 4000}
          style={getSnackbarStyle()}
          action={{
            label: t('common.close'),
            onPress: hideToast,
            textColor: getTextColor()
          }}
        >
          {snackbar.message}
        </Snackbar>
      </Portal>
    </ToastContext.Provider>
  );
};

