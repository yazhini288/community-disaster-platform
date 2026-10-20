require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Request = require('../models/Request');
const Report = require('../models/Report');
const { calculatePriorityScore } = require('../services/allocationService');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding.');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found. Aborting.');
      process.exit(1);
    }

    // 1. Seed Warehouse Resources if empty or few
    const resCount = await Resource.countDocuments();
    if (resCount < 3) {
      await Resource.deleteMany({});
      const resources = [
        { name: 'Bottled Drinking Water (1L)', category: 'water', quantity: 250, unit: 'bottles', location: 'Central Relief Depot' },
        { name: 'Emergency Meal Rations', category: 'food', quantity: 180, unit: 'packets', location: 'Relief Hub North' },
        { name: 'Trauma & First Aid Kits', category: 'medical', quantity: 45, unit: 'kits', location: 'Central Hospital Depot' },
        { name: 'Baby Milk Formula & Nutrition', category: 'food', quantity: 60, unit: 'cans', location: 'Relief Hub North' },
        { name: 'Emergency Weather Tents & Blankets', category: 'shelter', quantity: 80, unit: 'sets', location: 'Sector 4 Shelter' },
        { name: 'Essential Antibiotics & Insulin Coolers', category: 'medical', quantity: 20, unit: 'packs', location: 'Central Hospital Depot' }
      ];
      await Resource.insertMany(resources.map(r => ({ ...r, managedBy: admin._id })));
      console.log('✅ Seeded 6 warehouse resource inventory pools.');
    }

    // 2. Seed realistic Requests if few
    const reqCount = await Request.countDocuments();
    if (reqCount < 3) {
      const requests = [
        {
          resourceNeeded: 'Emergency First Aid Kit & Bandages',
          quantity: 2,
          priority: 'critical',
          isVulnerable: true,
          vulnerabilityTags: ['medical_dependency', 'elderly'],
          notes: 'Elderly diabetic patient with wound, trapped on 2nd floor.',
          status: 'pending',
          requestedBy: admin._id,
          location: { lat: 13.0850, lng: 80.2750, address: 'Anna Salai, Sector 2' }
        },
        {
          resourceNeeded: 'Drinking Water bottles and meal rations',
          quantity: 15,
          priority: 'high',
          isVulnerable: true,
          vulnerabilityTags: ['child'],
          notes: 'Family with 2 toddlers cut off by flash waterlogging.',
          status: 'pending',
          requestedBy: admin._id,
          location: { lat: 13.0780, lng: 80.2600, address: 'Kotturpuram River Road' }
        },
        {
          resourceNeeded: 'Emergency Blankets & Tarpaulin',
          quantity: 8,
          priority: 'medium',
          isVulnerable: false,
          notes: 'Shelter roof leak during heavy rain.',
          status: 'pending',
          requestedBy: admin._id,
          location: { lat: 13.0900, lng: 80.2800, address: 'Perambur Relief Center' }
        },
        {
          resourceNeeded: 'Insulin and Medical Coolers',
          quantity: 1,
          priority: 'critical',
          isVulnerable: true,
          vulnerabilityTags: ['medical_dependency'],
          notes: 'Urgent insulin supply run out.',
          status: 'pending',
          requestedBy: admin._id,
          location: { lat: 13.0600, lng: 80.2400, address: 'T. Nagar 3rd Cross' }
        }
      ];

      for (const req of requests) {
        req.priorityScore = calculatePriorityScore(req);
        await Request.create(req);
      }
      console.log('✅ Seeded 4 sample priority resource requests.');
    }

    // 3. Seed Hazard Reports if few
    const repCount = await Report.countDocuments();
    if (repCount < 3) {
      const reports = [
        {
          type: 'flood',
          description: 'Severe waterlogging (3 feet deep). Vehicles stranded.',
          roadStatus: 'blocked',
          severity: 'critical',
          location: { lat: 13.0827, lng: 80.2707, address: 'Poonamallee High Road' },
          reportedBy: admin._id
        },
        {
          type: 'road_block',
          description: 'Large banyan tree fallen across both lanes. Fire department on site.',
          roadStatus: 'partially_blocked',
          severity: 'medium',
          location: { lat: 13.0418, lng: 80.2341, address: 'Mount Road / Saidapet' },
          reportedBy: admin._id
        },
        {
          type: 'flood',
          description: 'Water receding. Single lane opened for emergency relief convoys.',
          roadStatus: 'usable',
          severity: 'low',
          location: { lat: 13.0569, lng: 80.2425, address: 'Cathedral Road Bypass' },
          reportedBy: admin._id
        }
      ];
      await Report.insertMany(reports);
      console.log('✅ Seeded 3 disaster and road condition reports.');
    }

    console.log('Seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
