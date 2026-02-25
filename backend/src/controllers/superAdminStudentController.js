// Super Admin Student Management Controller
const { StudentProfile, User, Application } = require('../models');
const { Op } = require('sequelize');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const mapStudentUser = (record) => {
  const user = record?.toJSON ? record.toJSON() : record;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    studentProfile: user.StudentProfile || null,
  };
};

// Get all student users with pagination and filters
exports.getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parsePositiveInt(page, 1);
    const limitNum = parsePositiveInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const where = { role: 'student' };
    const searchTerm = String(search || '').trim();

    if (searchTerm) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
        { phone: { [Op.iLike]: `%${searchTerm}%` } },
        { '$StudentProfile.university$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$StudentProfile.major$': { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      attributes: { exclude: ['password', 'otp', 'otpExpires'] },
      include: [
        {
          model: StudentProfile,
          required: false,
          attributes: ['id', 'university', 'major', 'graduationYear', 'skills', 'openToWork'],
        },
      ],
      order: [['createdAt', 'DESC']],
      subQuery: false,
      distinct: true,
    });

    res.status(200).json({
      success: true,
      data: {
        students: rows.map(mapStudentUser),
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

// Get single student user by ID
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id, role: 'student' },
      attributes: { exclude: ['password', 'otp', 'otpExpires'] },
      include: [
        {
          model: StudentProfile,
          required: false,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const applicationsCount = await Application.count({ where: { studentId: id } });

    res.status(200).json({
      success: true,
      data: { student: mapStudentUser(user), applicationsCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update student user/profile
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const user = await User.findOne({
      where: { id, role: 'student' },
      include: [{ model: StudentProfile, required: false }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    await user.save();

    const allowedProfileFields = [
      'university',
      'major',
      'graduationYear',
      'skills',
      'resumeUrl',
      'github',
      'linkedin',
      'portfolio',
      'bio',
      'avatar',
      'banner',
      'openToWork',
    ];

    const profilePayload = {};
    allowedProfileFields.forEach((field) => {
      if (updates[field] !== undefined) profilePayload[field] = updates[field];
    });

    if (Object.keys(profilePayload).length > 0) {
      if (user.StudentProfile) {
        await user.StudentProfile.update(profilePayload);
      } else {
        await StudentProfile.create({ userId: user.id, ...profilePayload });
      }
    }

    const refreshed = await User.findOne({
      where: { id, role: 'student' },
      attributes: { exclude: ['password', 'otp', 'otpExpires'] },
      include: [
        {
          model: StudentProfile,
          required: false,
          attributes: ['id', 'university', 'major', 'graduationYear', 'skills', 'openToWork'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: { student: mapStudentUser(refreshed) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Delete student user (profile/applications cascade with FK rules)
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, role: 'student' } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
