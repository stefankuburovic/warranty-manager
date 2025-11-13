const { Store, Product, UserCustomStore } = require('../models');
const { Op } = require('sequelize');

exports.getStores = async (req, res) => {
  try {
    const { search, city } = req.query;
    const userId = req.user.user_id;
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

    // Fetch regular stores
    const stores = await Store.findAll({
      where,
      order: [['store_name', 'ASC']]
    });

    // Fetch user custom stores
    const customStoresWhere = {};
    if (search) {
      customStoresWhere.store_name = { [Op.iLike]: `%${search}%` };
    }

    const userCustomStores = await UserCustomStore.findAll({
      where: {
        user_id: userId,
        ...customStoresWhere
      },
      order: [['store_name', 'ASC']]
    });

    // Combine stores with a type indicator
    const allStores = [
      ...stores.map(store => ({
        ...store.toJSON(),
        store_id: store.store_id,
        store_name: store.store_name,
        store_chain: store.store_chain,
        city: store.city,
        address: store.address,
        phone: store.phone,
        website: store.website,
        type: 'regular'
      })),
      ...userCustomStores.map(customStore => ({
        store_id: `custom_${customStore.user_custom_store_id}`, // Prefix to distinguish
        user_custom_store_id: customStore.user_custom_store_id,
        store_name: customStore.store_name,
        type: 'custom'
      }))
    ];

    // Sort combined list by name
    allStores.sort((a, b) => a.store_name.localeCompare(b.store_name));

    res.json({ stores: allStores });
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
      website,
      is_custom = false // Flag to indicate if it's a user custom store
    } = req.body;

    if (!store_name) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    // If it's a custom store, create in user_custom_stores table
    if (is_custom) {
      const userId = req.user.user_id;
      
      // Check if user already has a custom store with this name
      const existingCustomStore = await UserCustomStore.findOne({
        where: {
          user_id: userId,
          store_name: store_name.trim()
        }
      });

      if (existingCustomStore) {
        return res.status(201).json({
          message: 'Custom store already exists',
          store: {
            ...existingCustomStore.toJSON(),
            store_id: `custom_${existingCustomStore.user_custom_store_id}`,
            type: 'custom'
          }
        });
      }

      const customStore = await UserCustomStore.create({
        user_id: userId,
        store_name: store_name.trim()
      });

      return res.status(201).json({
        message: 'Custom store created successfully',
        store: {
          ...customStore.toJSON(),
          store_id: `custom_${customStore.user_custom_store_id}`,
          type: 'custom'
        }
      });
    }

    // Otherwise, create regular store (admin/global store)
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
      store: {
        ...store.toJSON(),
        type: 'regular'
      }
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
};
