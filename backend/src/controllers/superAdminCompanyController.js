// Super Admin Company Management Controller
const { CompanyProfile, User, Job } = require('../models');
const { Op } = require('sequelize');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const mapCompanyUser = (record) => {
  const user = record?.toJSON ? record.toJSON() : record;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    companyProfile: user.CompanyProfile || null,
  };
};

// Get all company users with pagination and filters
exports.getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parsePositiveInt(page, 1);
    const limitNum = parsePositiveInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const where = { role: 'company' };
    const searchTerm = String(search || '').trim();

    if (searchTerm) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
        { phone: { [Op.iLike]: `%${searchTerm}%` } },
        { '$CompanyProfile.companyName$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$CompanyProfile.industry$': { [Op.iLike]: `%${searchTerm}%` } },
        { '$CompanyProfile.location$': { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      attributes: { exclude: ['password', 'otp', 'otpExpires'] },
      include: [
        {
          model: CompanyProfile,
          required: false,
          attributes: ['id', 'companyName', 'location', 'industry', 'logo', 'tagline'],
        },
      ],
      order: [['createdAt', 'DESC']],
      subQuery: false,
      distinct: true,
    });

    res.status(200).json({
      success: true,
      data: {
        companies: rows.map(mapCompanyUser),
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

// Get single company user by ID
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id, role: 'company' },
      attributes: { exclude: ['password', 'otp', 'otpExpires'] },
      include: [
        {
          model: CompanyProfile,
          required: false,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const companyId = user.CompanyProfile?.id || null;
    let jobsCount = 0;
    let activeJobsCount = 0;

    if (companyId) {
      jobsCount = await Job.count({ where: { companyId } });
      activeJobsCount = await Job.count({
        where: {
          companyId,
          [Op.or]: [{ status: { [Op.iLike]: 'active' } }, { status: { [Op.iLike]: 'live' } }],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { company: mapCompanyUser(user), jobsCount, activeJobsCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Update company user/profile
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const normalizedUserEmail = updates.userEmail !== undefined ? updates.userEmail : updates.email;
    const normalizedUserPhone = updates.userPhone !== undefined ? updates.userPhone : updates.phone;
    const normalizedCompanyEmail = updates.companyEmail !== undefined ? updates.companyEmail : updates.email;
    const normalizedCompanyPhone = updates.companyPhone !== undefined ? updates.companyPhone : updates.phone;

    const user = await User.findOne({
      where: { id, role: 'company' },
      include: [{ model: CompanyProfile, required: false }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (updates.name !== undefined) user.name = updates.name;
    if (normalizedUserEmail !== undefined) user.email = normalizedUserEmail;
    if (normalizedUserPhone !== undefined) user.phone = normalizedUserPhone;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    await user.save();

    const allowedProfileFields = [
      'companyName',
      'description',
      'website',
      'logo',
      'location',
      'industry',
      'tagline',
      'about',
      'companySize',
      'foundedYear',
      'phone',
      'email',
      'linkedin',
      'twitter',
      'facebook',
      'instagram',
      'github',
      'banner',
    ];

    const profilePayload = {};
    allowedProfileFields.forEach((field) => {
      if (updates[field] !== undefined) profilePayload[field] = updates[field];
    });
    if (normalizedCompanyEmail !== undefined) profilePayload.email = normalizedCompanyEmail;
    if (normalizedCompanyPhone !== undefined) profilePayload.phone = normalizedCompanyPhone;

    if (Object.keys(profilePayload).length > 0) {
      if (user.CompanyProfile) {
        await user.CompanyProfile.update(profilePayload);
      } else {
        await CompanyProfile.create({
          userId: user.id,
          companyName: profilePayload.companyName || user.name || 'Company',
          ...profilePayload,
        });
      }
    }

    const refreshed = await User.findOne({
      where: { id, role: 'company' },
      attributes: { exclude: ['password', 'otp', 'otpExpires'] },
      include: [
        {
          model: CompanyProfile,
          required: false,
          attributes: ['id', 'companyName', 'location', 'industry', 'logo', 'tagline'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company: mapCompanyUser(refreshed) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Delete company user (profile/jobs cascade with FK rules)
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, role: 'company' } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
