import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share, TouchableOpacity } from 'react-native';
import { Text, Button, Appbar, Card, List, Chip, Dialog, Portal, TextInput, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { familyApi } from '../api/family';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function FamilyScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [family, setFamily] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedPreview, setSharedPreview] = useState([]);
  const [isSharedLoading, setIsSharedLoading] = useState(true);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [joinDialogVisible, setJoinDialogVisible] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    try {
      setIsLoading(true);
      const data = await familyApi.getFamily();
      setFamily(data.family);
      if (data.family) {
        loadSharedPreview();
      } else {
        setSharedPreview([]);
      }
    } catch (error) {
      console.error('Load family error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSharedPreview = async () => {
    try {
      setIsSharedLoading(true);
      const data = await familyApi.getSharedProducts();
      setSharedPreview((data.products || []).slice(0, 2));
    } catch (error) {
      console.error('Load shared products error:', error);
      setSharedPreview([]);
    } finally {
      setIsSharedLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert(t('common.error'), t('family.enterFamilyName'));
      return;
    }

    try {
      await familyApi.createFamily(familyName.trim());
      setCreateDialogVisible(false);
      setFamilyName('');
      Alert.alert(t('common.success'), t('family.familyCreated'));
      loadFamily();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.error || t('family.createFailed'));
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), t('family.enterInviteCode'));
      return;
    }

    try {
      await familyApi.joinFamily(inviteCode.trim().toUpperCase());
      setJoinDialogVisible(false);
      setInviteCode('');
      Alert.alert(t('common.success'), t('family.joinedFamily'));
      loadFamily();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.error || t('family.joinFailed'));
    }
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      t('family.leaveFamily'),
      t('family.leaveConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('family.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              await familyApi.leaveFamily();
              Alert.alert(t('common.success'), t('family.leftFamily'));
              loadFamily();
            } catch (error) {
              Alert.alert(t('common.error'), t('family.leaveFailed'));
            }
          }
        }
      ]
    );
  };

  const handleDeleteFamily = () => {
    Alert.alert(
      t('family.deleteFamily'),
      t('family.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await familyApi.deleteFamily();
              Alert.alert(t('common.success'), t('family.familyDeleted'));
              loadFamily();
            } catch (error) {
              Alert.alert(t('common.error'), t('family.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleShareInviteCode = async () => {
    try {
      await Share.share({
        message: `${t('family.joinMyFamily')}\n\n${t('family.familyName')}: ${family.name}\n${t('family.inviteCode')}: ${family.invite_code}\n\n${t('family.shareMessage')}`,
        title: t('family.inviteToFamily')
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleRemoveMember = (memberId, memberName) => {
    Alert.alert(
      t('family.removeMember'),
      t('family.removeMemberConfirm', { name: memberName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await familyApi.removeMember(memberId);
              Alert.alert(t('common.success'), t('family.memberRemoved'));
              loadFamily();
            } catch (error) {
              Alert.alert(t('common.error'), t('family.removeFailed'));
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return '#6200ee';
      case 'admin': return '#ff9800';
      default: return '#4caf50';
    }
  };

  const getSharedProductStatus = (product) => {
    const successColor = theme.colors.success || '#4caf50';
    const warningColor = theme.colors.warning || '#ff9800';
    const errorColor = theme.colors.error || '#f44336';
    const inactiveColor = theme.colors.textSecondary || '#757575';
    const applyAlpha = (color) =>
      typeof color === 'string' && color.startsWith('#') ? `${color}20` : color;

    if (product.is_active === false) {
      return { label: t('product.status.inactive', 'Inactive'), color: inactiveColor, background: applyAlpha(inactiveColor) };
    }

    const today = new Date();
    const endDate = new Date(product.warranty_end_date);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { label: t('product.status.expired', 'Expired'), color: errorColor, background: applyAlpha(errorColor) };
    }

    if (daysRemaining <= 30) {
      return {
        label: t('product.status.daysLeft', { count: daysRemaining }),
        color: warningColor,
        background: applyAlpha(warningColor)
      };
    }

    return {
      label: t('product.status.active', 'Active'),
      color: successColor,
      background: applyAlpha(successColor)
    };
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background
    },
    content: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background
    },
    card: {
      marginBottom: 16,
      elevation: 2,
      backgroundColor: theme.colors.surface
    },
    emptyText: {
      marginBottom: 30,
      textAlign: 'center',
      color: theme.colors.textSecondary
    },
    aboutText: {
      color: theme.colors.textSecondary,
      marginBottom: 16
    },
    bullet: {
      color: theme.colors.success,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8
    },
    inviteCodeBox: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginRight: 8
    },
    inviteCodeLabel: {
      color: theme.colors.textSecondary,
      marginBottom: 4
    },
    sharedDescription: {
      color: theme.colors.textSecondary,
      marginTop: 8
    },
    sharedProductItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border || '#dddddd'
    },
    sharedProductInfo: {
      flex: 1,
      marginRight: 12
    },
    sharedProductTitle: {
      fontWeight: '600',
      marginBottom: 2,
      color: theme.colors.text
    },
    sharedProductSub: {
      color: theme.colors.textSecondary,
      marginBottom: 2
    },
    sharedProductMeta: {
      color: theme.colors.textSecondary,
      fontSize: 12
    },
    sharedStatusChip: {
      height: 32
    }
  });

  if (isLoading) {
    return (
      <View style={dynamicStyles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('family.title')} />
        </Appbar.Header>
        <View style={dynamicStyles.loadingContainer}>
          <Text>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!family) {
    return (
      <View style={dynamicStyles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('family.title')} />
        </Appbar.Header>

        <ScrollView style={dynamicStyles.content}>
          <Card style={dynamicStyles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                {t('family.noFamily')}
              </Text>
              <Text variant="bodyMedium" style={dynamicStyles.emptyText}>
                {t('family.noFamilyDescription')}
              </Text>

              <Button
                mode="contained"
                icon="account-multiple-plus"
                onPress={() => setCreateDialogVisible(true)}
                style={styles.actionButton}
              >
                {t('family.createFamily')}
              </Button>

              <Button
                mode="outlined"
                icon="account-group"
                onPress={() => setJoinDialogVisible(true)}
                style={styles.actionButton}
              >
                {t('family.joinFamily')}
              </Button>
            </Card.Content>
          </Card>

          <Card style={dynamicStyles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('family.aboutFamilySharing')}
              </Text>
              <Text variant="bodyMedium" style={dynamicStyles.aboutText}>
                {t('family.aboutDescription')}
              </Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Text style={dynamicStyles.bullet}>✓</Text>
                  <Text style={styles.featureText}>{t('family.feature1')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={dynamicStyles.bullet}>✓</Text>
                  <Text style={styles.featureText}>{t('family.feature2')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={dynamicStyles.bullet}>✓</Text>
                  <Text style={styles.featureText}>{t('family.feature3')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={dynamicStyles.bullet}>✓</Text>
                  <Text style={styles.featureText}>{t('family.feature4')}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        <Portal>
          <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
            <Dialog.Title>{t('family.createFamily')}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label={t('family.familyName')}
                value={familyName}
                onChangeText={setFamilyName}
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setCreateDialogVisible(false)}>{t('common.cancel')}</Button>
              <Button onPress={handleCreateFamily}>{t('common.create')}</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={joinDialogVisible} onDismiss={() => setJoinDialogVisible(false)}>
            <Dialog.Title>{t('family.joinFamily')}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label={t('family.inviteCode')}
                value={inviteCode}
                onChangeText={setInviteCode}
                mode="outlined"
                autoCapitalize="characters"
                placeholder="ABC123"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setJoinDialogVisible(false)}>{t('common.cancel')}</Button>
              <Button onPress={handleJoinFamily}>{t('family.join')}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={family.name} />
        <Appbar.Action 
          icon="share-variant" 
          onPress={handleShareInviteCode}
        />
      </Appbar.Header>

      <ScrollView style={dynamicStyles.content}>
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={styles.familyHeader}>
              <View>
                <Text variant="headlineSmall">{family.name}</Text>
                <Chip
                  mode="flat"
                  style={[styles.roleChip, { backgroundColor: getRoleBadgeColor(family.role) + '20' }]}
                  textStyle={{ color: getRoleBadgeColor(family.role) }}
                >
                  {t(`family.role.${family.role}`)}
                </Chip>
              </View>
            </View>

            <View style={styles.inviteCodeContainer}>
              <View style={dynamicStyles.inviteCodeBox}>
                <Text variant="bodySmall" style={dynamicStyles.inviteCodeLabel}>
                  {t('family.inviteCode')}
                </Text>
                <Text variant="headlineMedium" style={styles.inviteCodeText}>
                  {family.invite_code}
                </Text>
              </View>
              <IconButton
                icon="share-variant"
                mode="contained"
                onPress={handleShareInviteCode}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {t('family.members')} ({family.members.length})
            </Text>

            {family.members.map((member) => (
              <List.Item
                key={member.member_id}
                title={member.full_name}
                description={member.email}
                left={props => <List.Icon {...props} icon="account" />}
                right={props => (
                  <View style={styles.memberRight}>
                    <Chip
                      mode="flat"
                      style={[styles.roleChip, { backgroundColor: getRoleBadgeColor(member.role) + '20' }]}
                      textStyle={{ color: getRoleBadgeColor(member.role), fontSize: 11 }}
                    >
                      {t(`family.role.${member.role}`)}
                    </Chip>
                    {(family.role === 'owner' || family.role === 'admin') && 
                     member.role !== 'owner' && 
                     member.user_id !== user.id && (
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleRemoveMember(member.member_id, member.full_name)}
                      />
                    )}
                  </View>
                )}
              />
            ))}
          </Card.Content>
        </Card>

        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={styles.cardHeaderRow}>
              <Text variant="titleLarge">{t('family.sharedProducts')}</Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('SharedProducts')}
              >
                {t('family.viewAll')}
              </Button>
            </View>
            {isSharedLoading ? (
              <Text variant="bodyMedium" style={dynamicStyles.sharedDescription}>
                {t('common.loading')}
              </Text>
            ) : sharedPreview.length === 0 ? (
              <Text variant="bodyMedium" style={dynamicStyles.sharedDescription}>
                {t('family.sharedProductsDescription')}
              </Text>
            ) : (
              sharedPreview.map((product) => {
                const status = getSharedProductStatus(product);
                const purchaseDate = new Date(product.purchase_date).toLocaleDateString();
                return (
                  <TouchableOpacity
                    key={product.product_id}
                    style={dynamicStyles.sharedProductItem}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.product_id })}
                    activeOpacity={0.85}
                  >
                    <View style={dynamicStyles.sharedProductInfo}>
                      <Text style={dynamicStyles.sharedProductTitle}>{product.product_name}</Text>
                      {product.brand && (
                        <Text style={dynamicStyles.sharedProductSub}>{product.brand}</Text>
                      )}
                      <Text style={dynamicStyles.sharedProductMeta}>
                        {t('family.sharedBy')}: {product.shared_by}
                      </Text>
                      <Text style={dynamicStyles.sharedProductMeta}>
                        {t('product.purchaseDate')}: {purchaseDate}
                      </Text>
                    </View>
                    <Chip
                      mode="flat"
                      style={[dynamicStyles.sharedStatusChip, { backgroundColor: status.background }]}
                      textStyle={{ color: status.color, fontSize: 11 }}
                    >
                      {status.label}
                    </Chip>
                  </TouchableOpacity>
                );
              })
            )}
          </Card.Content>
        </Card>

        <Card style={dynamicStyles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('family.actions')}
            </Text>

            {family.role !== 'owner' && (
              <Button
                mode="outlined"
                icon="exit-to-app"
                onPress={handleLeaveFamily}
                style={styles.actionButton}
              >
                {t('family.leaveFamily')}
              </Button>
            )}

            {family.role === 'owner' && (
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDeleteFamily}
                style={styles.actionButton}
                textColor="#f44336"
              >
                {t('family.deleteFamily')}
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold'
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center'
  },
  actionButton: {
    marginBottom: 12
  },
  featureList: {
    marginTop: 8
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  featureText: {
    flex: 1,
    fontSize: 14
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginTop: 8
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16
  },
  inviteCodeText: {
    fontWeight: 'bold',
    letterSpacing: 2
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  }
});

