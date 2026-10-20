require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const emailArg = process.argv[2];

async function promote() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    let user;
    if (emailArg) {
      user = await User.findOne({ email: emailArg.toLowerCase().trim() });
    } else {
      user = await User.findOne().sort({ createdAt: -1 });
    }

    if (!user) {
      console.log('No user found to promote. Please register an account first in the web app!');
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();
    console.log(`✅ User ${user.email} (${user.name}) is now an ADMIN!`);
    process.exit(0);
  } catch (err) {
    console.error('Error promoting user:', err.message);
    process.exit(1);
  }
}

promote();
