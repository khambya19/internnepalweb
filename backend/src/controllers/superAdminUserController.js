// Super Admin User Management Controller
const { User, StudentProfile, CompanyProfile, Job, Application } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const mapUserListItem = (record) => {
  const user = record?.toJSON ? record.toJSON() : record;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    studentProfile: user.StudentProfile
      ? {
          id: user.StudentProfile.id,
          university: user.StudentProfile.university || null,
          major: user.StudentProfile.major || null,
          graduationYear: user.StudentProfile.graduationYear || null,
          openToWork: user.StudentProfile.openToWork || false,
        }
      : null,
    companyProfile: user.CompanyProfile
      ? {
          id: user.CompanyProfile.id,
          companyName: user.CompanyProfile.companyName || null,
          industry: user.CompanyProfile.industry || null,
          location: user.CompanyProfile.location || null,
          tagline: user.CompanyProfile.tagline || null,
        }
      : null,
  };
};

const mapUserDetail = (record) => {
  const user = record?.toJSON ? record.toJSON() : record;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    studentProfile: user.StudentProfile || null,
    companyProfile: user.CompanyProfile || null,
  };
};

const primaryProfileByRole = (user) => {
  if (!user) return null;
  if (user.role === 'student') return user.studentProfile || null;
  if (user.role === 'company') return user.companyProfile || null;
  return null;
};

// Get all users with pagination and filters
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const pageNum = parsePositiveInt(page, 1);
    const limitNum = parsePositiveInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    const searchTerm = String(search || '').trim();

    const where = {};
    if (role) where.role = role;
    if (searchTerm) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
        { phone: { [Op.iLike]: `%${searchTerm}%` } },
        { '$StudentProfile.university$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$StudentProfile.major$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$CompanyProfile.companyName$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$CompanyProfile.industry$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$CompanyProfile.location$': { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      attributes: { exclude: ['password', 'otp', 'otpExpires', 'isVerified'] },
      include: [
        {
          model: StudentProfile,
          required: false,
          attributes: ['id', 'university', 'major', 'graduationYear', 'openToWork'],
        },
        {
          model: CompanyProfile,
          required: false,
          attributes: ['id', 'companyName', 'industry', 'location', 'tagline'],
        },
      ],
      order: [['createdAt', 'DESC']],
      subQuery: false,
      distinct: true,
    });

    res.status(200).json({
      success: true,
      data: {
        users: rows.map(mapUserListItem),
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRecord = await User.findByPk(id, {
      attributes: { exclude: ['password', 'otp', 'otpExpires', 'isVerified'] },
      include: [
        {
          model: StudentProfile,
          required: false,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
        {
          model: CompanyProfile,
          required: false,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
    });

    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = mapUserDetail(userRecord);
    const stats = {
      applicationsCount: 0,
      jobsCount: 0,
      activeJobsCount: 0,
    };

    if (user.role === 'student') {
      stats.applicationsCount = await Application.count({ where: { studentId: id } });
    } else if (user.role === 'company' && user.companyProfile?.id) {
      stats.jobsCount = await Job.count({ where: { companyId: user.companyProfile.id } });
      stats.activeJobsCount = await Job.count({
        where: {
          companyId: user.companyProfile.id,
          [Op.or]: [{ status: { [Op.iLike]: 'active' } }, { status: { [Op.iLike]: 'live' } }],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile: primaryProfileByRole(user),
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Change user role
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'company', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow changing superadmin role
    if (user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot change superadmin role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow deleting superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete superadmin' });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
