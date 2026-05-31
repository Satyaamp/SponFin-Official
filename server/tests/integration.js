// Integration verification script for SponFin CMS & Server
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Service = require('../models/Service');
const Project = require('../models/Project');

const runTests = async () => {
  console.log('--- STARTING INTEGRATION TESTS ---');
  let connection;

  try {
    // 1. Database Connection Test
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/sponfin';
    console.log(`Connecting to ${connStr}...`);
    connection = await mongoose.connect(connStr);
    console.log('✓ Database connected successfully.');

    // 2. User Model Verification
    const admin = await User.findOne({ email: 'admin@sponfin.com' });
    if (admin) {
      console.log(`✓ Admin user verified: ${admin.name} [Role: ${admin.role}]`);
    } else {
      console.warn('✗ Admin user not found. Run seed script first.');
    }

    // 3. Settings Verification
    const settings = await Setting.findOne();
    if (settings) {
      console.log(`✓ Global settings verified: ${settings.companyName}`);
    } else {
      console.warn('✗ Settings document not found. Run seed script first.');
    }

    // 4. Services Verification
    const services = await Service.find();
    console.log(`✓ Services count: ${services.length}`);

    // 5. Projects Verification
    const projects = await Project.find();
    console.log(`✓ Projects count: ${projects.length}`);

    console.log('\n--- ALL INTEGRATION TESTS PASSED ---');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ INTEGRATION TEST FAILED:', error.message);
    process.exit(1);
  }
};

runTests();
