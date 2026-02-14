require('dotenv').config();
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../src/models');
const { sequelize } = require('../src/config/database');

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'superadmin@internepal.com').trim().toLowerCase();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'Superadmin@11';

const enforceSingleSuperAdmin = async (keepUserId) => {
  const extras = await User.findAll({
    where: {
      role: 'superadmin',
      id: { [Op.ne]: keepUserId },
    },
  });

  if (extras.length === 0) return 0;

  for (const user of extras) {
    user.role = 'admin';
    user.isActive = false;
    await user.save();
  }

  return extras.length;
};

const resetSuperAdminPassword = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully\n');

    // Find superadmin (prefer configured email first)
    let superAdmin = await User.findOne({
      where: { email: SUPERADMIN_EMAIL, role: 'superadmin' }
    });
    if (!superAdmin) {
      superAdmin = await User.findOne({ where: { role: 'superadmin' } });
    }

    if (!superAdmin) {
      console.log('❌ No super admin found!');
      console.log('Run createSuperAdmin.js to create one.');
      process.exit(1);
    }

    console.log('📋 Current Super Admin Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Name:', superAdmin.name);
    console.log('Email:', superAdmin.email);
    console.log('Phone:', superAdmin.phone);
    console.log('Role:', superAdmin.role);
    console.log('Verified:', superAdmin.isVerified);
    console.log('Active:', superAdmin.isActive);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Reset password/email to configured defaults
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
    
    superAdmin.email = SUPERADMIN_EMAIL;
    superAdmin.password = hashedPassword;
    superAdmin.isVerified = true;
    superAdmin.isActive = true;
    superAdmin.otp = null;
    superAdmin.otpExpires = null;
    superAdmin.tokenVersion = 0;
    
    await superAdmin.save();
    const cleaned = await enforceSingleSuperAdmin(superAdmin.id);

    console.log('✅ Super Admin password has been reset!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 New Password:', SUPERADMIN_PASSWORD);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Account verified and activated');
    console.log('✓ All tokens invalidated');
    if (cleaned > 0) {
      console.log(`🧹 Cleaned duplicate superadmins: ${cleaned} moved to inactive admin.`);
    }
    console.log('\n⚠️  You can now login with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting super admin password:', error);
    process.exit(1);
  }
};

resetSuperAdminPassword();
