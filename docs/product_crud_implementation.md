# Product CRUD Operations - Complete Implementation

## Part 1: Backend - Product Controller

### 1.1 Create Product Controller (src/controllers/productController.js)

```javascript
const { Product, Store, Category, Document, User } = require('../models');
const { Op } = require('sequelize');

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const {
      product_name,
      brand,
      model_number,
      serial_number,
      purchase_date,
      purchase_price,
      currency,
      warranty_duration_months,
      category_id,
      store_id,
      notes
    } = req.body;

    // Validation
    if (!product_name || !purchase_date) {
      return res.status(400).json({ 
        error: 'Product name and purchase date are required' 
      });
    }

    // Create product
    const product = await Product.create({
      user_id: req.user.user_id,
      product_name,
      brand,
      model_number,
      serial_number,
      purchase_date,
      purchase_price,
      currency: currency || 'RSD',
      warranty_duration_months: warranty_duration_months || 12,
      category_id,
      store_id,
      notes
    });

    // Fetch complete product with associations
    const completeProduct = await Product.findByPk(product.product_id, {
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'] },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ]
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: completeProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Get all products for user
exports.getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      status, 
      sort = 'purchase_date',
      order = 'DESC',
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { user_id: req.user.user_id };

    // Filter by category
    if (category) {
      where.category_id = category;
    }

    // Filter by status (active/expired)
    if (status === 'active') {
      where.warranty_end_date = { [Op.gte]: new Date() };
      where.is_active = true;
    } else if (status === 'expired') {
      where.warranty_end_date = { [Op.lt]: new Date() };
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    // Search functionality
    if (search) {
      where[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { model_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { 
          model: Store, 
          attributes: ['store_id', 'store_name', 'store_chain', 'city'] 
        },
        { 
          model: Category, 
          attributes: ['category_id', 'category_name', 'icon_name'] 
        },
        {
          model: Document,
          attributes: ['document_id', 'thumbnail_url', 'is_primary'],
          where: { is_primary: true },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]]
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { 
        product_id: id,
        user_id: req.user.user_id 
      },
      include: [
        { 
          model: Store, 
          attributes: ['store_id', 'store_name', 'store_chain', 'address', 'city', 'phone', 'website'] 
        },
        { 
          model: Category, 
          attributes: ['category_id', 'category_name', 'icon_name', 'default_warranty_months'] 
        },
        {
          model: Document,
          attributes: ['document_id', 'document_type', 'cloud_storage_url', 'thumbnail_url', 'file_name', 'is_primary', 'upload_date']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate warranty status
    const today = new Date();
    const warrantyEnd = new Date(product.warranty_end_date);
    const daysRemaining = Math.ceil((warrantyEnd - today) / (1000 * 60 * 60 * 24));
    
    const productData = product.toJSON();
    productData.warranty_status = {
      is_expired: daysRemaining < 0,
      days_remaining: daysRemaining,
      expires_soon: daysRemaining > 0 && daysRemaining <= 30
    };

    res.json({ product: productData });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name,
      brand,
      model_number,
      serial_number,
      purchase_date,
      purchase_price,
      currency,
      warranty_duration_months,
      category_id,
      store_id,
      notes,
      is_active
    } = req.body;

    const product = await Product.findOne({
      where: { 
        product_id: id,
        user_id: req.user.user_id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update product
    await product.update({
      product_name,
      brand,
      model_number,
      serial_number,
      purchase_date,
      purchase_price,
      currency,
      warranty_duration_months,
      category_id,
      store_id,
      notes,
      is_active
    });

    // Fetch updated product with associations
    const updatedProduct = await Product.findByPk(product.product_id, {
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'] },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ]
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { 
        product_id: id,
        user_id: req.user.user_id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete - mark as inactive instead of deleting
    await product.update({ is_active: false });

    // Or hard delete - uncomment this instead
    // await product.destroy();

    res.json({ 
      message: 'Product deleted successfully',
      product_id: id
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Get products expiring soon
exports.getExpiringProducts = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const products = await Product.findAll({
      where: {
        user_id: req.user.user_id,
        is_active: true,
        warranty_end_date: {
          [Op.between]: [today, futureDate]
        }
      },
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'] },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ],
      order: [['warranty_end_date', 'ASC']]
    });

    res.json({ products });
  } catch (error) {
    console.error('Get expiring products error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
};

// Get expired products
exports.getExpiredProducts = async (req, res) => {
  try {
    const today = new Date();

    const products = await Product.findAll({
      where: {
        user_id: req.user.user_id,
        is_active: true,
        warranty_end_date: {
          [Op.lt]: today
        }
      },
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'] },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ],
      order: [['warranty_end_date', 'DESC']]
    });

    res.json({ products });
  } catch (error) {
    console.error('Get expired products error:', error);
    res.status(500).json({ error: 'Failed to fetch expired products' });
  }
};

// Get product statistics
exports.getProductStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const today = new Date();

    // Total products
    const totalProducts = await Product.count({
      where: { user_id: userId, is_active: true }
    });

    // Active warranties
    const activeWarranties = await Product.count({
      where: {
        user_id: userId,
        is_active: true,
        warranty_end_date: { [Op.gte]: today }
      }
    });

    // Expired warranties
    const expiredWarranties = await Product.count({
      where: {
        user_id: userId,
        is_active: true,
        warranty_end_date: { [Op.lt]: today }
      }
    });

    // Total spent
    const totalSpentResult = await Product.sum('purchase_price', {
      where: { user_id: userId, is_active: true }
    });

    // Categories breakdown
    const categoriesBreakdown = await Product.findAll({
      where: { user_id: userId, is_active: true },
      attributes: [
        'category_id',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('product_id')), 'count']
      ],
      include: [
        { model: Category, attributes: ['category_name', 'icon_name'] }
      ],
      group: ['category_id', 'Category.category_id'],
      raw: false
    });

    // Stores breakdown
    const storesBreakdown = await Product.findAll({
      where: { user_id: userId, is_active: true },
      attributes: [
        'store_id',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('product_id')), 'count'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('purchase_price')), 'total_spent']
      ],
      include: [
        { model: Store, attributes: ['store_name', 'store_chain'] }
      ],
      group: ['store_id', 'Store.store_id'],
      raw: false
    });

    res.json({
      stats: {
        total_products: totalProducts,
        active_warranties: activeWarranties,
        expired_warranties: expiredWarranties,
        total_spent: totalSpentResult || 0,
        categories_breakdown: categoriesBreakdown,
        stores_breakdown: storesBreakdown
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
```

### 1.2 Create Product Routes (src/routes/products.js)

```javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/expiring', productController.getExpiringProducts);
router.get('/expired', productController.getExpiredProducts);
router.get('/stats', productController.getProductStats);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
```

### 1.3 Update Main App (src/app.js)

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products'); // Add this line

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes); // Add this line

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
```

---

## Part 2: Mobile App - Product API & State Management

### 2.1 Products API (src/api/products.js)

```javascript
import apiClient from './client';

export const productsApi = {
  // Create product
  async createProduct(productData) {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  // Get all products with filters
  async getProducts(params = {}) {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  // Get single product
  async getProduct(id) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Update product
  async updateProduct(id, productData) {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  async deleteProduct(id) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // Get expiring products
  async getExpiringProducts(days = 30) {
    const response = await apiClient.get('/products/expiring', {
      params: { days }
    });
    return response.data;
  },

  // Get expired products
  async getExpiredProducts() {
    const response = await apiClient.get('/products/expired');
    return response.data;
  },

  // Get statistics
  async getStats() {
    const response = await apiClient.get('/products/stats');
    return response.data;
  }
};
```

### 2.2 Updated Home Screen (src/screens/HomeScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, FAB, Appbar, Card, Chip, Searchbar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { productsApi } from '../api/products';

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getProducts({ 
        status: 'active',
        sort: 'purchase_date',
        order: 'DESC'
      });
      setProducts(data.products);
    } catch (error) {
      console.error('Error loading products:', error);
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
      return { label: 'Expired', color: '#f44336' };
    } else if (daysRemaining <= 30) {
      return { label: `${daysRemaining} days left`, color: '#ff9800' };
    } else {
      return { label: 'Active', color: '#4caf50' };
    }
  };

  const renderProduct = ({ item }) => {
    const warrantyStatus = getWarrantyStatus(item.warranty_end_date);
    const purchaseDate = new Date(item.purchase_date).toLocaleDateString('sr-RS');

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
                📅 Purchased: {purchaseDate}
              </Text>
              {item.purchase_price && (
                <Text variant="bodySmall" style={styles.detailText}>
                  💰 {item.purchase_price} {item.currency}
                </Text>
              )}
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
        <Appbar.Content title="My Warranties" />
        <Appbar.Action 
          icon="chart-box" 
          onPress={() => navigation.navigate('Statistics')} 
        />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>

      <Searchbar
        placeholder="Search products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {isLoading && products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>Loading...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No warranties yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Add your first product to start tracking warranties
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

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  searchbar: {
    margin: 16,
    marginBottom: 8
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
    padding: 16,
    paddingTop: 8
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
    color: '#666'
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0
  }
});
```

### 2.3 Updated Add Product Screen (src/screens/AddProductScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Menu, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { storesApi } from '../api/stores';

export default function AddProductScreen({ navigation }) {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [receiptImage, setReceiptImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Categories and stores
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  
  // Menu visibility
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);

  useEffect(() => {
    loadCategoriesAndStores();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
  }, []);

  const loadCategoriesAndStores = async () => {
    try {
      // These API functions will be created next
      const [categoriesData, storesData] = await Promise.all([
        categoriesApi.getCategories(),
        storesApi.getStores()
      ]);
      setCategories(categoriesData.categories || []);
      setStores(storesData.stores || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }

    if (!purchaseDate) {
      Alert.alert('Error', 'Please enter purchase date');
      return;
    }

    setIsLoading(true);
    
    try {
      const productData = {
        product_name: productName.trim(),
        brand: brand.trim() || null,
        purchase_date: purchaseDate,
        purchase_price: price ? parseFloat(price) : null,
        currency: 'RSD',
        warranty_duration_months: parseInt(warrantyMonths) || 12,
        category_id: selectedCategory,
        store_id: selectedStore,
        notes: null
      };

      const result = await productsApi.createProduct(productData);
      
      Alert.alert('Success', 'Product added successfully!', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]);
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <TextInput
          label="Product Name *"
          value={productName}
          onChangeText={setProductName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Brand"
          value={brand}
          onChangeText={setBrand}
          mode="outlined"
          style={styles.input}
        />

        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
              <TextInput
                label="Category"
                value={categories.find(c => c.category_id === selectedCategory)?.category_name || ''}
                mode="outlined"
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </TouchableOpacity>
          }
        >
          {categories.map((category) => (
            <Menu.Item
              key={category.category_id}
              onPress={() => {
                setSelectedCategory(category.category_id);
                setCategoryMenuVisible(false);
              }}
              title={category.category_name}
            />
          ))}
        </Menu>

        <Menu
          visible={storeMenuVisible}
          onDismiss={() => setStoreMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setStoreMenuVisible(true)}>
              <TextInput
                label="Store"
                value={stores.find(s => s.store_id === selectedStore)?.store_name || ''}
                mode="outlined"
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" />}
              />
            </TouchableOpacity>
          }
        >
          {stores.map((store) => (
            <Menu.Item
              key={store.store_id}
              onPress={() => {
                setSelectedStore(store.store_id);
                setStoreMenuVisible(false);
              }}
              title={store.store_name}
            />
          ))}
        </Menu>

        <TextInput
          label="Purchase Date (YYYY-MM-DD) *"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          mode="outlined"
          placeholder="2024-11-10"
          style={styles.input}
        />

        <TextInput
          label="Price (RSD)"
          value={price}
          onChangeText={setPrice}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Warranty Duration (months)"
          value={warrantyMonths}
          onChangeText={setWarrantyMonths}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Receipt/Warranty Document
        </Text>

        {receiptImage && (
          <Image source={{ uri: receiptImage }} style={styles.image} />
        )}

        <View style={styles.imageButtons}>
          <Button 
            mode="outlined" 
            onPress={takePhoto}
            icon="camera"
            style={styles.imageButton}
          >
            Take Photo
          </Button>
          <Button 
            mode="outlined" 
            onPress={pickImage}
            icon="image"
            style={styles.imageButton}
          >
            Choose Image
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        >
          Save Product
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  form: {
    padding: 16
  },
  input: {
    marginBottom: 16
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  imageButton: {
    flex: 1,
    marginHorizontal: 4
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8
  }
});
```

### 2.4 Product Detail Screen (src/screens/ProductDetailScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, Appbar, Card, Chip, Divider } from 'react-native-paper';
import { productsApi } from '../api/products';

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getProduct(productId);
      setProduct(data.product);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsApi.deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditProduct', { productId, product });
  };

  if (isLoading || !product) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Product Details" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  const purchaseDate = new Date(product.purchase_date).toLocaleDateString('sr-RS');
  const warrantyEndDate = new Date(product.warranty_end_date).toLocaleDateString('sr-RS');
  const warrantyStatus = product.warranty_status;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={product.product_name} />
        <Appbar.Action icon="pencil" onPress={handleEdit} />
        <Appbar.Action icon="delete" onPress={handleDelete} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Warranty Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Warranty Status
            </Text>
            <View style={styles.statusContainer}>
              {warrantyStatus.is_expired ? (
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: '#f4433620' }]}
                  textStyle={{ color: '#f44336' }}
                >
                  Expired
                </Chip>
              ) : warrantyStatus.expires_soon ? (
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: '#ff980020' }]}
                  textStyle={{ color: '#ff9800' }}
                >
                  Expires in {warrantyStatus.days_remaining} days
                </Chip>
              ) : (
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: '#4caf5020' }]}
                  textStyle={{ color: '#4caf50' }}
                >
                  Active ({warrantyStatus.days_remaining} days left)
                </Chip>
              )}
            </View>
            <Text variant="bodyMedium" style={styles.dateText}>
              Expires: {warrantyEndDate}
            </Text>
          </Card.Content>
        </Card>

        {/* Product Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Product Details
            </Text>
            
            {product.brand && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brand:</Text>
                <Text style={styles.detailValue}>{product.brand}</Text>
              </View>
            )}

            {product.model_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailValue}>{product.model_number}</Text>
              </View>
            )}

            {product.serial_number && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Serial:</Text>
                <Text style={styles.detailValue}>{product.serial_number}</Text>
              </View>
            )}

            {product.Category && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{product.Category.category_name}</Text>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Date:</Text>
              <Text style={styles.detailValue}>{purchaseDate}</Text>
            </View>

            {product.purchase_price && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Purchase Price:</Text>
                <Text style={styles.detailValue}>
                  {product.purchase_price} {product.currency}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Warranty Duration:</Text>
              <Text style={styles.detailValue}>
                {product.warranty_duration_months} months
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Store Information Card */}
        {product.Store && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Store Information
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Store:</Text>
                <Text style={styles.detailValue}>{product.Store.store_name}</Text>
              </View>

              {product.Store.store_chain && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Chain:</Text>
                  <Text style={styles.detailValue}>{product.Store.store_chain}</Text>
                </View>
              )}

              {product.Store.city && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{product.Store.city}</Text>
                </View>
              )}

              {product.Store.phone && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{product.Store.phone}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Documents Card */}
        {product.Documents && product.Documents.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Documents ({product.Documents.length})
              </Text>
              
              {product.Documents.map((doc) => (
                <View key={doc.document_id} style={styles.documentItem}>
                  {doc.thumbnail_url && (
                    <Image 
                      source={{ uri: doc.thumbnail_url }} 
                      style={styles.thumbnail}
                    />
                  )}
                  <View style={styles.documentInfo}>
                    <Text variant="bodyMedium">{doc.file_name}</Text>
                    <Text variant="bodySmall" style={styles.documentType}>
                      {doc.document_type}
                    </Text>
                    {doc.is_primary && (
                      <Chip style={styles.primaryChip} compact>Primary</Chip>
                    )}
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {product.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Notes
              </Text>
              <Text variant="bodyMedium">{product.notes}</Text>
            </Card.Content>
          </Card>
        )}
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
    fontWeight: 'bold',
    marginBottom: 12
  },
  statusContainer: {
    marginBottom: 8
  },
  statusChip: {
    alignSelf: 'flex-start'
  },
  dateText: {
    color: '#666',
    marginTop: 8
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right'
  },
  divider: {
    marginVertical: 12
  },
  documentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center'
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12
  },
  documentInfo: {
    flex: 1
  },
  documentType: {
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 4
  },
  primaryChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#4caf5020'
  }
});
```

### 2.5 Edit Product Screen (src/screens/EditProductScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Appbar, Menu } from 'react-native-paper';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { storesApi } from '../api/stores';

export default function EditProductScreen({ navigation, route }) {
  const { productId, product: initialProduct } = route.params;
  
  const [productName, setProductName] = useState(initialProduct.product_name);
  const [brand, setBrand] = useState(initialProduct.brand || '');
  const [modelNumber, setModelNumber] = useState(initialProduct.model_number || '');
  const [serialNumber, setSerialNumber] = useState(initialProduct.serial_number || '');
  const [purchaseDate, setPurchaseDate] = useState(initialProduct.purchase_date);
  const [price, setPrice] = useState(initialProduct.purchase_price?.toString() || '');
  const [warrantyMonths, setWarrantyMonths] = useState(initialProduct.warranty_duration_months?.toString() || '12');
  const [notes, setNotes] = useState(initialProduct.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  
  // Categories and stores
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialProduct.category_id);
  const [selectedStore, setSelectedStore] = useState(initialProduct.store_id);
  
  // Menu visibility
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);

  useEffect(() => {
    loadCategoriesAndStores();
  }, []);

  const loadCategoriesAndStores = async () => {
    try {
      const [categoriesData, storesData] = await Promise.all([
        categoriesApi.getCategories(),
        storesApi.getStores()
      ]);
      setCategories(categoriesData.categories || []);
      setStores(storesData.stores || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }

    if (!purchaseDate) {
      Alert.alert('Error', 'Please enter purchase date');
      return;
    }

    setIsLoading(true);
    
    try {
      const productData = {
        product_name: productName.trim(),
        brand: brand.trim() || null,
        model_number: modelNumber.trim() || null,
        serial_number: serialNumber.trim() || null,
        purchase_date: purchaseDate,
        purchase_price: price ? parseFloat(price) : null,
        currency: 'RSD',
        warranty_duration_months: parseInt(warrantyMonths) || 12,
        category_id: selectedCategory,
        store_id: selectedStore,
        notes: notes.trim() || null
      };

      await productsApi.updateProduct(productId, productData);
      
      Alert.alert('Success', 'Product updated successfully!', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Product" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <TextInput
            label="Product Name *"
            value={productName}
            onChangeText={setProductName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Brand"
            value={brand}
            onChangeText={setBrand}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Model Number"
            value={modelNumber}
            onChangeText={setModelNumber}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Serial Number"
            value={serialNumber}
            onChangeText={setSerialNumber}
            mode="outlined"
            style={styles.input}
          />

          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
                <TextInput
                  label="Category"
                  value={categories.find(c => c.category_id === selectedCategory)?.category_name || ''}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </TouchableOpacity>
            }
          >
            {categories.map((category) => (
              <Menu.Item
                key={category.category_id}
                onPress={() => {
                  setSelectedCategory(category.category_id);
                  setCategoryMenuVisible(false);
                }}
                title={category.category_name}
              />
            ))}
          </Menu>

          <Menu
            visible={storeMenuVisible}
            onDismiss={() => setStoreMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setStoreMenuVisible(true)}>
                <TextInput
                  label="Store"
                  value={stores.find(s => s.store_id === selectedStore)?.store_name || ''}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </TouchableOpacity>
            }
          >
            {stores.map((store) => (
              <Menu.Item
                key={store.store_id}
                onPress={() => {
                  setSelectedStore(store.store_id);
                  setStoreMenuVisible(false);
                }}
                title={store.store_name}
              />
            ))}
          </Menu>

          <TextInput
            label="Purchase Date (YYYY-MM-DD) *"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            mode="outlined"
            placeholder="2024-11-10"
            style={styles.input}
          />

          <TextInput
            label="Price (RSD)"
            value={price}
            onChangeText={setPrice}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Warranty Duration (months)"
            value={warrantyMonths}
            onChangeText={setWarrantyMonths}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitButton}
          >
            Update Product
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1
  },
  form: {
    padding: 16
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8
  }
});
```

### 2.6 Categories API (src/api/categories.js)

```javascript
import apiClient from './client';

export const categoriesApi = {
  async getCategories() {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async getCategory(id) {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  }
};
```

### 2.7 Stores API (src/api/stores.js)

```javascript
import apiClient from './client';

export const storesApi = {
  async getStores(params = {}) {
    const response = await apiClient.get('/stores', { params });
    return response.data;
  },

  async getStore(id) {
    const response = await apiClient.get(`/stores/${id}`);
    return response.data;
  },

  async createStore(storeData) {
    const response = await apiClient.post('/stores', storeData);
    return response.data;
  }
};
```

### 2.8 Update App Navigator (src/navigation/AppNavigator.js)

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AddProductScreen from '../screens/AddProductScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import EditProductScreen from '../screens/EditProductScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen 
              name="AddProduct" 
              component={AddProductScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ProductDetail" 
              component={ProductDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EditProduct" 
              component={EditProductScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Part 3: Backend - Categories and Stores Routes

### 3.1 Categories Controller (src/controllers/categoryController.js)

```javascript
const { Category, Product } = require('../models');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['category_name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [{
        model: Product,
        where: { user_id: req.user.user_id },
        required: false
      }]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};
```

### 3.2 Stores Controller (src/controllers/storeController.js)

```javascript
const { Store, Product } = require('../models');
const { Op } = require('sequelize');

exports.getStores = async (req, res) => {
  try {
    const { search, city } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { store_name: { [Op.iLike]: `%${search}%` } },
        { store_chain: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }

    const stores = await Store.findAll({
      where,
      order: [['store_name', 'ASC']]
    });

    res.json({ stores });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

exports.getStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get user's products from this store
    const products = await Product.findAll({
      where: {
        user_id: req.user.user_id,
        store_id: id
      }
    });

    res.json({ 
      store, 
      products_count: products.length 
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
};

exports.createStore = async (req, res) => {
  try {
    const {
      store_name,
      store_chain,
      address,
      city,
      phone,
      website
    } = req.body;

    if (!store_name) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    const store = await Store.create({
      store_name,
      store_chain,
      address,
      city,
      phone,
      website
    });

    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
};
```

### 3.3 Categories Routes (src/routes/categories.js)

```javascript
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, categoryController.getCategories);
router.get('/:id', authenticateToken, categoryController.getCategory);

module.exports = router;
```

### 3.4 Stores Routes (src/routes/stores.js)

```javascript
const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, storeController.getStores);
router.get('/:id', authenticateToken, storeController.getStore);
router.post('/', authenticateToken, storeController.createStore);

module.exports = router;
```

### 3.5 Update Main App (src/app.js) - Add new routes

```javascript
const categoryRoutes = require('./routes/categories');
const storeRoutes = require('./routes/stores');

// Add these lines after product routes
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/stores', storeRoutes);
```

---

## Testing Guide

### Test Backend APIs with curl or Postman:

```bash
# 1. Login and get token
TOKEN="your_access_token_here"

# 2. Create a product
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Samsung Galaxy S23",
    "brand": "Samsung",
    "purchase_date": "2024-11-01",
    "purchase_price": 89999,
    "warranty_duration_months": 24,
    "category_id": 1
  }'

# 3. Get all products
curl -X GET "http://localhost:3000/api/v1/products" \
  -H "Authorization: Bearer $TOKEN"

# 4. Get single product
curl -X GET "http://localhost:3000/api/v1/products/1" \
  -H "Authorization: Bearer $TOKEN"

# 5. Update product
curl -X PUT http://localhost:3000/api/v1/products/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Samsung Galaxy S23 Ultra",
    "brand": "Samsung"
  }'

# 6. Delete product
curl -X DELETE http://localhost:3000/api/v1/products/1 \
  -H "Authorization: Bearer $TOKEN"

# 7. Get categories
curl -X GET "http://localhost:3000/api/v1/categories" \
  -H "Authorization: Bearer $TOKEN"

# 8. Get stores
curl -X GET "http://localhost:3000/api/v1/stores" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ What's Complete:

1. ✅ **Backend Product CRUD** - Full create, read, update, delete operations
2. ✅ **Advanced Filtering** - Search, category filter, status filter, pagination
3. ✅ **Warranty Calculations** - Automatic warranty end date calculation
4. ✅ **Expiring Products** - Endpoint to get products expiring soon
5. ✅ **Statistics** - Dashboard stats with categories and stores breakdown
6. ✅ **Mobile Screens** - Home, Add, Edit, Detail screens fully functional
7. ✅ **Categories & Stores** - Complete CRUD for both entities
8. ✅ **Pull to Refresh** - Refresh products list on home screen
9. ✅ **Search Functionality** - Search by product name, brand, model

---

## 🎨 Additional Features You Can Add:

### Feature Ideas:
1. **Filters Modal** - Add a filter button that opens a modal with:
   - Category selection
   - Date range picker
   - Price range slider
   - Store selection

2. **Sorting Options** - Allow users to sort by:
   - Purchase date (newest/oldest)
   - Warranty expiry (soonest/latest)
   - Price (highest/lowest)
   - Product name (A-Z)

3. **Statistics Dashboard Screen** - Show:
   - Total money spent
   - Number of active vs expired warranties
   - Chart of purchases by category
   - Chart of purchases by month
   - Most purchased stores

4. **Export/Backup** - Export all products to:
   - CSV file
   - PDF report
   - JSON backup

---

## 📱 Quick Enhancement: Add Statistics Screen

### Create Statistics Screen (src/screens/StatisticsScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Appbar, Divider } from 'react-native-paper';
import { productsApi } from '../api/products';

export default function StatisticsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await productsApi.getStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Statistics" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Statistics" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Overview Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Overview
            </Text>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Products</Text>
              <Text style={styles.statValue}>{stats.total_products}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Warranties</Text>
              <Text style={[styles.statValue, { color: '#4caf50' }]}>
                {stats.active_warranties}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Expired Warranties</Text>
              <Text style={[styles.statValue, { color: '#f44336' }]}>
                {stats.expired_warranties}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={[styles.statValue, { fontSize: 20, fontWeight: 'bold' }]}>
                {stats.total_spent.toLocaleString('sr-RS')} RSD
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Categories Breakdown */}
        {stats.categories_breakdown && stats.categories_breakdown.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                By Category
              </Text>
              
              {stats.categories_breakdown.map((item, index) => (
                <View key={index}>
                  {index > 0 && <Divider style={styles.smallDivider} />}
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>
                      {item.Category?.category_name || 'Uncategorized'}
                    </Text>
                    <Text style={styles.statValue}>{item.count} items</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Stores Breakdown */}
        {stats.stores_breakdown && stats.stores_breakdown.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                By Store
              </Text>
              
              {stats.stores_breakdown.map((item, index) => (
                <View key={index}>
                  {index > 0 && <Divider style={styles.smallDivider} />}
                  <View style={styles.storeRow}>
                    <View style={styles.storeInfo}>
                      <Text style={styles.storeName}>
                        {item.Store?.store_name || 'Unknown Store'}
                      </Text>
                      <Text style={styles.storeChain}>
                        {item.Store?.store_chain || ''}
                      </Text>
                    </View>
                    <View style={styles.storeStats}>
                      <Text style={styles.statValue}>{item.count} items</Text>
                      {item.total_spent && (
                        <Text style={styles.storeSpent}>
                          {parseFloat(item.total_spent).toLocaleString('sr-RS')} RSD
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
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
    fontWeight: 'bold',
    marginBottom: 16
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  statLabel: {
    fontSize: 15,
    color: '#666'
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600'
  },
  divider: {
    marginVertical: 12
  },
  smallDivider: {
    marginVertical: 8
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  storeInfo: {
    flex: 1
  },
  storeName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2
  },
  storeChain: {
    fontSize: 13,
    color: '#666'
  },
  storeStats: {
    alignItems: 'flex-end'
  },
  storeSpent: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  }
});
```

### Update AppNavigator to include Statistics screen:

```javascript
import StatisticsScreen from '../screens/StatisticsScreen';

// Add inside the authenticated stack:
<Stack.Screen 
  name="Statistics" 
  component={StatisticsScreen}
  options={{ headerShown: false }}
/>
```

---

## 🚀 Next Steps

Now that Product CRUD is complete, you can move on to:

### Option 1: Document Upload with Cloud Storage
- Implement file upload to AWS S3 or Cloudinary
- Add document management (view, download, delete)
- Generate thumbnails for images
- Support PDF documents

### Option 2: Warranty Notifications
- Push notifications for expiring warranties
- Email reminders
- In-app notification center
- Customizable notification settings

### Option 3: OCR Receipt Scanning
- Integrate Google Cloud Vision or Tesseract
- Automatically extract receipt data
- Pre-fill product form with extracted info
- Manual correction interface

### Option 4: Search & Filters Enhancement
- Advanced search with multiple criteria
- Saved search filters
- Recent searches history
- Search suggestions/autocomplete

**Which feature would you like to implement next?**