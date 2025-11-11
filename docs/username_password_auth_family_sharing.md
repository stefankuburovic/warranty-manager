### 3.5 Update Main App

```javascript
// src/app.js
const familyRoutes = require('./routes/family');

// Add after other routes
app.use('/api/v1/family', familyRoutes);
```

---

## Part 4: Mobile App - Family Sharing UI

### 4.1 Family API

```javascript
// src/api/family.js
import apiClient from './client';

export const familyApi = {
  // Create family
  async createFamily(name) {
    const response = await apiClient.post('/family/create', { name });
    return response.data;
  },

  // Get family info
  async getFamily() {
    const response = await apiClient.get('/family');
    return response.data;
  },

  // Join family
  async joinFamily(inviteCode) {
    const response = await apiClient.post('/family/join', { invite_code: inviteCode });
    return response.data;
  },

  // Leave family
  async leaveFamily() {
    const response = await apiClient.post('/family/leave');
    return response.data;
  },

  // Delete family
  async deleteFamily() {
    const response = await apiClient.delete('/family');
    return response.data;
  },

  // Share product
  async shareProduct(productId) {
    const response = await apiClient.post(`/family/products/${productId}/share`);
    return response.data;
  },

  // Unshare product
  async unshareProduct(productId) {
    const response = await apiClient.delete(`/family/products/${productId}/unshare`);
    return response.data;
  },

  // Get shared products
  async getSharedProducts() {
    const response = await apiClient.get('/family/shared-products');
    return response.data;
  },

  // Remove member
  async removeMember(memberId) {
    const response = await apiClient.delete(`/family/members/${memberId}`);
    return response.data;
  }
};
```

### 4.2 Family Management Screen

```javascript
// src/screens/FamilyScreen.js
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

        {/* Dialogs */}
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

  // Has family
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
        {/* Family Info Card */}
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

        {/* Members Card */}
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

        {/* Shared Products Card */}
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

        {/* Actions */}
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
```

### 4.3 Shared Products Screen

```javascript
// src/screens/SharedProductsScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Appbar, Card, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { familyApi } from '../api/family';

export default function SharedProductsScreen({ navigation }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await familyApi.getSharedProducts();
      setProducts(data.products);
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const getWarrantyStatus = (warrantyEndDate) => {
    const today = new Date();
    const endDate = new Date(warrantyEndDate);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { label: t('product.expired'), color: '#f44336' };
    } else if (daysRemaining <= 30) {
      return { label: t('product.daysLeft', { count: daysRemaining }), color: '#ff9800' };
    } else {
      return { label: t('product.active'), color: '#4caf50' };
    }
  };

  const renderProduct = ({ item }) => {
    const warrantyStatus = getWarrantyStatus(item.warranty_end_date);
    const purchaseDate = new Date(item.purchase_date).toLocaleDateString('sr-RS');
    const sharedDate = new Date(item.shared_at).toLocaleDateString('sr-RS');

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Text variant="titleMedium" style={styles.productName}>
                  {item.product_name}
                </Text>
                {item.brand && (
                  <Text variant="bodySmall" style={styles.brand}>
                    {item.brand}
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.sharedBy}>
                  {t('family.sharedBy')}: {item.shared_by}
                </Text>
              </View>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: warrantyStatus.color + '20' }]}
                textStyle={{ color: warrantyStatus.color, fontSize: 12 }}
              >
                {warrantyStatus.label}
              </Chip>
            </View>

            <View style={styles.cardDetails}>
              {item.Store && (
                <Text variant="bodySmall" style={styles.detailText}>
                  🏪 {item.Store.store_name}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.detailText}>
                📅 {t('product.purchaseDate')}: {purchaseDate}
              </Text>
              {item.purchase_price && (
                <Text variant="bodySmall" style={styles.detailText}>
                  💰 {item.purchase_price} {item.currency}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.detailText}>
                📤 {t('family.sharedOn')}: {sharedDate}
              </Text>
            </View>

            {item.Category && (
              <Chip
                mode="outlined"
                style={styles.categoryChip}
                textStyle={{ fontSize: 11 }}
              >
                {item.Category.category_name}
              </Chip>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('family.sharedProducts')} />
      </Appbar.Header>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {t('family.noSharedProducts')}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {t('family.noSharedProductsDescription')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.product_id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginBottom: 10,
    textAlign: 'center'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666'
  },
  list: {
    padding: 16
  },
  card: {
    marginBottom: 12,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 4
  },
  brand: {
    color: '#666',
    marginBottom: 4
  },
  sharedBy: {
    color: '#6200ee',
    fontStyle: 'italic'
  },
  statusChip: {
    height: 28
  },
  cardDetails: {
    marginBottom: 8
  },
  detailText: {
    color: '#666',
    marginBottom: 4
  },
  categoryChip: {
    alignSelf: 'flex-start',
    height: 24
  }
});
```

### 4.4 Update Product Detail Screen - Add Share Button

```javascript
// Add to ProductDetailScreen.js
const [isShared, setIsShared] = useState(false);

// Check if product is shared
useEffect(() => {
  if (product) {
    // Check if this product belongs to current user
    const isOwner = product.user_id === user.id;
    setIsShared(product.is_shared); // You'll need to add this field from backend
  }
}, [product]);

const handleShareWithFamily = async () => {
  try {
    if (isShared) {
      await familyApi.unshareProduct(productId);
      Alert.alert(t('common.success'), t('family.productUnshared'));
      setIsShared(false);
    } else {
      await familyApi.shareProduct(productId);
      Alert.alert(t('common.success'), t('family.productShared'));
      setIsShared(true);
    }
  } catch (error) {
    Alert.alert(t('common.error'), error.response?.data?.error || t('family.shareFailed'));
  }
};

// Add button in header or content
<Appbar.Action 
  icon={isShared ? "account-multiple-check" : "account-multiple-plus"} 
  onPress={handleShareWithFamily}
/>
```

### 4.5 Update Navigation

```javascript
// src/navigation/AppNavigator.js
import FamilyScreen from '../screens/FamilyScreen';
import SharedProductsScreen from '../screens/SharedProductsScreen';

// Add inside authenticated stack:
<Stack.Screen 
  name="Family" 
  component={FamilyScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="SharedProducts" 
  component={SharedProductsScreen}
  options={{ headerShown: false }}
/>
```

### 4.6 Update Home Screen - Add Family Button

```javascript
<Appbar.Header>
  <Appbar.Content title={t('home.title')} />
  <Appbar.Action 
    icon="account-group" 
    onPress={() => navigation.navigate('Family')}
  />
  <Appbar.Action 
    icon="file-export" 
    onPress={() => navigation.navigate('Export')}
  />
  {/* ... other actions */}
</Appbar.Header>
```

### 4.7 Add Translation Keys

Add to all language files (en.json, sr-Latn.json, sr-Cyrl.json):

**English:**
```json
"family": {
  "title": "Family",
  "noFamily": "No Family Yet",
  "noFamilyDescription": "Create or join a family to share warranties with your household",
  "createFamily": "Create Family",
  "joinFamily": "Join Family",
  "familyName": "Family Name",
  "inviteCode": "Invite Code",
  "enterFamilyName": "Please enter a family name",
  "enterInviteCode": "Please enter an invite code",
  "familyCreated": "Family created successfully!",
  "joinedFamily": "Successfully joined family!",
  "leftFamily": "You have left the family",
  "familyDeleted": "Family deleted successfully",
  "createFailed": "Failed to create family",
  "joinFailed": "Failed to join family. Check your invite code.",
  "leaveFailed": "Failed to leave family",
  "deleteFailed": "Failed to delete family",
  "leaveFamily": "Leave Family",
  "deleteFamily": "Delete Family",
  "leaveConfirm": "Are you sure you want to leave this family? Your shared products will be unshared.",
  "deleteConfirm": "Are you sure you want to delete this family? All members will be removed.",
  "members": "Members",
  "sharedProducts": "Shared Products",
  "sharedProductsDescription": "Products shared with your family will appear here",
  "viewAll": "View All",
  "actions": "Actions",
  "role": {
    "owner": "Owner",
    "admin": "Admin",
    "member": "Member"
  },
  "inviteToFamily": "Invite to Family",
  "joinMyFamily": "Join my family on Warranty Manager!",
  "shareMessage": "Use this code in the app to join our family and share warranties.",
  "aboutFamilySharing": "About Family Sharing",
  "aboutDescription": "Share warranty information with your family members. Everyone can view shared products and their warranties.",
  "feature1": "Share warranties with up to 10 family members",
  "feature2": "Everyone can view shared products",
  "feature3": "Only product owner can edit or delete",
  "feature4": "Easy invite system with codes",
  "sharedBy": "Shared by",
  "sharedOn": "Shared on",
  "noSharedProducts": "No Shared Products",
  "noSharedProductsDescription": "Family members haven't shared any products yet        <Button
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 20
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  description: {
    marginBottom: 30,
    textAlign: 'center',
    color: '#666'
  },
  input: {
    marginBottom: 20
  },
  submitButton: {
    paddingVertical: 8
  }
});
```

### 2.5 Update Auth Context

```javascript
// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '../api/auth';
import { storage } from '../utils/storage';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const checkAuth = async () => {
    try {
      const token = await storage.getAccessToken();
      const savedUser = await storage.getUser();

      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async (idToken) => {
    try {
      setIsLoading(true);
      const data = await authApi.loginWithGoogle(idToken);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = () => {
    promptAsync();
  };

  // Username/Password Sign In
  const signInWithCredentials = async (username, password) => {
    try {
      setIsLoading(true);
      const data = await authApi.login(username, password);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const data = await authApi.register(userData);
      
      await storage.setTokens(data.access_token, data.refresh_token);
      await storage.setUser(data.user);
      
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await storage.clearTokens();
    await storage.clearUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn,
        signInWithCredentials,
        register,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2.6 Update Navigation

```javascript
// src/navigation/AppNavigator.js
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// Add to unauthenticated stack:
<Stack.Screen name="Login" component={LoginScreen} />
<Stack.Screen 
  name="Register" 
  component={RegisterScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="ForgotPassword" 
  component={ForgotPasswordScreen}
  options={{ headerShown: false }}
/>
```

### 2.7 Add Translation Keys

Add to all language files:

**English (en.json):**
```json
"auth": {
  "signIn": "Sign In",
  "signInWithGoogle": "Sign in with Google",
  "signInToContinue": "Sign in to continue",
  "register": "Register",
  "createAccount": "Create Account",
  "username": "Username",
  "usernameOrEmail": "Username or Email",
  "email": "Email",
  "fullName": "Full Name",
  "password": "Password",
  "confirmPassword": "Confirm Password",
  "forgotPassword": "Forgot Password?",
  "resetPassword": "Reset Password",
  "sendResetLink": "Send Reset Link",
  "or": "OR",
  "dontHaveAccount": "Don't have an account?",
  "alreadyHaveAccount": "Already have an account?",
  "fillAllFields": "Please fill in all fields",
  "usernameMinLength": "Username must be at least 3 characters",
  "passwordMinLength": "Password must be at least 8 characters",
  "passwordsDoNotMatch": "Passwords do not match",
  "passwordRequirements": "Password must be at least 8 characters long",
  "enterEmail": "Please enter your email",
  "resetLinkSent": "If the email exists, a reset link has been sent",
  "resetFailed": "Failed to send reset link",
  "resetPasswordDescription": "Enter your email address and we'll send you a link to reset your password",
  "registrationSuccess": "Registration successful! You can now use the app.",
  "registrationFailed": "Registration failed. Please try again.",
  "loginFailed": "Invalid credentials. Please try again."
}
```

**Serbian Latin (sr-Latn.json):**
```json
"auth": {
  "signIn": "Prijavi se",
  "signInWithGoogle": "Prijavi se preko Google-a",
  "signInToContinue": "Prijavite se da nastavite",
  "register": "Registruj se",
  "createAccount": "Napravi nalog",
  "username": "Korisničko ime",
  "usernameOrEmail": "Korisničko ime ili email",
  "email": "Email",
  "fullName": "Puno ime",
  "password": "Lozinka",
  "confirmPassword": "Potvrdi lozinku",
  "forgotPassword": "Zaboravili ste lozinku?",
  "resetPassword": "Resetuj lozinku",
  "sendResetLink": "Pošalji link za reset",
  "or": "ILI",
  "dontHaveAccount": "Nemate nalog?",
  "alreadyHaveAccount": "Već imate nalog?",
  "fillAllFields": "Molimo popunite sva polja",
  "usernameMinLength": "Korisničko ime mora imati najmanje 3 karaktera",
  "passwordMinLength": "Lozinka mora imati najmanje 8 karaktera",
  "passwordsDoNotMatch": "Lozinke se ne poklapaju",
  "passwordRequirements": "Lozinka mora imati najmanje 8 karaktera",
  "enterEmail": "Molimo unesite vaš email",
  "resetLinkSent": "Ako email postoji, link za reset je poslat",
  "resetFailed": "Slanje linka za reset nije uspelo",
  "resetPasswordDescription": "Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke",
  "registrationSuccess": "Registracija uspešna! Sada možete koristiti aplikaciju.",
  "registrationFailed": "Registracija nije uspela. Pokušajte ponovo.",
  "loginFailed": "Nevalidni podaci. Pokušajte ponovo."
}
```

**Serbian Cyrillic (sr-Cyrl.json):**
```json
"auth": {
  "signIn": "Пријави се",
  "signInWithGoogle": "Пријави се преко Google-а",
  "signInToContinue": "Пријавите се да наставите",
  "register": "Региструј се",
  "createAccount": "Направи налог",
  "username": "Корисничко име",
  "usernameOrEmail": "Корисничко име или email",
  "email": "Email",
  "fullName": "Пуно име",
  "password": "Лозинка",
  "confirmPassword": "Потврди лозинку",
  "forgotPassword": "Заборавили сте лозинку?",
  "resetPassword": "Ресетуј лозинку",
  "sendResetLink": "Пошаљи линк за ресет",
  "or": "ИЛИ",
  "dontHaveAccount": "Немате налог?",
  "alreadyHaveAccount": "Већ имате налог?",
  "fillAllFields": "Молимо попуните сва поља",
  "usernameMinLength": "Корисничко име мора имати најмање 3 карактера",
  "passwordMinLength": "Лозинка мора имати најмање 8 карактера",
  "passwordsDoNotMatch": "Лозинке се не поклапају",
  "passwordRequirements": "Лозинка мора имати најмање 8 карактера",
  "enterEmail": "Молимо унесите ваш email",
  "resetLinkSent": "Ако email постоји, линк за ресет је послат",
  "resetFailed": "Слање линка за ресет није успело",
  "resetPasswordDescription": "Унесите вашу email адресу и послаћемо вам линк за ресетовање лозинке",
  "registrationSuccess": "Регистрација успешна! Сада можете користити апликацију.",
  "registrationFailed": "Регистрација није успела. Покушајте поново.",
  "loginFailed": "Неисправни подаци. Покушајте поново."
}
```

---

## Part 3: Family Sharing Feature

### 3.1 Database Models

```javascript
// src/models/Family.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Family = sequelize.define('Family', {
  family_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  
  invite_code: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false
  },
  
  max_members: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
}, {
  tableName: 'families',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Family;
```

```javascript
// src/models/FamilyMember.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FamilyMember = sequelize.define('FamilyMember', {
  member_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  family_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'families',
      key: 'family_id'
    }
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'family_members',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = FamilyMember;
```

```javascript
// src/models/SharedProduct.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SharedProduct = sequelize.define('SharedProduct', {
  share_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  
  family_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'families',
      key: 'family_id'
    }
  },
  
  shared_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  
  shared_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'shared_products',
  timestamps: false
});

module.exports = SharedProduct;
```

### 3.2 Update Model Associations

```javascript
// src/models/index.js
const Family = require('./Family');
const FamilyMember = require('./FamilyMember');
const SharedProduct = require('./SharedProduct');

// Existing associations...

// Family associations
User.hasOne(Family, { foreignKey: 'owner_id', as: 'OwnedFamily' });
Family.belongsTo(User, { foreignKey: 'owner_id', as: 'Owner' });

User.belongsToMany(Family, { through: FamilyMember, foreignKey: 'user_id' });
Family.belongsToMany(User, { through: FamilyMember, foreignKey: 'family_id' });

FamilyMember.belongsTo(User, { foreignKey: 'user_id' });
FamilyMember.belongsTo(Family, { foreignKey: 'family_id' });

// Shared products
Product.belongsToMany(Family, { through: SharedProduct, foreignKey: 'product_id' });
Family.belongsToMany(Product, { through: SharedProduct, foreignKey: 'family_id' });

SharedProduct.belongsTo(Product, { foreignKey: 'product_id' });
SharedProduct.belongsTo(Family, { foreignKey: 'family_id' });
SharedProduct.belongsTo(User, { foreignKey: 'shared_by', as: 'Sharer' });

module.exports = {
  // ... existing exports
  Family,
  FamilyMember,
  SharedProduct
};
```

### 3.3 Family Controller

```javascript
// src/controllers/familyController.js
const { Family, FamilyMember, User, SharedProduct, Product, Store, Category, Document } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Generate unique invite code
const generateInviteCode = () => {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
};

// Create family
exports.createFamily = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Family name is required' });
    }

    // Check if user already owns a family
    const existingFamily = await Family.findOne({
      where: { owner_id: req.user.user_id }
    });

    if (existingFamily) {
      return res.status(400).json({ error: 'You already own a family' });
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await Family.findOne({ where: { invite_code: inviteCode } });
      if (!existing) isUnique = true;
    }

    // Create family
    const family = await Family.create({
      name,
      owner_id: req.user.user_id,
      invite_code: inviteCode
    });

    // Add owner as member
    await FamilyMember.create({
      family_id: family.family_id,
      user_id: req.user.user_id,
      role: 'owner'
    });

    res.status(201).json({
      message: 'Family created successfully',
      family: {
        family_id: family.family_id,
        name: family.name,
        invite_code: family.invite_code,
        owner_id: family.owner_id
      }
    });
  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ error: 'Failed to create family' });
  }
};

// Get user's family
exports.getFamily = async (req, res) => {
  try {
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: Family,
          include: [
            { model: User, as: 'Owner', attributes: ['user_id', 'full_name', 'email'] }
          ]
        }
      ]
    });

    if (!familyMember) {
      return res.json({ family: null });
    }

    // Get all members
    const members = await FamilyMember.findAll({
      where: { family_id: familyMember.Family.family_id },
      include: [
        { model: User, attributes: ['user_id', 'full_name', 'email', 'profile_picture_url'] }
      ],
      order: [['joined_at', 'ASC']]
    });

    res.json({
      family: {
        ...familyMember.Family.toJSON(),
        role: familyMember.role,
        members: members.map(m => ({
          member_id: m.member_id,
          user_id: m.User.user_id,
          full_name: m.User.full_name,
          email: m.User.email,
          profile_picture_url: m.User.profile_picture_url,
          role: m.role,
          joined_at: m.joined_at
        }))
      }
    });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({ error: 'Failed to get family' });
  }
};

// Join family with invite code
exports.joinFamily = async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Find family
    const family = await Family.findOne({
      where: { invite_code: invite_code.toUpperCase() }
    });

    if (!family) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if already a member
    const existingMember = await FamilyMember.findOne({
      where: {
        user_id: req.user.user_id,
        family_id: family.family_id
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this family' });
    }

    // Check if user is in another family
    const otherFamilyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (otherFamilyMember) {
      return res.status(400).json({ error: 'You are already in another family. Please leave it first.' });
    }

    // Check member limit
    const memberCount = await FamilyMember.count({
      where: { family_id: family.family_id }
    });

    if (memberCount >= family.max_members) {
      return res.status(400).json({ error: 'Family has reached maximum member limit' });
    }

    // Add member
    await FamilyMember.create({
      family_id: family.family_id,
      user_id: req.user.user_id,
      role: 'member'
    });

    res.json({
      message: 'Successfully joined family',
      family: {
        family_id: family.family_id,
        name: family.name
      }
    });
  } catch (error) {
    console.error('Join family error:', error);
    res.status(500).json({ error: 'Failed to join family' });
  }
};

// Leave family
exports.leaveFamily = async (req, res) => {
  try {
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember) {
      return res.status(404).json({ error: 'You are not in any family' });
    }

    if (familyMember.role === 'owner') {
      return res.status(400).json({ error: 'Owner cannot leave family. Delete the family instead.' });
    }

    // Remove all shared products by this user
    await SharedProduct.destroy({
      where: {
        family_id: familyMember.family_id,
        shared_by: req.user.user_id
      }
    });

    // Remove member
    await familyMember.destroy();

    res.json({ message: 'Successfully left family' });
  } catch (error) {
    console.error('Leave family error:', error);
    res.status(500).json({ error: 'Failed to leave family' });
  }
};

// Delete family (owner only)
exports.deleteFamily = async (req, res) => {
  try {
    const family = await Family.findOne({
      where: { owner_id: req.user.user_id }
    });

    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Delete all shared products
    await SharedProduct.destroy({
      where: { family_id: family.family_id }
    });

    // Delete all members
    await FamilyMember.destroy({
      where: { family_id: family.family_id }
    });

    // Delete family
    await family.destroy();

    res.json({ message: 'Family deleted successfully' });
  } catch (error) {
    console.error('Delete family error:', error);
    res.status(500).json({ error: 'Failed to delete family' });
  }
};

// Share product with family
exports.shareProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the product
    const product = await Product.findOne({
      where: {
        product_id: id,
        user_id: req.user.user_id
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user is in a family
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember) {
      return res.status(400).json({ error: 'You are not in any family' });
    }

    // Check if already shared
    const existingShare = await SharedProduct.findOne({
      where: {
        product_id: id,
        family_id: familyMember.family_id
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Product is already shared with family' });
    }

    // Share product
    await SharedProduct.create({
      product_id: id,
      family_id: familyMember.family_id,
      shared_by: req.user.user_id
    });

    res.json({ message: 'Product shared successfully' });
  } catch (error) {
    console.error('Share product error:', error);
    res.status(500).json({ error: 'Failed to share product' });
  }
};

// Unshare product
exports.unshareProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const sharedProduct = await SharedProduct.findOne({
      where: {
        product_id: id,
        shared_by: req.user.user_id
      }
    });

    if (!sharedProduct) {
      return res.status(404).json({ error: 'Shared product not found' });
    }

    await sharedProduct.destroy();

    res.json({ message: 'Product unshared successfully' });
  } catch (error) {
    console.error('Unshare product error:', error);
    res.status(500).json({ error: 'Failed to unshare product' });
  }
};

// Get shared products
exports.getSharedProducts = async (req, res) => {
  try {
    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember) {
      return res.json({ products: [] });
    }

    const sharedProducts = await SharedProduct.findAll({
      where: { family_id: familyMember.family_id },
      include: [
        {
          model: Product,
          include: [
            { model: Store },
            { model: Category },
            { 
              model: Document,
              where: { is_primary: true },
              required: false
            },
            { model: User, attributes: ['user_id', 'full_name'] }
          ]
        },
        { model: User, as: 'Sharer', attributes: ['user_id', 'full_name'] }
      ],
      order: [['shared_at', 'DESC']]
    });

    res.json({
      products: sharedProducts.map(sp => ({
        ...sp.Product.toJSON(),
        shared_by: sp.Sharer.full_name,
        shared_at: sp.shared_at
      }))
    });
  } catch (error) {
    console.error('Get shared products error:', error);
    res.status(500).json({ error: 'Failed to get shared products' });
  }
};

// Remove member (owner/admin only)
exports.removeMember = async (req, res) => {
  try {
    const { member_id } = req.params;

    const familyMember = await FamilyMember.findOne({
      where: { user_id: req.user.user_id }
    });

    if (!familyMember || (familyMember.role !== 'owner' && familyMember.role !== 'admin')) {
      return res.status(403).json({ error: 'Only owner or admin can remove members' });
    }

    const memberToRemove = await FamilyMember.findOne({
      where: {
        member_id,
        family_id: familyMember.family_id
      }
    });

    if (!memberToRemove) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (memberToRemove.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove family owner' });
    }

    // Remove shared products by this member
    await SharedProduct.destroy({
      where: {
        family_id: familyMember.family_id,
        shared_by: memberToRemove.user_id
      }
    });

    await memberToRemove.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
```

### 3.4 Family Routes

```javascript
// src/routes/family.js
const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Family management
router.post('/create', familyController.createFamily);
router.get('/', familyController.getFamily);
router.post('/join', familyController.joinFamily);
router.post('/leave', familyController.leaveFamily);
router.delete('/', familyController.deleteFamily);

// Member management
router.delete('/members/:member_id', familyController.removeMember);

// Product sharing
router.post('/products/:id/share', familyController.shareProduct);
router.delete('/products/:id/unshare', familyController.unshareProduct);
router.get('/shared-products', familyController.getSharedProducts);

module.exports = router;
```

### 3.5 Update Main App

```javascript
// src/app.js# Username/Password Auth + Family Sharing - v1.4.0

## Part 1: Username/Password Authentication

### 1.1 Backend - Update User Model

Update User model to support both auth methods:

```javascript
// src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Google OAuth fields (optional now)
  google_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  
  // Username/Password fields (new)
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Common fields
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  profile_picture_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Authentication type
  auth_type: {
    type: DataTypes.ENUM('google', 'local'),
    defaultValue: 'local',
    allowNull: false
  },
  
  // Email verification
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  verification_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Password reset
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Existing fields...
  fcm_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  notification_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  preferred_language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
    allowNull: true
  },
  
  last_login_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && user.auth_type === 'local') {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash') && user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    }
  }
});

// Instance method to verify password
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
```

### 1.2 Update Auth Controller

```javascript
// src/controllers/authController.js
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password,
      full_name,
      auth_type: 'local',
      verification_token: verificationToken,
      email_verified: false // Set to true if you don't want email verification
    });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.status(201).json({
      message: 'Registration successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login with username/password
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email: username }
        ],
        auth_type: 'local'
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ last_login_at: new Date() });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Google OAuth login (existing, keep as is)
exports.googleAuth = async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const fullName = payload['name'];
    const profilePicture = payload['picture'];

    let user = await User.findOne({ where: { google_id: googleId } });

    if (!user) {
      user = await User.create({
        google_id: googleId,
        email: email,
        full_name: fullName,
        profile_picture_url: profilePicture,
        auth_type: 'google',
        email_verified: true,
        last_login_at: new Date()
      });
    } else {
      await user.update({ last_login_at: new Date() });
    }

    const { accessToken, refreshToken } = generateTokens(user.user_id);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ 
      where: { 
        email,
        auth_type: 'local'
      } 
    });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    // TODO: Send reset email
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Update password
    await user.update({
      password_hash: new_password,
      reset_token: null,
      reset_token_expiry: null
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Change password (for logged-in users)
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (req.user.auth_type !== 'local') {
      return res.status(400).json({ error: 'Cannot change password for Google accounts' });
    }

    const isValid = await req.user.verifyPassword(current_password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await req.user.update({ password_hash: new_password });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Existing methods...
exports.refreshToken = async (req, res) => {
  // Keep existing implementation
};

exports.getProfile = async (req, res) => {
  // Keep existing implementation
};
```

### 1.3 Update Auth Routes

```javascript
// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Registration and login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth
router.post('/google', authController.googleAuth);

// Token refresh
router.post('/refresh', authController.refreshToken);

// Password management
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authenticateToken, authController.changePassword);

// Profile
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
```

---

## Part 2: Mobile App - Login/Registration Screens

### 2.1 Update Auth API

```javascript
// src/api/auth.js
import apiClient from './client';

export const authApi = {
  // Register new user
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Login with username/password
  async login(username, password) {
    const response = await apiClient.post('/auth/login', {
      username,
      password
    });
    return response.data;
  },

  // Google OAuth (existing)
  async loginWithGoogle(idToken) {
    const response = await apiClient.post('/auth/google', {
      id_token: idToken
    });
    return response.data;
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  // Get profile (existing)
  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
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

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
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
            <Text>{t('auth.dontHaveAccount')} </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
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
    textAlign: 'center'
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
    color: '#666'
  },
  form: {
    width: '100%'
  },
  input: {
    marginBottom: 16
  },
  errorText: {
    color: '#f44336',
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
    backgroundColor: '#e0e0e0'
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666'
  },
  googleButton: {
    marginBottom: 20
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
```

### 2.3 Registration Screen

```javascript
// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
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
      Alert.alert(
        t('common.success'),
        t('auth.registrationSuccess'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setError(err.message || t('auth.registrationFailed'));
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('auth.register')} />
      </Appbar.Header>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
          />

          <TextInput
            label={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account-circle" />}
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
            <Text>{t('auth.alreadyHaveAccount')} </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1
  },
  scrollContent: {
    padding: 20
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    marginBottom: 16
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center'
  },
  hint: {
    color: '#666',
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
  }
});
```

### 2.4 Forgot Password Screen

```javascript
// src/screens/ForgotPasswordScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, Appbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
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

  return (
    <View style={styles.container}>
      <Appbar.Header>
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
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        >
          {t('auth.sendResetLink')}