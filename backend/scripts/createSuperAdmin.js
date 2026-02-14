require('dotenv').config();
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User } = require('../src/models');
const { sequelize } = require('../src/config/database');

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'superadmin@internepal.com').trim().toLowerCase();
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'Superadmin@11';
const SUPERADMIN_PHONE = process.env.SUPERADMIN_PHONE || '9812345678';

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

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ where: { role: 'superadmin' } });

    if (existingSuperAdmin) {
      console.log('Super admin already exists. Updating credentials to configured defaults...');
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
      existingSuperAdmin.email = SUPERADMIN_EMAIL;
      existingSuperAdmin.password = hashedPassword;
      existingSuperAdmin.phone = SUPERADMIN_PHONE;
      existingSuperAdmin.isVerified = true;
      existingSuperAdmin.isActive = true;
      existingSuperAdmin.otp = null;
      existingSuperAdmin.otpExpires = null;
      existingSuperAdmin.tokenVersion = 0;
      await existingSuperAdmin.save();

      const cleaned = await enforceSingleSuperAdmin(existingSuperAdmin.id);
      console.log('✅ Super Admin updated successfully!');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('🔑 Password:', SUPERADMIN_PASSWORD);
      if (cleaned > 0) {
        console.log(`🧹 Cleaned duplicate superadmins: ${cleaned} moved to inactive admin.`);
      }
      process.exit(0);
    }

    // Create superadmin account
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

    const superAdmin = await User.create({
      name: 'Super Admin',
      email: SUPERADMIN_EMAIL,
      password: hashedPassword,
      phone: SUPERADMIN_PHONE,
      role: 'superadmin',
      isVerified: true,
      isActive: true,
      otp: null,
      otpExpires: null
    });

    const cleaned = await enforceSingleSuperAdmin(superAdmin.id);

    console.log('✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Password:', SUPERADMIN_PASSWORD);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please change the password after first login!');
    if (cleaned > 0) {
      console.log(`🧹 Cleaned duplicate superadmins: ${cleaned} moved to inactive admin.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
