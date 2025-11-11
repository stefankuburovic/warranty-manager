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
