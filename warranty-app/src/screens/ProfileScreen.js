import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Appbar, Card, List, Divider, TextInput, Button, Dialog, Portal, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api/auth';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentLanguage } from '../i18n';

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user: authUser, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Edit form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await authApi.getProfile();
      setUser(data.user);
      setFullName(data.user.full_name || '');
      setPhoneNumber(data.user.phone_number || '');
      setProfilePicture(data.user.profile_picture_url);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('common.error'), t('profile.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };


  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFullName(user?.full_name || '');
    setPhoneNumber(user?.phone_number || '');
    setProfilePicture(user?.profile_picture_url);
  };

  const handleSave = async () => {
    try {
      const updateData = {
        full_name: fullName,
        phone_number: phoneNumber || null,
        profile_picture_url: profilePicture || null
      };
      
      const data = await authApi.updateProfile(updateData);
      setUser(data.user);
      setIsEditing(false);
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('profile.updateFailed'));
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('profile.imagePermissionDenied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('profile.imagePickFailed'));
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('profile.cameraPermissionDenied'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), t('profile.photoFailed'));
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      Alert.alert(t('common.error'), t('profile.fillAllPasswordFields'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('common.success'), t('profile.passwordChanged'));
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('profile.passwordChangeFailed'));
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion endpoint
            Alert.alert(t('common.error'), t('profile.deleteAccountNotImplemented'));
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('profile.notAvailable');
    const currentLang = getCurrentLanguage();
    const dateLocale = currentLang.startsWith('sr') ? 'sr-RS' : 'en-US';
    return new Date(dateString).toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const styles = createStyles(theme);

  if (isLoading || !user) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('settings.profile')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.profile')} />
        {!isEditing && (
          <Appbar.Action icon="pencil" onPress={handleEdit} />
        )}
      </Appbar.Header>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {/* Profile Header */}
        <Card style={styles.card}>
          <Card.Content style={styles.profileHeader}>
            <TouchableOpacity 
              onPress={isEditing ? () => {
                Alert.alert(
                  t('profile.changeProfilePicture'),
                  '',
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('document.takePhoto'), onPress: handleTakePhoto },
                    { text: t('document.chooseFromGallery'), onPress: handlePickImage },
                    { text: t('common.delete'), style: 'destructive', onPress: () => setProfilePicture(null) }
                  ]
                );
              } : undefined}
              disabled={!isEditing}
            >
              {profilePicture ? (
                <Avatar.Image 
                  size={100} 
                  source={{ uri: profilePicture }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text 
                  size={100} 
                  label={user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  style={styles.avatar}
                />
              )}
              {isEditing && (
                <View style={styles.editBadge}>
                  <Text style={styles.editBadgeText}>✏️</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              {isEditing ? (
                <>
                  <TextInput
                    label={t('auth.fullName')}
                    value={fullName}
                    onChangeText={setFullName}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('store.phone')}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </>
              ) : (
                <>
                  <Text variant="headlineSmall" style={styles.name}>{user.full_name}</Text>
                  {user.email && (
                    <Text variant="bodyMedium" style={styles.email}>{user.email}</Text>
                  )}
                  {user.username && (
                    <Text variant="bodySmall" style={styles.username}>@{user.username}</Text>
                  )}
                  {user.phone_number && (
                    <Text variant="bodySmall" style={styles.phone}>{user.phone_number}</Text>
                  )}
                </>
              )}
            </View>
          </Card.Content>
          {isEditing && (
            <Card.Actions style={styles.editActions}>
              <Button onPress={handleCancelEdit}>{t('common.cancel')}</Button>
              <Button mode="contained" onPress={handleSave}>{t('common.save')}</Button>
            </Card.Actions>
          )}
        </Card>

        {/* Account Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('profile.accountInformation')}
            </Text>
            <List.Item
              title={t('profile.accountType')}
              description={user.auth_type === 'google' ? t('profile.googleAccount') : t('profile.localAccount')}
              left={props => <List.Icon {...props} icon={user.auth_type === 'google' ? 'google' : 'account'} />}
            />
            <Divider />
            <List.Item
              title={t('profile.emailVerification')}
              description={user.email_verified ? t('profile.verified') : t('profile.notVerified')}
              left={props => <List.Icon {...props} icon={user.email_verified ? 'check-circle' : 'alert-circle'} />}
            />
            <Divider />
            <List.Item
              title={t('profile.memberSince')}
              description={formatDate(user.created_at)}
              left={props => <List.Icon {...props} icon="calendar" />}
            />
            {user.last_login_at && (
              <>
                <Divider />
                <List.Item
                  title={t('profile.lastLogin')}
                  description={formatDate(user.last_login_at)}
                  left={props => <List.Icon {...props} icon="clock-outline" />}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Security */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('profile.security')}
            </Text>
            {user.auth_type === 'local' && (
              <List.Item
                title={t('profile.changePassword')}
                description={t('profile.changePasswordDescription')}
                left={props => <List.Icon {...props} icon="lock" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setIsChangingPassword(true)}
              />
            )}
            {user.auth_type === 'google' && (
              <List.Item
                title={t('profile.googleAccount')}
                description={t('profile.googleAccountDescription')}
                left={props => <List.Icon {...props} icon="google" />}
              />
            )}
          </Card.Content>
        </Card>

        {/* Account Management */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('profile.accountManagement')}
            </Text>
            <List.Item
              title={t('profile.deleteAccount')}
              description={t('profile.deleteAccountWarning')}
              titleStyle={{ color: theme.colors.error }}
              left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              onPress={handleDeleteAccount}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog 
          visible={isChangingPassword} 
          onDismiss={() => setIsChangingPassword(false)}
        >
          <Dialog.Title>{t('profile.changePassword')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('profile.currentPassword')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              secureTextEntry
              style={styles.dialogInput}
            />
            <TextInput
              label={t('auth.password')}
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry
              style={styles.dialogInput}
            />
            <TextInput
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsChangingPassword(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleChangePassword}>
              {t('common.save')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: theme.colors.textSecondary
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: theme.colors.card
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20
  },
  avatar: {
    marginBottom: 16
  },
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.card
  },
  editBadgeText: {
    fontSize: 16
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%'
  },
  name: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4
  },
  email: {
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  username: {
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  phone: {
    color: theme.colors.textSecondary
  },
  input: {
    marginBottom: 12,
    width: '100%'
  },
  editActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8
  },
  dialogInput: {
    marginBottom: 12
  }
});

