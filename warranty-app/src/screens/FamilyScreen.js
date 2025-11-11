import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { Text, Button, Appbar, Card, List, Chip, Dialog, Portal, TextInput, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { familyApi } from '../api/family';
import { useAuth } from '../context/AuthContext';

export default function FamilyScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch (error) {
      console.error('Load family error:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('family.title')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!family) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('family.title')} />
        </Appbar.Header>

        <ScrollView style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                {t('family.noFamily')}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
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

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t('family.aboutFamilySharing')}
              </Text>
              <Text variant="bodyMedium" style={styles.aboutText}>
                {t('family.aboutDescription')}
              </Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.featureText}>{t('family.feature1')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.featureText}>{t('family.feature2')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.featureText}>{t('family.feature3')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.bullet}>✓</Text>
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
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={family.name} />
        <Appbar.Action 
          icon="share-variant" 
          onPress={handleShareInviteCode}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
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
              <View style={styles.inviteCodeBox}>
                <Text variant="bodySmall" style={styles.inviteCodeLabel}>
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

        <Card style={styles.card}>
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

        <Card style={styles.card}>
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
            <Text variant="bodyMedium" style={styles.sharedDescription}>
              {t('family.sharedProductsDescription')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    padding: 16
  },
  card: {
    marginBottom: 16,
    elevation: 2
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold'
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center'
  },
  emptyText: {
    marginBottom: 30,
    textAlign: 'center',
    color: '#666'
  },
  actionButton: {
    marginBottom: 12
  },
  aboutText: {
    color: '#666',
    marginBottom: 16
  },
  featureList: {
    marginTop: 8
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  bullet: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8
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
  inviteCodeBox: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8
  },
  inviteCodeLabel: {
    color: '#666',
    marginBottom: 4
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
  },
  sharedDescription: {
    color: '#666',
    marginTop: 8
  }
});

