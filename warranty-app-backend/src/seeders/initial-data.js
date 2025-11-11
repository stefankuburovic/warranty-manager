const { Category, Store } = require('../models');

async function seedDatabase() {
  try {
    // Seed Categories
    const categories = [
      { category_name: 'Electronics', icon_name: 'laptop', default_warranty_months: 24 },
      { category_name: 'Home Appliances', icon_name: 'washing-machine', default_warranty_months: 12 },
      { category_name: 'Furniture', icon_name: 'sofa', default_warranty_months: 12 },
      { category_name: 'Tools', icon_name: 'hammer', default_warranty_months: 12 },
      { category_name: 'Sports Equipment', icon_name: 'dumbbell', default_warranty_months: 6 },
      { category_name: 'Clothing', icon_name: 'tshirt-crew', default_warranty_months: 0 },
      { category_name: 'Footwear', icon_name: 'shoe-formal', default_warranty_months: 0 },
      { category_name: 'Automotive', icon_name: 'car', default_warranty_months: 12 },
      { category_name: 'Books', icon_name: 'book', default_warranty_months: 0 },
      { category_name: 'Toys', icon_name: 'toy-brick', default_warranty_months: 6 },
      { category_name: 'Beauty & Personal Care', icon_name: 'face-woman', default_warranty_months: 0 },
      { category_name: 'Kitchenware', icon_name: 'chef-hat', default_warranty_months: 12 },
      { category_name: 'Garden & Outdoor', icon_name: 'flower', default_warranty_months: 12 },
      { category_name: 'Health & Fitness', icon_name: 'dumbbell', default_warranty_months: 6 },
      { category_name: 'Office Supplies', icon_name: 'briefcase', default_warranty_months: 0 },
      { category_name: 'Musical Instruments', icon_name: 'music', default_warranty_months: 12 },
      { category_name: 'Photography', icon_name: 'camera', default_warranty_months: 12 },
      { category_name: 'Gaming', icon_name: 'gamepad-variant', default_warranty_months: 12 },
      { category_name: 'Other', icon_name: 'package-variant', default_warranty_months: 12 }
    ];

    // Check if categories already exist
    const existingCategories = await Category.findAll();
    if (existingCategories.length === 0) {
      await Category.bulkCreate(categories);
      console.log('✓ Categories seeded');
    } else {
      console.log('✓ Categories already exist, skipping seed');
    }

    // Seed Popular Serbian Stores
    const stores = [
      { store_name: 'Tehnomanija - Knez Mihailova', store_chain: 'Tehnomanija', city: 'Belgrade', website: 'https://www.tehnomanija.rs' },
      { store_name: 'Gigatron - Ušće', store_chain: 'Gigatron', city: 'Belgrade', website: 'https://www.gigatron.rs' },
      { store_name: 'Emmi - Delta City', store_chain: 'Emmi', city: 'Belgrade', website: 'https://www.emmi.rs' },
      { store_name: 'Tempo - Novi Sad', store_chain: 'Tempo', city: 'Novi Sad', website: 'https://www.tempo.rs' },
      { store_name: 'JYSK - BIG', store_chain: 'JYSK', city: 'Belgrade', website: 'https://www.jysk.rs' }
    ];

    // Check if stores already exist
    const existingStores = await Store.findAll();
    if (existingStores.length === 0) {
      await Store.bulkCreate(stores);
      console.log('✓ Stores seeded');
    } else {
      console.log('✓ Stores already exist, skipping seed');
    }

    console.log('✓ Database seeded successfully');
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    throw error;
  }
}

module.exports = seedDatabase;

