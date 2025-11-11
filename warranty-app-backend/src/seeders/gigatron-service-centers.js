const { ServiceCenter, Category } = require('../models');
const locationService = require('../services/locationService');

// Gigatron service centers and stores (can be used as service centers)
const gigatronLocations = [
  {
    name: 'Gigatron - Centar za prijem reklamacija',
    address: 'Jurija Gagarina 26, Novi Beograd',
    city: 'Belgrade',
    phone: '065 66 46 007',
    email: 'servis.prijem1@gigatronshop.com',
    description: 'Dedicated Service Center for handling customer complaints and servicing needs',
    hours: {
      monday: '08:00 - 21:00',
      tuesday: '08:00 - 21:00',
      wednesday: '08:00 - 21:00',
      thursday: '08:00 - 21:00',
      friday: '08:00 - 21:00',
      saturday: '09:00 - 16:00',
      sunday: 'Closed'
    },
    services: ['Prijem reklamacija', 'Servis', 'Dijagnostika', 'Zamena proizvoda']
  },
  {
    name: 'Gigatron - Ušće Shopping Center',
    address: 'Bulevar Mihajla Pupina 4, Beograd',
    city: 'Belgrade',
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - Delta City',
    address: 'Jurija Gagarina 16, Novi Beograd',
    city: 'Belgrade',
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - BIG FASHION',
    address: 'Bulevar Vojvode Stepe Stepanovića 105, Beograd',
    city: 'Belgrade',
    latitude: 44.8028,
    longitude: 20.4206,
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - Stadion',
    address: 'Bulevar Oslobođenja 58, Novi Sad',
    city: 'Novi Sad',
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - Promenada',
    address: 'Bulevar Oslobođenja 119, Novi Sad',
    city: 'Novi Sad',
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - Niš',
    address: 'Bulevar Nemanjića 2, Niš',
    city: 'Niš',
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - Kragujevac',
    address: 'Bulevar Kralja Aleksandra 1, Kragujevac',
    city: 'Kragujevac',
    latitude: 44.0167,
    longitude: 20.9167,
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - Subotica',
    address: 'Trg Slobode 1, Subotica',
    city: 'Subotica',
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  },
  {
    name: 'Gigatron - Zrenjanin',
    address: 'Trg Slobode 1, Zrenjanin',
    city: 'Zrenjanin',
    phone: '011 44 14 000',
    website: 'https://www.gigatron.rs',
    description: 'Gigatron store and service point'
  }
];

async function seedGigatronServiceCenters() {
  try {
    console.log('🌍 Starting Gigatron service centers seeding...');

    // Get Electronics category for association
    const electronicsCategory = await Category.findOne({
      where: { category_name: 'Electronics' }
    });

    const categoryId = electronicsCategory ? electronicsCategory.category_id : null;

    // Check if service centers already exist
    const existingCenters = await ServiceCenter.findAll({
      where: { brand: 'Gigatron' }
    });

    if (existingCenters.length > 0) {
      console.log(`✓ Found ${existingCenters.length} existing Gigatron service centers`);
      console.log('⚠️  To re-seed, delete existing centers first');
      return;
    }

    const createdCenters = [];

    for (const location of gigatronLocations) {
      try {
        let latitude, longitude, postalCode;
        
        // Use manual coordinates if provided, otherwise geocode
        if (location.latitude && location.longitude) {
          latitude = location.latitude;
          longitude = location.longitude;
          postalCode = null;
          console.log(`📍 Using manual coordinates for: ${location.name}`);
        } else {
          // Geocode the address
          const fullAddress = `${location.address}, ${location.city}, Serbia`;
          console.log(`📍 Geocoding: ${fullAddress}`);
          
          const geocoded = await locationService.geocodeAddress(fullAddress);
          
          if (!geocoded) {
            console.warn(`⚠️  Could not geocode: ${fullAddress}, skipping...`);
            continue;
          }
          
          latitude = geocoded.latitude;
          longitude = geocoded.longitude;
          postalCode = geocoded.postalCode;
        }

        // Create service center
        const serviceCenter = await ServiceCenter.create({
          name: location.name,
          brand: 'Gigatron',
          category_id: categoryId,
          latitude: latitude,
          longitude: longitude,
          address: location.address,
          city: location.city,
          country: 'Serbia',
          postal_code: postalCode || null,
          phone: location.phone || null,
          email: location.email || null,
          website: location.website || 'https://www.gigatron.rs',
          description: location.description || null,
          services: location.services || ['Prijem reklamacija', 'Servis', 'Prodaja'],
          hours: location.hours || null,
          rating: 4.5,
          review_count: 0,
          is_active: true,
          is_verified: true
        });

        createdCenters.push(serviceCenter);
        console.log(`✓ Created: ${location.name} (${location.city})`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`✗ Error creating ${location.name}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${createdCenters.length} Gigatron service centers`);
    console.log('📍 Service centers are ready to use!');
  } catch (error) {
    console.error('✗ Error seeding Gigatron service centers:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const sequelize = require('../config/database');
  
  sequelize.authenticate()
    .then(() => {
      console.log('✓ Database connection established');
      return seedGigatronServiceCenters();
    })
    .then(() => {
      console.log('✓ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedGigatronServiceCenters;

